"use client";

// Use useActionState from React instead of useFormState from react-dom
import { createTask } from "@/app/dashboard/tasks/actions";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom"; // Keep useFormStatus
import { useForm } from "react-hook-form";
import * as z from "zod";
// Import schema and state type from schema.ts (path might need adjustment if form moved)
import { TaskFormState, TaskSchema } from "@/app/dashboard/tasks/schema";
import type { DynamicQuestion } from '@/components/shared/forms/dynamic-question';
import { DynamicQuestionsSection } from '@/components/shared/forms/dynamic-questions-section';
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/shared/use-toast";
import { createClient } from '@/lib/supabase/client';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fi } from 'date-fns/locale'; // Import Finnish locale for date formatting
import { CalendarIcon } from "lucide-react";
import dynamic from 'next/dynamic';

// Dynamically import LocationPicker with SSR disabled
const LocationPicker = dynamic(
  () => import('@/components/ui/location-picker').then((mod) => mod.LocationPicker),
  { ssr: false } // Disable SSR
);

type TaskFormValues = z.infer<typeof TaskSchema>;

interface TaskFormProps {
  categories: { id: string; name: string }[];
}

// Submit button remains the same
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? "Lähetetään tehtävää..." : "Julkaise tehtävä"}
    </Button>
  );
}

