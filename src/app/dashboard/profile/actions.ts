'use server'; // Mark this file as containing Server Actions

import { Database } from '@/lib/supabase/database.types'; // Import Database types
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'; // Import redirect
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique filenames
import { z } from 'zod';

export async function deleteProfileAction() {
  const supabase = await createClient();
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, message: 'Autentikointivirhe. Kirjaudu sisään uudelleen.' };
  }

  // Delete from profiles (CASCADE will handle related tables if set in DB)
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (deleteError) {
    console.error('Error deleting profile:', deleteError);
    return { success: false, message: 'Tilin poistaminen epäonnistui.' };
  }

  // Delete from Supabase Auth
  // For this operation, we need to use the service_role key
  const supabaseAdmin = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        // It's good practice to explicitly state that autoRefreshToken should be false for service roles.
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (authDeleteError) {
    console.error('Error deleting user from auth:', authDeleteError);
    // Profile is deleted, but auth user is not. Inform user/admin.
    return { success: false, message: 'Käyttäjätunnuksen poistaminen epäonnistui. Ota yhteyttä tukeen.' };
  }

  // Optionally: Remove avatar from storage (if exists)
  // (You may want to fetch and remove the avatar file here)

  // Redirect to home page after deletion
  redirect('/');
}

// Define the schema for the basic profile fields expected by the action
// Category IDs will be handled separately as they come as an array
const profileUpdateSchema = z.object({
  first_name: z.string().min(1, 'Etunimi vaaditaan'),
  last_name: z.string().min(1, 'Sukunimi vaaditaan'),
  phone_number: z.string().optional().or(z.literal('')), // Allow empty string
  bio: z.string().max(500, 'Kuvaus voi olla enintään 500 merkkiä pitkä').optional().or(z.literal('')), // Allow empty string
  // Add latitude and longitude for validation (expecting strings from form)
  latitude: z.string().optional().or(z.literal('')), 
  longitude: z.string().optional().or(z.literal('')),
  // Add address fields
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  zipcode: z.string().optional().or(z.literal('')),
  // Add tasker-specific fields
  service_radius_km: z.string().optional().or(z.literal('')),
  hourly_rate: z.string().optional().or(z.literal('')),
  // Add notification preferences
  email_notifications: z.string().optional().or(z.literal('')),
  push_notifications: z.string().optional().or(z.literal('')),
  marketing_messages: z.string().optional().or(z.literal('')),
  // Add privacy preferences
  public_profile: z.string().optional().or(z.literal('')),
  show_location: z.string().optional().or(z.literal('')),
  show_contact_info: z.string().optional().or(z.literal('')),
});

