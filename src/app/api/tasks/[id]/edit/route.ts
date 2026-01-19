import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const taskId = resolvedParams.id;

    // Check authentication
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: 'Ei kirjauduttu sisään' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      budget,
      location_text,
      latitude,
      longitude,
      scheduled_date,
      scheduled_time_slot,
      newImages,
      deletedAttachmentIds,
    } = body;

    // Verify task ownership and editability
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, user_id, status')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { message: 'Tehtävää ei löytynyt' },
        { status: 404 }
      );
    }

    if (task.user_id !== currentUser.id) {
      return NextResponse.json(
        { message: 'Ei oikeutta muokata tehtävää' },
        { status: 403 }
      );
    }

    if (task.status !== 'open') {
      return NextResponse.json(
        { message: 'Tehtävää ei voi muokata nykyisessä tilassa' },
        { status: 400 }
      );
    }

    // Check if task has offers
    const { data: offers, error: offersError } = await supabase
      .from('task_offers')
      .select('id')
      .eq('task_id', taskId);

    if (offersError) {
      console.error('Error checking task offers:', offersError);
      return NextResponse.json(
        { message: 'Virhe tarkistettaessa tarjouksia' },
        { status: 500 }
      );
    }

    if (offers && offers.length > 0) {
      return NextResponse.json(
        { message: 'Tehtävää ei voi muokata, kun sillä on tarjouksia' },
        { status: 400 }
      );
    }

    // Validate input
    if (!title?.trim()) {
      return NextResponse.json(
        { message: 'Otsikko on pakollinen' },
        { status: 400 }
      );
    }

    if (!description?.trim()) {
      return NextResponse.json(
        { message: 'Kuvaus on pakollinen' },
        { status: 400 }
      );
    }

    if (!location_text?.trim()) {
      return NextResponse.json(
        { message: 'Sijainti on pakollinen' },
        { status: 400 }
      );
    }

    if (budget && budget < 10) {
      return NextResponse.json(
        { message: 'Budjetti ei voi olla alle 10€' },
        { status: 400 }
      );
    }

    // Begin transaction-like operations
    let location_coordinates = null;
    if (latitude && longitude) {
      location_coordinates = `POINT(${longitude} ${latitude})`;
    }

    // Update task details
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        title: title.trim(),
        description: description.trim(),
        budget: budget || null,
        location_text: location_text.trim(),
        location_coordinates,
        scheduled_date: scheduled_date || null,
        scheduled_time_slot: scheduled_time_slot || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json(
        { message: 'Virhe päivittäessä tehtävää' },
        { status: 500 }
      );
    }

    // Handle deleted attachments
    if (deletedAttachmentIds && deletedAttachmentIds.length > 0) {
      // Get file URLs for cleanup
      const { data: attachmentsToDelete } = await supabase
        .from('task_attachments')
        .select('file_url')
        .in('id', deletedAttachmentIds);

      // Delete from database
      const { error: deleteAttachmentsError } = await supabase
        .from('task_attachments')
        .delete()
        .in('id', deletedAttachmentIds);

      if (deleteAttachmentsError) {
        console.error('Error deleting attachments:', deleteAttachmentsError);
        return NextResponse.json(
          { message: 'Virhe poistaessa kuvia' },
          { status: 500 }
        );
      }

      // Delete files from storage
      if (attachmentsToDelete) {
        for (const attachment of attachmentsToDelete) {
          try {
            const fileName = attachment.file_url.split('/').pop();
            if (fileName) {
              await supabase.storage
                .from('task-images')
                .remove([`${taskId}/${fileName}`]);
            }
          } catch (storageError) {
            console.error('Error deleting file from storage:', storageError);
            // Continue with other operations even if storage cleanup fails
          }
        }
      }
    }

    // Handle new images
    if (newImages && newImages.length > 0) {
      for (let i = 0; i < newImages.length; i++) {
        try {
          const imageData = newImages[i];
          
          // Convert base64 to buffer if needed
          let imageBuffer: Buffer;
          let contentType: string;
          let fileExtension: string;

          if (typeof imageData === 'string') {
            // Handle base64 data
            const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) {
              console.error('Invalid base64 image data');
              continue;
            }
            contentType = matches[1];
            const base64Data = matches[2];
            imageBuffer = Buffer.from(base64Data, 'base64');
            fileExtension = contentType.includes('png') ? 'png' : 'jpg';
          } else {
            // Handle File object (shouldn't happen in API route but just in case)
            console.error('File object received in API route, expected base64 string');
            continue;
          }

          // Generate unique filename
          const fileName = `${Date.now()}-${i}.${fileExtension}`;
          const filePath = `${taskId}/${fileName}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('task-images')
            .upload(filePath, imageBuffer, {
              contentType,
              upsert: false,
            });

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('task-images')
            .getPublicUrl(filePath);

          // Save attachment record
          const { error: attachmentError } = await supabase
            .from('task_attachments')
            .insert({
              task_id: taskId,
              file_url: urlData.publicUrl,
              file_type: contentType,
            });

          if (attachmentError) {
            console.error('Error saving attachment record:', attachmentError);
            // Try to clean up uploaded file
            await supabase.storage
              .from('task-images')
              .remove([filePath]);
          }
        } catch (error) {
          console.error('Error processing image:', error);
          continue;
        }
      }
    }

    return NextResponse.json({
      message: 'Tehtävä päivitetty onnistuneesti',
      taskId,
    });

  } catch (error) {
    console.error('Unexpected error in task edit API:', error);
    return NextResponse.json(
      { message: 'Odottamaton virhe' },
      { status: 500 }
    );
  }
}