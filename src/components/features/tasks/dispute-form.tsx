'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/shared/use-toast';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useTransition } from 'react';

interface DisputeFormProps {
  taskId: string;
  userId: string;
  taskTitle: string;
  onDisputeSubmitted?: () => void;
}

export default function DisputeForm({
  taskId,
  userId,
  taskTitle,
  onDisputeSubmitted
}: DisputeFormProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 3;

    if (files.length + imageFiles.length > maxFiles) {
      toast({
        title: "Liikaa kuvia",
        description: `Voit lisätä enintään ${maxFiles} kuvaa.`,
        variant: "destructive",
      });
      return;
    }

    setImageFiles(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreviews(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `dispute-${taskId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('task-images')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading image:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('task-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmitDispute = async () => {
    if (!reason.trim()) {
      toast({
        title: "Virhe",
        description: "Anna riitautuksen syy.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Virhe",
        description: "Kuvaile ongelmaa tarkemmin.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        // Upload images if any
        let imageUrls: string[] = [];
        if (imageFiles.length > 0) {
          imageUrls = await uploadImages();
        }

        // Update task status to disputed
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ status: 'disputed' })
          .eq('id', taskId);

        if (taskError) {
          console.error('Error updating task status:', taskError);
          toast({
            title: "Virhe",
            description: "Tehtävän tilan päivitys epäonnistui.",
            variant: "destructive",
          });
          return;
        }

        // Send dispute message to chat
        const disputeMessage = `🚨 RIITAUTUS: ${reason}\n\n${description}${imageUrls.length > 0 ? '\n\nLiitteet: ' + imageUrls.join(', ') : ''}`;

        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            task_id: taskId,
            sender_profile_id: userId,
            receiver_profile_id: '', // Will be handled by RLS or we need to get the other participant
            content: disputeMessage,
            is_read: false
          });

        if (messageError) {
          console.warn('Could not send dispute message:', messageError);
        }

        toast({
          title: "Riitautus lähetetty",
          description: "Riitautuksesi on lähetetty ja tehtävä on merkitty riitautetuksi. Järjestelmänvalvoja käsittelee asian.",
          variant: "default",
        });

        // Reset form
        setReason('');
        setDescription('');
        setImageFiles([]);
        setImagePreviews([]);

        // Call callback if provided
        if (onDisputeSubmitted) {
          onDisputeSubmitted();
        }

      } catch (error) {
        console.error('Error submitting dispute:', error);
        toast({
          title: "Virhe",
          description: "Riitautuksen lähettäminen epäonnistui. Yritä uudelleen.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Riitauta tehtävä
          </CardTitle>
          <p className="text-sm text-gray-600">
            Riitautat tehtävän "{taskTitle}". Kuvaile ongelmaa mahdollisimman tarkasti.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Riitautuksen syy *</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Esim. Työ ei vastannut sopimusta"
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              {reason.length}/100 merkkiä
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Kuvaus ongelmasta *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kuvaile tarkasti, mikä meni pieleen ja miten asia tulisi ratkaista..."
              className="min-h-[80px]"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500">
              {description.length}/1000 merkkiä
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="images">Liitä kuvia (valinnainen)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Lisää kuvia todistukseksi (enintään 3 kuvaa)
                </p>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('images')?.click()}
                  disabled={imageFiles.length >= 3}
                >
                  Valitse kuvat
                </Button>
              </div>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={preview}
                      alt={`Kuva ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-lg object-cover w-full h-24"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800">Huomio</p>
                <p className="text-xs text-orange-700">
                  Riitautus pysäyttää tehtävän ja siirtää sen järjestelmänvalvojan käsittelyyn.
                  Varmista, että olet yrittänyt ratkaista ongelman ensin suoraan taskerin kanssa.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setReason('');
                setDescription('');
                setImageFiles([]);
                setImagePreviews([]);
                if (onDisputeSubmitted) onDisputeSubmitted();
              }}
              disabled={isPending}
            >
              Peruuta
            </Button>
            <Button
              onClick={handleSubmitDispute}
              disabled={isPending || !reason.trim() || !description.trim()}
              variant="destructive"
            >
              {isPending ? 'Lähettää...' : 'Lähetä riitautus'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 