export default function TaskForm({ categories }: TaskFormProps) {
  const { toast } = useToast();
  const initialState: TaskFormState = { message: null, errors: {}, success: false };
  // Use useActionState
  const [state, dispatch] = useActionState(createTask, initialState);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      title: "",
      description: "",
      location_text: "", // Changed from location
      // Remove locationLat/locationLng
    },
  });

  const [locationCoords, setLocationCoords] = React.useState<{ lat: number; lng: number } | null>(null);

  // Advanced image upload state
  const [imageFiles, setImageFiles] = React.useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // Dynamic questions state
  const [categoryQuestions, setCategoryQuestions] = React.useState<DynamicQuestion[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | undefined>();

  // Preview logic
  React.useEffect(() => {
    if (imageFiles.length === 0) {
      setImagePreviews([]);
      return;
    }
    const urls = imageFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [imageFiles]);

  // Supabase upload logic
  const supabase = createClient();
  const handleImageUpload = async (files: File[]) => {
    setUploading(true);
    setUploadError(null);
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from('task-images').upload(fileName, file);
      if (error) {
        setUploadError('Kuvan lataus epäonnistui. Yritä uudelleen.');
        setUploading(false);
        return null;
      }
      const { data: publicUrlData } = supabase.storage.from('task-images').getPublicUrl(fileName);
      if (publicUrlData?.publicUrl) {
        urls.push(publicUrlData.publicUrl);
      }
    }
    setUploading(false);
    return urls;
  };

  useEffect(() => {
    // Translate toast messages
    if (state.success === false && state.message) {
      // Consider mapping specific server errors to Finnish messages here if needed
      const defaultErrorMessage = "Tehtävän luominen epäonnistui. Tarkista kentät.";
      toast({
        title: "Virhe",
        // Use state.message if available, otherwise default
        description: state.message || defaultErrorMessage,
        variant: "destructive",
      });
    }
    // Success is handled by redirect in server action
  }, [state, toast]);

  return (
    <Form {...form}>
      <form action={dispatch} className="space-y-8">
        {/* Display general form error message from server */}
        {state.message && !state.success && (
          <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
            {/* Consider mapping state.message to Finnish here too */}
            {state.message || "Tapahtui virhe."}
          </div>
        )}

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tehtävän otsikko</FormLabel>
              <FormControl>
                <Input placeholder="Esim. Tarvitsen apua muuttolaatikoiden kantamisessa" {...field} name="title" />
              </FormControl>
              <FormDescription>
                Selkeä ja ytimekäs otsikko tehtävällesi.
              </FormDescription>
              {state.errors?.title && (
                <p className="text-sm font-medium text-destructive">{state.errors.title[0]}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kuvaus</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Kuvaile tehtävää tarkemmin..."
                  className="resize-none"
                  {...field}
                  name="description"
                />
              </FormControl>
              <FormDescription>
                Anna mahdollisimman paljon yksityiskohtia siitä, mitä pitää tehdä.
              </FormDescription>
              {state.errors?.description && (
                <p className="text-sm font-medium text-destructive">{state.errors.description[0]}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategoria</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedCategoryId(value);
                }}
                defaultValue={field.value}
                name="categoryId"
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Valitse kategoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} {/* Assuming category names are already Finnish */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Valitse tehtävääsi parhaiten sopiva kategoria.
              </FormDescription>
              {state.errors?.categoryId && (
                <p className="text-sm font-medium text-destructive">{state.errors.categoryId[0]}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location (address/description) */}
        <FormField
          control={form.control}
          name="location_text" // Changed from location
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sijainti (osoite tai alue)</FormLabel>
              <FormControl>
                <Input placeholder="Esim. Helsinki, Kamppi" {...field} name="location_text" />
              </FormControl>
              <FormDescription>Kirjoita osoite tai alue. Valitse tarkka sijainti kartalta alla.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* LocationPicker for coordinates */}
        <div>
          <FormLabel>Valitse sijainti kartalta</FormLabel>
          <LocationPicker
            value={locationCoords || undefined}
            onChange={(coords) => {
              setLocationCoords(coords);
              // Set hidden fields for form submission
              form.setValue('latitude', coords.lat, { shouldValidate: true }); // Changed from locationLat
              form.setValue('longitude', coords.lng, { shouldValidate: true }); // Changed from locationLng
            }}
            height="300px"
          />
          {/* Hidden fields for coordinates */}
          <input type="hidden" {...form.register('latitude', { valueAsNumber: true })} />
          <input type="hidden" {...form.register('longitude', { valueAsNumber: true })} />
          {/* Show validation errors for coordinates */}
          {form.formState.errors.latitude && <FormMessage>{form.formState.errors.latitude.message}</FormMessage>}
          {form.formState.errors.longitude && <FormMessage>{form.formState.errors.longitude.message}</FormMessage>}
        </div>

        {/* Budget */}
        <FormField
          control={form.control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budjetti (€)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Esim. 50" {...field} step="0.01" name="budget" />
              </FormControl>
              <FormDescription>
                Syötä summa, jonka olet valmis maksamaan tästä tehtävästä.
              </FormDescription>
              {state.errors?.budget && (
                <p className="text-sm font-medium text-destructive">{state.errors.budget[0]}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Due Date (Optional) */}
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Määräaika (Valinnainen)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        // Format date using Finnish locale
                        format(new Date(field.value), "PPP", { locale: fi })
                      ) : (
                        <span>Valitse päivä</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    locale={fi} // Use Finnish locale for Calendar
                  />
                </PopoverContent>
              </Popover>
              <input type="hidden" {...field} name="dueDate" value={field.value || ''} />
              <FormDescription>
                Valinnainen: Mihin mennessä tehtävä tulee olla valmis?
              </FormDescription>
              {state.errors?.dueDate && (
                <p className="text-sm font-medium text-destructive">{state.errors.dueDate[0]}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image upload field (multiple, preview, error handling) */}
        <FormField
          control={form.control}
          name="image_urls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kuvat (max 3)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []).slice(0, 3);
                    setImageFiles(files);
                    if (files.length > 0) {
                      setUploading(true);
                      const urls = await handleImageUpload(files);
                      setUploading(false);
                      if (urls && urls.length > 0) {
                        field.onChange(urls);
                        // Ensure hidden inputs for each image URL for FormData
                        setTimeout(() => {
                          const formEl = document.querySelector('form');
                          if (formEl) {
                            // Remove old hidden fields
                            formEl.querySelectorAll('input[name="image_urls"]').forEach(el => el.remove());
                            urls.forEach(url => {
                              const input = document.createElement('input');
                              input.type = 'hidden';
                              input.name = 'image_urls';
                              input.value = url;
                              formEl.appendChild(input);
                            });
                          }
                        }, 0);
                      }
                    }
                  }}
                />
              </FormControl>
              {uploading && <div className="text-blue-600 text-sm mt-2">Ladataan kuvia...</div>}
              {uploadError && <div className="text-red-600 text-sm mt-2">{uploadError}</div>}
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {imagePreviews.map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt={`Esikatselu ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded border"
                    />
                  ))}
                </div>
              )}
              <FormDescription>Voit lisätä jopa 3 kuvaa. Kaikki kuvat tallennetaan liitteiksi.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dynamic Category-Specific Questions */}
        <DynamicQuestionsSection
          categoryId={selectedCategoryId}
          onQuestionsLoaded={(questions) => {
            setCategoryQuestions(questions);
            // Register dynamic fields with react-hook-form
            questions.forEach(question => {
              const fieldName = `category_question_${question.id}`;
              if (question.question_type === 'select_multiple') {
                form.register(fieldName, { value: [] });
              } else {
                form.register(fieldName, { value: question.is_required ? undefined : '' });
              }
            });
          }}
        />

        {/* Use the separate SubmitButton component */}
        <SubmitButton />
      </form>
    </Form>
  );
}
