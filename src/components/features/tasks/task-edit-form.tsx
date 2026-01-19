'use client';

import type { TaskEditFormData } from '@/app/dashboard/tasks/edit/[id]/task-edit-client-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PlacesInput from '@/components/ui/places-input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/shared/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Euro, Image as ImageIcon, MapPin, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

// Custom hook to manage object URLs with proper cleanup
const useObjectURLs = (files: File[]): string[] => {
  const urls = useMemo(() => {
    return files.map(file => URL.createObjectURL(file));
  }, [files]);

  useEffect(() => {
    // Cleanup function to revoke all object URLs
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [urls]);

  return urls;
};

interface TaskEditFormProps {
  initialData: TaskEditFormData;
  onSubmit: (data: TaskEditFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  taskId: string;
  category?: {
    id: string;
    name_fi: string;
    name?: string;
  } | null;
}

export default function TaskEditForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  taskId,
  category,
}: TaskEditFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<TaskEditFormData>(initialData);
  const [isDragOver, setIsDragOver] = useState(false);

  // Use custom hook to manage object URLs with proper cleanup
  const newImagePreviewUrls = useObjectURLs(formData.newImages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Handle location selection from Google Places
  const handleLocationChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      location_text: address,
      latitude: coordinates?.lat || null,
      longitude: coordinates?.lng || null,
    }));
  };

  // Handle form field changes
  const handleInputChange = (field: keyof TaskEditFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle file selection
  const handleFileSelect = (files: FileList) => {
    const validFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Virheellinen tiedostotyyppi',
          description: 'Sallitut tiedostotyypit: JPG, PNG, WebP',
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: 'Tiedosto liian suuri',
          description: `${file.name} on liian suuri. Maksimikoko 10MB.`,
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const totalImages = formData.existingAttachments.length + formData.newImages.length + validFiles.length;
      if (totalImages > 5) {
        toast({
          title: 'Liian monta kuvaa',
          description: 'Maksimissaan 5 kuvaa sallittu',
          variant: 'destructive',
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        newImages: [...prev.newImages, ...validFiles],
      }));
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  // Remove new image
  const removeNewImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
    }));
  };

  // Mark existing attachment for deletion
  const removeExistingAttachment = (attachmentId: string) => {
    setFormData(prev => ({
      ...prev,
      existingAttachments: prev.existingAttachments.filter(a => a.id !== attachmentId),
      deletedAttachmentIds: [...prev.deletedAttachmentIds, attachmentId],
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast({
        title: 'Virhe',
        description: 'Otsikko on pakollinen',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Virhe',
        description: 'Kuvaus on pakollinen',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.location_text.trim()) {
      toast({
        title: 'Virhe',
        description: 'Sijainti on pakollinen',
        variant: 'destructive',
      });
      return;
    }

    if (formData.budget && formData.budget < 10) {
      toast({
        title: 'Virhe',
        description: 'Budjetti ei voi olla alle 10€',
        variant: 'destructive',
      });
      return;
    }

    await onSubmit(formData);
  };

  const timeSlots = [
    { value: 'morning', label: 'Aamu (8-12)' },
    { value: 'afternoon', label: 'Iltapäivä (12-17)' },
    { value: 'evening', label: 'Ilta (17-21)' },
    { value: 'flexible', label: 'Joustava' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Perustiedot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Otsikko *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Esim. Kodin siivous, huonekalujen kokoaminen..."
              maxLength={100}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/100 merkkiä
            </p>
          </div>

          <div>
            <Label htmlFor="description">Kuvaus *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Kerro tarkemmin mitä tehtävä sisältää..."
              rows={4}
              maxLength={1000}
              className="mt-1 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/1000 merkkiä
            </p>
          </div>

          {category && (
            <div>
              <Label>Kategoria</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm text-gray-700">
                {category.name_fi}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Budjetti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="budget">Budjetti (€)</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget || ''}
              onChange={(e) =>
                handleInputChange('budget', e.target.value ? parseFloat(e.target.value) : null)
              }
              placeholder="Esim. 50"
              min="10"
              step="1"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Vähimmäisbudjetti 10€. Jätä tyhjäksi jos haluat keskustella hinnasta tekijöiden kanssa.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Location Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Sijainti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="location">Osoite *</Label>
            <PlacesInput
              value={formData.location_text}
              onChange={handleLocationChange}
              placeholder="Syötä osoite tai postinumero..."
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Aikataulu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="scheduled_date">Toivottu päivämäärä</Label>
            <Input
              id="scheduled_date"
              type="date"
              value={
                formData.scheduled_date
                  ? new Date(formData.scheduled_date.getTime() - formData.scheduled_date.getTimezoneOffset() * 60000)
                    .toISOString()
                    .split('T')[0]
                  : ''
              }
              onChange={(e) =>
                handleInputChange(
                  'scheduled_date',
                  e.target.value ? new Date(e.target.value + 'T00:00:00') : null
                )
              }
              min={new Date().toISOString().split('T')[0]}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="scheduled_time_slot">Toivottu aika</Label>
            <select
              id="scheduled_time_slot"
              value={formData.scheduled_time_slot || ''}
              onChange={(e) =>
                handleInputChange('scheduled_time_slot', e.target.value || null)
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Ei määritetty</option>
              {timeSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Images Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Kuvat ({formData.existingAttachments.length + formData.newImages.length}/5)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Images */}
          {formData.existingAttachments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {formData.existingAttachments.map((attachment) => (
                <div key={attachment.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={attachment.file_url}
                      alt="Tehtävän kuva"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="transition-transform group-hover:scale-105"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExistingAttachment(attachment.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New Images */}
          {formData.newImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {formData.newImages.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={newImagePreviewUrls[index]}
                      alt="Uusi kuva"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="transition-transform group-hover:scale-105"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Area */}
          {formData.existingAttachments.length + formData.newImages.length < 5 && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
                }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Lisää kuvia tehtävästä
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Raahaa kuvia tähän tai klikkaa valitaksesi
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP • Max 10MB per kuva • Max 5 kuvaa
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="sm:w-auto"
        >
          Peruuta
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="sm:flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Tallennetaan...
            </div>
          ) : (
            'Tallenna muutokset'
          )}
        </Button>
      </div>
    </form>
  );
}