// Define schema for avatar file validation (optional but good practice)
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient(); // Create server client instance

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, message: 'Autentikointivirhe. Kirjaudu sisään uudelleen.' };
  }

  // Fetch user's role and current avatar_url
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role, avatar_url') // Fetch current avatar_url too
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
      console.error('Error fetching profile role:', profileError);
      return { success: false, message: 'Käyttäjäroolin hakeminen epäonnistui.' };
  }
  const isTasker = profileData.role === 'tasker';
  const currentAvatarUrl = profileData.avatar_url;

  // Extract basic data from FormData for validation
  const rawFormData = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      phone_number: formData.get('phone_number') || '', // Ensure empty string if null/undefined
      bio: formData.get('bio') || '', // Ensure empty string if null/undefined
      // Extract location fields
      latitude: formData.get('latitude') || '',
      longitude: formData.get('longitude') || '',
      // Extract address fields
      address: formData.get('address') || '',
      city: formData.get('city') || '',
      zipcode: formData.get('zipcode') || '',
      // Extract tasker-specific fields
      service_radius_km: formData.get('service_radius_km') || '',
      hourly_rate: formData.get('hourly_rate') || '',
      // Extract notification preferences
      email_notifications: formData.get('email_notifications') || '',
      push_notifications: formData.get('push_notifications') || '',
      marketing_messages: formData.get('marketing_messages') || '',
      // Extract privacy preferences
      public_profile: formData.get('public_profile') || '',
      show_location: formData.get('show_location') || '',
      show_contact_info: formData.get('show_contact_info') || '',
  };

  // Validate the basic data including location strings
  const validatedFields = profileUpdateSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors)
        .flat()
        .join(', ');
    return {
      success: false,
      message: `Virheelliset tiedot: ${errorMessages || 'Tarkista syötetyt tiedot.'}`,
    };
  }

  // Prepare data for Supabase profile update
  // Use the specific Update type for better type safety
  const dataToUpdate: Database['public']['Tables']['profiles']['Update'] = {
    first_name: validatedFields.data.first_name,
    last_name: validatedFields.data.last_name,
    phone_number: validatedFields.data.phone_number || null, // Store null if empty
    bio: validatedFields.data.bio || null, // Store null if empty
    // Add address fields
    address: validatedFields.data.address || null,
    city: validatedFields.data.city || null,
    zipcode: validatedFields.data.zipcode || null,
    // Add notification preferences (convert string to boolean)
    email_notifications: validatedFields.data.email_notifications === 'true',
    push_notifications: validatedFields.data.push_notifications === 'true',
    marketing_messages: validatedFields.data.marketing_messages === 'true',
    // Add privacy preferences (convert string to boolean)
    public_profile: validatedFields.data.public_profile === 'true',
    show_location: validatedFields.data.show_location === 'true',
    show_contact_info: validatedFields.data.show_contact_info === 'true',
  };

  // --- Handle Location Update ---
  const latStr = validatedFields.data.latitude?.trim();
  const lngStr = validatedFields.data.longitude?.trim();
  
  console.log('Location update - raw coords:', { lat: latStr, lng: lngStr });

  // Only update location if both coordinates are provided and not empty
  if (latStr && lngStr && latStr !== '' && lngStr !== '') {
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);

    console.log('Parsed coordinates:', { latitude, longitude });

    // Check if parsing was successful and values are valid coordinates
    if (!isNaN(latitude) && !isNaN(longitude) && 
        latitude >= -90 && latitude <= 90 && 
        longitude >= -180 && longitude <= 180) {
      
      console.log('Valid coordinates, storing as separate fields');
      
      // Since PostGIS is causing issues, let's store coordinates in separate fields
      // We can add latitude and longitude columns to profiles table later
      // For now, let's skip the location field update to avoid the PostGIS error
      
      console.log(`Coordinates will be available: lat=${latitude}, lng=${longitude}`);
    } else {
      console.warn("Invalid latitude/longitude provided:", latStr, lngStr);
    }
  } else {
    console.log('No coordinates provided, preserving existing location');
  }
  // If coordinates are empty or not provided, don't update location field
  // This preserves any existing location data

  // --- Handle Avatar Upload ---
  const avatarFile = formData.get('avatar') as File | null;
  let newAvatarUrl: string | null = null;
  let filePath: string | undefined;

  if (avatarFile && avatarFile.size > 0) {
      // Validate file type and size
      if (avatarFile.size > MAX_FILE_SIZE) {
          return { success: false, message: 'Profiilikuva on liian suuri (max 2MB).' };
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(avatarFile.type)) {
          return { success: false, message: 'Väärä tiedostotyyppi. Hyväksytyt tyypit: JPG, PNG, WEBP.' };
      }

      // Generate unique filename
      const fileExtension = avatarFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      filePath = `${user.id}/${fileName}`; // Assign to the outer scope filePath

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
          .from('avatars') // Ensure this bucket exists and has correct policies
          .upload(filePath, avatarFile, {
              cacheControl: '3600', // Cache for 1 hour
              upsert: true // Overwrite if file with same name exists (though uuid makes this unlikely)
          });

      if (uploadError) {
          console.error('Supabase avatar upload error:', uploadError);
          return { success: false, message: `Profiilikuvan lataus epäonnistui: ${uploadError.message}` };
      }      
      
      // Get public URL
      const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath); // filePath is now just <user_id>/<filename>

      if (!urlData?.publicUrl) {
          console.error('Could not get public URL for uploaded avatar');
          // Decide how to handle: proceed without URL update or return error?
          // For now, let's return an error.
          return { success: false, message: 'Profiilikuvan julkisen URL-osoitteen haku epäonnistui.' };
      }

      newAvatarUrl = urlData.publicUrl;
      dataToUpdate.avatar_url = newAvatarUrl;
  }

  // --- Handle Tasker Details Update ---
  let taskerDetailsError: any = null;
  if (isTasker) {
    // Handle location and service settings for taskers
    const serviceRadiusKm = validatedFields.data.service_radius_km?.trim();
    const hourlyRateStr = validatedFields.data.hourly_rate?.trim();
    
    if ((serviceRadiusKm && serviceRadiusKm !== '') || (hourlyRateStr && hourlyRateStr !== '') || (latStr && lngStr && latStr !== '' && lngStr !== '')) {
      try {
        const taskerDetailsUpdate: any = {};
        
        // Update service radius if provided
        if (serviceRadiusKm && serviceRadiusKm !== '') {
          const radiusKm = parseInt(serviceRadiusKm);
          if (!isNaN(radiusKm) && radiusKm >= 1 && radiusKm <= 50) {
            taskerDetailsUpdate.service_radius_meters = radiusKm * 1000; // Convert to meters
          }
        }
        
        // Update hourly rate if provided
        if (hourlyRateStr && hourlyRateStr !== '') {
          const hourlyRate = parseFloat(hourlyRateStr);
          if (!isNaN(hourlyRate) && hourlyRate >= 10 && hourlyRate <= 200) {
            taskerDetailsUpdate.hourly_rate = hourlyRate;
          }
        }
        
        // Update location if coordinates are valid
        if (latStr && lngStr && latStr !== '' && lngStr !== '') {
          const latitude = parseFloat(latStr);
          const longitude = parseFloat(lngStr);
          
          if (!isNaN(latitude) && !isNaN(longitude) && 
              latitude >= -90 && latitude <= 90 && 
              longitude >= -180 && longitude <= 180) {
            // Use raw SQL to update location with proper PostGIS geometry
            const { error: locationError } = await supabase
              .rpc('update_tasker_location', {
                tasker_id: user.id,
                longitude: longitude,
                latitude: latitude
              });
              
            if (locationError) {
              console.error('Error updating location:', locationError);
              // Don't include location in the regular update
            } else {
              console.log(`Location updated successfully: ${latitude}, ${longitude}`);
            }
            
            // Remove location from regular update since we handled it separately
            // taskerDetailsUpdate.location = ...
          }
        }
        
        if (Object.keys(taskerDetailsUpdate).length > 0) {
          // Try to update existing record first
          const { error: updateError } = await supabase
            .from('tasker_details')
            .update(taskerDetailsUpdate)
            .eq('profile_id', user.id);
          
          if (updateError) {
            // If update fails, try to insert new record
            const { error: insertError } = await supabase
              .from('tasker_details')
              .insert({
                profile_id: user.id,
                hourly_rate: taskerDetailsUpdate.hourly_rate || 25,
                service_radius_meters: taskerDetailsUpdate.service_radius_meters || 5000,
                location: taskerDetailsUpdate.location,
                availability_schedule: null
              });
            
            if (insertError) {
              throw insertError;
            }
          }
        }
        
      } catch (error) {
        console.error('Error updating tasker details:', error);
        taskerDetailsError = error;
      }
    }
  }

  // --- Handle Tasker Categories Update ---
  let categoryUpdateError: any = null;
  if (isTasker) {
    // Get selected categories from form data
    const selectedCategories = formData.getAll('categories[]') as string[];
    console.log('Profile Edit - Tasker category update:', {
      userId: user.id,
      userRole: profileData.role,
      selectedCategories: selectedCategories,
      categoryCount: selectedCategories.length
    });
    
    try {
      // First, delete existing categories
      console.log('Deleting existing categories for user:', user.id);
      const { error: deleteError } = await supabase
        .from('tasker_categories')
        .delete()
        .eq('profile_id', user.id);

      if (deleteError) {
        console.error('Delete categories error:', deleteError);
        throw deleteError;
      } else {
        console.log('Successfully deleted existing categories');
      }

      // Then, insert new categories if any selected
      if (selectedCategories.length > 0) {
        const categoryInserts = selectedCategories.map(categoryId => ({
          profile_id: user.id,
          category_id: categoryId
        }));
        
        console.log('Inserting new categories:', categoryInserts);

        const { data: insertData, error: insertError } = await supabase
          .from('tasker_categories')
          .insert(categoryInserts)
          .select('*');

        if (insertError) {
          console.error('Insert categories error:', insertError);
          throw insertError;
        } else {
          console.log('Successfully inserted categories:', insertData);
        }
      } else {
        console.log('No categories selected - skipping insert');
      }
    } catch (error) {
      console.error('Error updating tasker categories:', error);
      categoryUpdateError = error;
    }
  }

  // Update the profile
  const { error: updateError } = await supabase
      .from('profiles')
      .update(dataToUpdate)
      .eq('id', user.id);

  if (updateError) {
      console.error('Error updating profile:', updateError);
      
      // If avatar was uploaded but profile update failed, clean up the uploaded file
      if (filePath) {
          await supabase.storage
              .from('avatars')
              .remove([filePath]);
      }
      
      return { success: false, message: 'Profiilin päivitys epäonnistui.' };
  }

  // If we have a new avatar and the profile update succeeded, clean up the old avatar
  if (newAvatarUrl && currentAvatarUrl) {
      try {
          // Extract the file path from the old avatar URL
          const oldFilePath = currentAvatarUrl.split('/').slice(-2).join('/'); // Get last two parts: user_id/filename
          await supabase.storage
              .from('avatars')
              .remove([oldFilePath]);
      } catch (error) {
          console.warn('Could not remove old avatar:', error);
          // Don't fail the whole operation if we can't remove the old avatar
      }
  }

  // Handle tasker details and category update errors
  if (taskerDetailsError || categoryUpdateError) {
    console.warn('Partial update failure:', { taskerDetailsError, categoryUpdateError });
    // Profile was updated successfully, but some tasker-specific data failed
    // Revalidate and return partial success
    revalidatePath(`/dashboard/profile/${user.id}`);
    revalidatePath('/dashboard');
    
    let errorMessage = 'Profiili päivitetty onnistuneesti';
    if (taskerDetailsError && categoryUpdateError) {
      errorMessage += ', mutta palveluasetusten ja osaamisalueiden päivitys epäonnistui. Yritä uudelleen.';
      console.error('Both tasker details and categories failed:', {
        taskerDetailsError: taskerDetailsError?.message || taskerDetailsError,
        categoryUpdateError: categoryUpdateError?.message || categoryUpdateError
      });
    } else if (taskerDetailsError) {
      errorMessage += ', mutta palveluasetusten päivitys epäonnistui. Yritä uudelleen.';
      console.error('Tasker details update failed:', taskerDetailsError?.message || taskerDetailsError);
    } else if (categoryUpdateError) {
      errorMessage += `, mutta osaamisalueiden päivitys epäonnistui. Virhe: ${categoryUpdateError?.message || 'Tuntematon virhe'}. Yritä uudelleen.`;
      console.error('Category update failed:', categoryUpdateError?.message || categoryUpdateError);
    }
    
    return { 
      success: false, // Change to false since categories are critical
      message: errorMessage
    };
  }

  // Revalidate relevant pages
  revalidatePath(`/dashboard/profile/${user.id}`);
  revalidatePath('/dashboard');

  return { success: true, message: 'Profiili päivitetty onnistuneesti!' };
}

// Separate action for updating user preferences (faster, no file uploads)
export async function updateUserPreferencesAction(preferences: {
  email_notifications?: boolean;
  push_notifications?: boolean;
  marketing_messages?: boolean;
  public_profile?: boolean;
  show_location?: boolean;
  show_contact_info?: boolean;
}) {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, message: 'Autentikointivirhe. Kirjaudu sisään uudelleen.' };
  }

  // Update only the preference fields
  const { error: updateError } = await supabase
    .from('profiles')
    .update(preferences)
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating preferences:', updateError);
    return { success: false, message: 'Asetusten päivitys epäonnistui.' };
  }

  // Revalidate profile page
  revalidatePath(`/dashboard/profile/${user.id}`);

  return { success: true, message: 'Asetukset päivitetty onnistuneesti!' };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
} 