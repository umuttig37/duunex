'use client';

import TaskEditForm from '@/components/features/tasks/task-edit-form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/shared/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Task = Database['public']['Tables']['tasks']['Row'] & {
  categories?: {
    id: string;
    name_fi: string;
    name?: string;
  } | null;
  task_attachments?: {
    id: string;
    file_url: string;
    file_type: string | null;
  }[];
  latitude?: number | null;
  longitude?: number | null;
};

type UserProfile = Database['public']['Tables']['profiles']['Row'];

interface TaskEditClientWrapperProps {
  task: Task;
  currentUser: any;
  userProfile: UserProfile;
}

export interface TaskEditFormData {
  title: string;
  description: string;
  budget: number | null;
  location_text: string;
  latitude: number | null;
  longitude: number | null;
  scheduled_date: Date | null;
  scheduled_time_slot: 'morning' | 'afternoon' | 'evening' | 'flexible' | null;
  existingAttachments: {
    id: string;
    file_url: string;
    file_type: string | null;
  }[];
  newImages: File[];
  deletedAttachmentIds: string[];
}

export default function TaskEditClientWrapper({
  task,
  currentUser,
  userProfile,
}: TaskEditClientWrapperProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const initialFormData: TaskEditFormData = {
    title: task.title,
    description: task.description,
    budget: task.budget,
    location_text: task.location_text,
    latitude: task.latitude,
    longitude: task.longitude,
    scheduled_date: task.scheduled_date ? new Date(task.scheduled_date) : null,
    scheduled_time_slot: task.scheduled_time_slot as TaskEditFormData['scheduled_time_slot'],
    existingAttachments: task.task_attachments || [],
    newImages: [],
    deletedAttachmentIds: [],
  };

  const handleCancel = () => {
    router.push(`/dashboard/tasks/${task.id}`);
  };

  const handleSubmit = async (formData: TaskEditFormData) => {
    setIsSubmitting(true);

    try {
      // Convert new images to base64
      const newImagesBase64: string[] = [];
      for (const file of formData.newImages) {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          newImagesBase64.push(base64);
        } catch (error) {
          console.error('Error converting image to base64:', error);
          toast({
            title: 'Virhe',
            description: 'Kuvan käsittely epäonnistui',
            variant: 'destructive',
          });
          return;
        }
      }

      // Call the API to update the task
      const response = await fetch(`/api/tasks/${task.id}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          budget: formData.budget,
          location_text: formData.location_text,
          latitude: formData.latitude,
          longitude: formData.longitude,
          scheduled_date: formData.scheduled_date?.toISOString() || null,
          scheduled_time_slot: formData.scheduled_time_slot,
          newImages: newImagesBase64,
          deletedAttachmentIds: formData.deletedAttachmentIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Virhe päivittäessä tehtävää');
      }

      const result = await response.json();

      toast({
        title: 'Tehtävä päivitetty',
        description: 'Tehtävän tiedot on päivitetty onnistuneesti.',
      });

      // Redirect back to task detail page
      router.push(`/dashboard/tasks/${task.id}`);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Virhe',
        description: error instanceof Error ? error.message : 'Tehtävän päivittäminen epäonnistui.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Takaisin tehtävään
        </Button>
      </div>

      {/* Edit form */}
      <TaskEditForm
        initialData={initialFormData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        taskId={task.id}
        category={task.categories}
      />
    </div>
  );
}