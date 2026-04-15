'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// Form validation schema
const feedbackFormSchema = z.object({
  conceptClarityScore: z.number().min(0).max(10),
  usabilityScore: z.number().min(0).max(10),
  openFeedback: z.string().max(2000).optional(),
});

type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Generate a session ID for anonymous users
function generateSessionId(): string {
  return crypto.randomUUID();
}

// Get viewport dimensions
function getViewportSize(): string {
  if (typeof window !== 'undefined') {
    return `${window.innerWidth}x${window.innerHeight}`;
  }
  return '';
}

export default function FeedbackDialog({ isOpen, onClose }: FeedbackDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      conceptClarityScore: 5,
      usabilityScore: 5,
      openFeedback: '',
    },
  });

  const conceptScore = watch('conceptClarityScore');
  const usabilityScore = watch('usabilityScore');
  const openFeedback = watch('openFeedback');

  // Score labels for better UX
  const getScoreLabel = (score: number): string => {
    if (score <= 2) return 'Erittäin huono';
    if (score <= 4) return 'Huono';
    if (score <= 6) return 'Kohtuullinen';
    if (score <= 8) return 'Hyvä';
    return 'Erinomainen';
  };

  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);

    try {
      // Prepare submission data
      const submissionData = {
        conceptClarityScore: data.conceptClarityScore,
        usabilityScore: data.usabilityScore,
        openFeedback: data.openFeedback?.trim(),
        pageUrl: window.location.href,
        sessionId: generateSessionId(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        viewportSize: getViewportSize(),
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Palautteen lähetys epäonnistui');
      }

      // Show success state
      setHasSubmitted(true);
      toast.success('Kiitos palautteestasi! 🎉');

      // Close dialog after showing success message
      setTimeout(() => {
        onClose();
        reset();
        setHasSubmitted(false);
      }, 2000);

    } catch (error) {
      console.error('Feedback submission error:', error);

      // Provide user-friendly error messages
      let userMessage = 'Palautteen lähetys epäonnistui. Yritä uudelleen.';

      if (error instanceof Error) {
        if (error.message.includes('not yet available')) {
          userMessage = 'Palautejärjestelmä ei ole vielä käytettävissä. Yritä myöhemmin uudelleen.';
        } else if (error.message.includes('Rate limit')) {
          userMessage = 'Olet lähettänyt liikaa palautetta. Yritä uudelleen tunnin kuluttua.';
        } else if (error.message.includes('Network')) {
          userMessage = 'Verkkoyhteysvirhe. Tarkista internetyhteytesi ja yritä uudelleen.';
        } else {
          userMessage = error.message;
        }
      }

      toast.error(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      reset();
      setHasSubmitted(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!hasSubmitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Anna palautetta Duunex:stä
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Palautteesi auttaa meitä parantamaan palvelua. Vastaaminen kestää vain hetken.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Question 1: Concept Clarity */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Kuinka ymmärrettäväksi koit Duunex-konseptin?
                </Label>
                <div className="space-y-2">
                  <Slider
                    value={[conceptScore]}
                    onValueChange={(value) => setValue('conceptClarityScore', value[0])}
                    max={10}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0 - Ei lainkaan</span>
                    <span className="font-medium text-primary">
                      {conceptScore}/10 - {getScoreLabel(conceptScore)}
                    </span>
                    <span>10 - Erittäin hyvin</span>
                  </div>
                </div>
              </div>

              {/* Question 2: Usability */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Kuinka helppokäyttöiseksi koit sivuston?
                </Label>
                <div className="space-y-2">
                  <Slider
                    value={[usabilityScore]}
                    onValueChange={(value) => setValue('usabilityScore', value[0])}
                    max={10}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0 - Erittäin vaikea</span>
                    <span className="font-medium text-primary">
                      {usabilityScore}/10 - {getScoreLabel(usabilityScore)}
                    </span>
                    <span>10 - Erittäin helppo</span>
                  </div>
                </div>
              </div>

              {/* Question 3: Open Feedback */}
              <div className="space-y-3">
                <Label htmlFor="openFeedback" className="text-sm font-medium text-gray-700">
                  Avoin palaute (valinnainen)
                </Label>
                <Textarea
                  id="openFeedback"
                  placeholder="Kerro vapaamuotoisesti ajatuksiasi, ehdotuksiasi tai parannusideoitasi..."
                  className="min-h-[100px] resize-none"
                  maxLength={2000}
                  {...register('openFeedback')}
                />
                <div className="text-xs text-gray-500 text-right">
                  {openFeedback?.length || 0}/2000 merkkiä
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Peruuta
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Lähetetään...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Lähetä palaute
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900 mb-2">
              Kiitos palautteestasi! 🎉
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Palautteesi on vastaanotettu ja se auttaa meitä kehittämään Duunexia paremmaksi.
            </DialogDescription>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
