import { z } from 'zod';

// Zod schema for task creation with Finnish messages
// Zod schema for task creation aligned with blueprint
export const TaskSchema = z.object({
  title: z.string().min(5, 'Otsikon tulee olla vähintään 5 merkkiä pitkä'),
  description: z.string().min(10, 'Kuvauksen tulee olla vähintään 10 merkkiä pitkä'),
  categoryId: z.string().uuid('Virheellinen kategoria valittu'),
  location_text: z.string().min(3, 'Sijainti (tekstinä) vaaditaan'),
  budget: z.coerce.number({ invalid_type_error: 'Budjetin on oltava numero' }).positive('Budjetin on oltava positiivinen numero'),
  dueDate: z.string().optional(),
  image_urls: z.array(z.string().url('Kuvan URL on virheellinen')).optional(), // Optional array of image URLs
  latitude: z.number({ required_error: 'Sijainnin leveysaste kartalta vaaditaan', invalid_type_error: 'Leveysasteen on oltava numero' }),
  longitude: z.number({ required_error: 'Sijainnin pituusaste kartalta vaaditaan', invalid_type_error: 'Pituusasteen on oltava numero' }),
}).catchall(z.any()); // Allow dynamic category-specific question fields

// Type for the server action state, used by useActionState
export type TaskFormState = {
  message: string | null;
  errors?: {
    title?: string[];
    description?: string[];
    categoryId?: string[];
    location_text?: string[]; // Updated field name
    budget?: string[];
    dueDate?: string[];
    latitude?: string[]; // Added field
    longitude?: string[]; // Added field
    auth?: string[];
    database?: string[];
  };
  success: boolean;
};
