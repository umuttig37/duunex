import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendChatMessageEmail } from '@/services/notifications/email-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const taskId = String(body?.taskId || '');
    const receiverId = String(body?.receiverId || '');
    const contentRaw = typeof body?.content === 'string' ? body.content : '';
    const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl : undefined;

    const content = contentRaw.trim();

    if (!taskId || !receiverId) {
      return NextResponse.json({ error: 'Missing taskId/receiverId' }, { status: 400 });
    }

    if (!content && !imageUrl) {
      return NextResponse.json({ error: 'Missing content or imageUrl' }, { status: 400 });
    }

    // Validate participants & fetch task title for email links
    const { data: task } = await supabase
      .from('tasks')
      .select('id, title, user_id, assigned_tasker_id, status')
      .eq('id', taskId)
      .single();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const senderId = user.id;
    const isSenderOwner = task.user_id === senderId;
    const isSenderTasker = task.assigned_tasker_id === senderId;

    if (!isSenderOwner && !isSenderTasker) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const expectedReceiverId = isSenderOwner ? task.assigned_tasker_id : task.user_id;
    if (!expectedReceiverId || receiverId !== expectedReceiverId) {
      return NextResponse.json({ error: 'Receiver mismatch' }, { status: 403 });
    }

    // Insert message
    const messageData: any = {
      task_id: taskId,
      sender_profile_id: senderId,
      receiver_profile_id: receiverId,
      content: content || (imageUrl ? 'Kuva' : ''),
      is_read: false,
      message_type: imageUrl ? 'image' : 'text',
    };

    if (imageUrl) {
      messageData.image_url = imageUrl;
    }

    const { data: insertedMessage, error: insertError } = await supabase
      .from('messages')
      .insert(messageData)
      .select(`
        *,
        sender:profiles!messages_sender_profile_id_fkey(*),
        receiver:profiles!messages_receiver_profile_id_fkey(*)
      `)
      .single();

    if (insertError || !insertedMessage) {
      return NextResponse.json(
        { error: insertError?.message || 'Failed to insert message' },
        { status: 500 }
      );
    }

    // Send email to receiver if enabled
    try {
      const { data: receiverProfile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, email, email_notifications')
        .eq('id', receiverId)
        .single();

      const receiverEmail = receiverProfile?.email || null;
      const emailNotifications = receiverProfile?.email_notifications ?? true;

      if (receiverEmail && emailNotifications) {
        const { data: senderProfile } = await supabaseAdmin
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', senderId)
          .single();

        const senderName = `${senderProfile?.first_name || ''} ${senderProfile?.last_name || ''}`.trim() || 'Tekijä';

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const taskUrl = `${appUrl}/messages?task=${taskId}`;

        await sendChatMessageEmail(
          {
            messageId: insertedMessage.id,
            taskId,
            taskTitle: task.title || 'Tehtävä',
            senderName,
            recipientFirstName: receiverProfile?.first_name || 'Ystävä',
            messagePreview: content || 'Kuva',
            taskUrl,
          },
          receiverEmail,
          receiverId
        );
      }
    } catch (emailError) {
      // Email failures should not break chat sending
      console.warn('Chat message email failed:', emailError);
    }

    return NextResponse.json({ success: true, message: insertedMessage }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

