'use client';

import { FeatureHighlight, ModernCard } from '@/components/ui/modern-primitives';
import PlacesInput from '@/components/ui/places-input';
import { CategoryWithIcon } from '@/constants/categories-with-icons';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  Upload,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';

/* ================================
   INTERFACES & TYPES
   ================================ */
interface TaskFormData {
  description: string;
  location_text: string;
  latitude?: number | null;
  longitude?: number | null;
  service_radius_km: number;
  budget: number | null;
  scheduled_date: Date | null;
  scheduled_time_slot: 'morning' | 'afternoon' | 'evening' | 'flexible' | null;
  image_urls: string[];
  dynamic_answers: Record<string, any>;
}

interface DynamicQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'time_range';
  label_fi: string;
  required: boolean;
  options_fi?: string[];
  helper_text_fi?: string;
  min?: number;
  max?: number;
}

interface SmartTaskDetailsProps {
  category: CategoryWithIcon;
  formData: Partial<TaskFormData>;
  onFieldChange: (field: keyof TaskFormData, value: any) => void;
  onDynamicAnswerChange: (questionId: string, value: any) => void;
  templateData?: {
    questions: DynamicQuestion[];
    name_fi: string;
    description_fi: string;
  } | null;
  className?: string;
}

/* ================================
   MOCK DYNAMIC QUESTIONS
   ================================ */
const getMockQuestions = (categorySlug: string): DynamicQuestion[] => {
  const questionSets: Record<string, DynamicQuestion[]> = {
    kokoonpano: [
      {
        id: 'furniture_type',
        type: 'select',
        label_fi: 'Mikä huonekalu tai laite kootaan?',
        required: true,
        options_fi: ['Kaappi/komero', 'Hyllykköjärjestelmä', 'Pöytä', 'Tuolit', 'Sänky', 'TV-taso', 'Muu'],
      },
      {
        id: 'piece_count',
        type: 'number',
        label_fi: 'Montako kappaletta kootaan?',
        required: true,
        min: 1,
        max: 20,
        helper_text_fi: 'Montako yksittäistä huonekalua'
      },
      {
        id: 'tools_available',
        type: 'checkbox',
        label_fi: 'Mitä työkaluja sinulla on käytettävissä?',
        required: false,
        options_fi: ['Ruuvimeisseli', 'Akkuporakone', 'Vasara', 'Jakoavain', 'Ei työkaluja'],
      }
    ],
    kotitalous: [
      {
        id: 'spaces_to_organize',
        type: 'checkbox',
        label_fi: 'Mitä tiloja järjestetään?',
        required: true,
        options_fi: ['Makuuhuone', 'Olohuone', 'Keittiö', 'Kylpyhuone', 'Vaatehuone', 'Koko koti'],
      },
      {
        id: 'home_size',
        type: 'select',
        label_fi: 'Kodin koko?',
        required: true,
        options_fi: ['Yksiö', 'Kaksio', 'Kolmio', 'Neliö+', 'Omakotitalo'],
      },
      {
        id: 'services_needed',
        type: 'checkbox',
        label_fi: 'Mitä palveluita tarvitset?',
        required: true,
        options_fi: ['Tavaroiden lajittelu', 'Säilytysratkaisujen suunnittelu', 'Siivoaminen', 'Kierrätettävien vienti'],
      }
    ],
    'it-apu': [
      {
        id: 'device_type',
        type: 'select',
        label_fi: 'Mikä laite asennetaan?',
        required: true,
        options_fi: ['Työpöytätietokone', 'Kannettava tietokone', 'Tabletti', 'Älypuhelin', 'Tulostimen asennus'],
      },
      {
        id: 'services_needed',
        type: 'checkbox',
        label_fi: 'Mitä palveluita tarvitset?',
        required: true,
        options_fi: ['Peruskäyttöönotto', 'Ohjelmien asennus', 'Tiedonsiirto', 'Verkkoasetukset', 'Käytön opastus'],
      },
      {
        id: 'urgency',
        type: 'select',
        label_fi: 'Kiireellisyys?',
        required: true,
        options_fi: ['Ei kiire', 'Parin päivän sisällä', 'Huomenna', 'Tänään'],
      }
    ]
  };

  return questionSets[categorySlug] || [];
};

/* ================================
   UTILITY FUNCTIONS
   ================================ */
const getCategoryImageSuggestions = (categorySlug: string): string[] => {
  const suggestions = {
    kokoonpano: [
      'Kuva pakkauksesta ja osista',
      'Työskentely-tila',
      'Lopullinen sijoituspaikka'
    ],
    kotitalous: [
      'Järjesteltävä tila ennen',
      'Säilytettävät tavarat',
      'Toivottu lopputulos'
    ],
    'it-apu': [
      'Laitteen merkki ja malli',
      'Työpiste tai sijoituspaikka',
      'Mahdolliset virheilmoitukset'
    ],
    siivous: [
      'Siivottavat tilat',
      'Erityisesti likaiset kohdat',
      'Tilan koko kokonaiskuva'
    ],
    muutto: [
      'Muutettavat tavarat',
      'Kuljetusreitti',
      'Pakattavat kohteet'
    ]
  };

  return suggestions[categorySlug as keyof typeof suggestions] || [
    'Tehtävän kohde selkeästi näkyvissä',
    'Työtilan yleiskuva',
    'Mahdolliset haasteet'
  ];
};

const getBudgetRange = (categorySlug: string): { min: number; max: number; suggested: number } => {
  const ranges = {
    kokoonpano: { min: 30, max: 150, suggested: 70 },
    kotitalous: { min: 40, max: 120, suggested: 60 },
    'it-apu': { min: 50, max: 200, suggested: 90 },
    siivous: { min: 35, max: 100, suggested: 55 },
    muutto: { min: 60, max: 300, suggested: 120 }
  };

  return ranges[categorySlug as keyof typeof ranges] || { min: 40, max: 150, suggested: 70 };
};

/* ================================
   MAIN COMPONENT
   ================================ */
export default function SmartTaskDetails({
  category,
  formData,
  onFieldChange,
  onDynamicAnswerChange,
  templateData,
  className,
}: SmartTaskDetailsProps) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Get dynamic questions (from template or category default)
  const dynamicQuestions = templateData?.questions || getMockQuestions(category.slug);
  const budgetRange = getBudgetRange(category.slug);
  const imageSuggestions = getCategoryImageSuggestions(category.slug);

  // Image preview management - use formData.image_urls instead of blob URLs
  useEffect(() => {
    // Use the actual image URLs from formData
    const urls = formData.image_urls || [];
    setImagePreviews(urls);
  }, [formData.image_urls]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const totalFiles = imageFiles.length + newFiles.length;

    if (totalFiles > 3) {
      alert('Voit ladata enintään 3 kuvaa');
      return;
    }

    // Validate files
    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} ei ole kuvatiedosto`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} on liian suuri (max 5MB)`);
        return;
      }
    }

    setUploading(true);
    try {
      // Import Supabase client
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const uploadedUrls: string[] = [];

      for (const file of newFiles) {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = fileName;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('task-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Kuvan ${file.name} lataus epäonnistui`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('task-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setImageFiles(prev => [...prev, ...newFiles]);
      onFieldChange('image_urls', [...(formData.image_urls || []), ...uploadedUrls]);
    } catch (error) {
      console.error('Image upload error:', error);
      alert(error instanceof Error ? error.message : 'Kuvien lataus epäonnistui');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newUrls = (formData.image_urls || []).filter((_, i) => i !== index);

    setImageFiles(newFiles);
    onFieldChange('image_urls', newUrls);
  };

  const renderDynamicQuestion = (question: DynamicQuestion) => {
    const value = formData.dynamic_answers?.[question.id];

    switch (question.type) {
      case 'text':
      case 'textarea':
        const Component = question.type === 'textarea' ? 'textarea' : 'input';
        return (
          <Component
            className={cn(
              "form-input",
              question.type === 'textarea' && "min-h-[100px] resize-none"
            )}
            placeholder={question.helper_text_fi}
            value={value || ''}
            onChange={(e) => onDynamicAnswerChange(question.id, e.target.value)}
          />
        );

      case 'select':
        return (
          <select
            className="form-input"
            value={value || ''}
            onChange={(e) => onDynamicAnswerChange(question.id, e.target.value)}
          >
            <option value="">Valitse vaihtoehto...</option>
            {question.options_fi?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {question.options_fi?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  checked={(value || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = value || [];
                    if (e.target.checked) {
                      onDynamicAnswerChange(question.id, [...currentValues, option]);
                    } else {
                      onDynamicAnswerChange(question.id, currentValues.filter((v: string) => v !== option));
                    }
                  }}
                />
                <span className="text-sm font-medium text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            className="form-input"
            placeholder={question.helper_text_fi}
            min={question.min}
            max={question.max}
            value={value || ''}
            onChange={(e) => onDynamicAnswerChange(question.id, Number(e.target.value) || 0)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("animate-fade-in space-y-8", className)}>
      {/* Header */}
      <div className="text-center">
        <h1 className="heading-1 mb-4">
          Kerro tehtävästäsi
        </h1>
        <p className="body-large max-w-2xl mx-auto">
          Perustiedot auttavat tekijöitä antamaan tarkkoja tarjouksia.
        </p>
      </div>

      {/* Template Info */}
      {templateData && (
        <FeatureHighlight
          icon={CheckCircle}
          title={`Käytössä pohja: ${templateData.name_fi}`}
          description={templateData.description_fi}
          variant="success"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form (Left) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Description */}
          <ModernCard variant="base">
            <div className="space-y-4">
              <h2 className="heading-3">Tehtävän kuvaus *</h2>

              <div>
                <textarea
                  className="form-input min-h-[120px] resize-none"
                  placeholder="Kerro mitä tarvitset tehtävälle..."
                  value={formData.description || ''}
                  onChange={(e) => onFieldChange('description', e.target.value)}
                  rows={5}
                />
              </div>
            </div>
          </ModernCard>

          {/* Dynamic Questions */}
          {dynamicQuestions.length > 0 && (
            <ModernCard variant="base">
              <div className="space-y-6">
                <h2 className="heading-3">Lisätiedot</h2>

                {dynamicQuestions.map((question) => (
                  <div key={question.id}>
                    <label className="form-label">
                      {question.label_fi}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderDynamicQuestion(question)}
                  </div>
                ))}
              </div>
            </ModernCard>
          )}

          {/* Location */}
          <ModernCard variant="base">
            <div className="space-y-4">
              <h2 className="heading-3">Sijainti *</h2>

              <div>
                <PlacesInput
                  value={formData.location_text || ''}
                  onChange={(value, coordinates) => {
                    onFieldChange('location_text', value);
                    if (coordinates) {
                      onFieldChange('latitude', coordinates.lat);
                      onFieldChange('longitude', coordinates.lng);
                    }
                  }}
                  placeholder="Osoite tai alue"
                />
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✓ Sijainti tallennettu
                  </p>
                )}
              </div>

              {/* Service Radius Configuration */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h3 className="heading-4">Tekijöiden hakusäde</h3>
                <div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="50"
                      step="1"
                      value={formData.service_radius_km || 5}
                      onChange={(e) => onFieldChange('service_radius_km', Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="min-w-[60px] text-right">
                      <span className="font-medium text-gray-800">
                        {formData.service_radius_km || 5} km
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 km</span>
                    <span>50 km</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Etäisyys kotiosoitteestasi, jolta tekijöitä etsitään
                  </p>
                </div>
              </div>
            </div>
          </ModernCard>

          {/* Date & Time moved to right column on large screens */}

          {/* Budget moved to right column on large screens */}
        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-6 lg:sticky lg:top-24 self-start">
          {/* Image Upload */}
          <ModernCard variant="base">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="heading-3 mb-2">Lisää kuvia</h3>
                <p className="body-small text-gray-600">
                  Kuvat auttavat tekijöitä antamaan tarkkoja tarjouksia
                </p>
              </div>

              {/* Upload Area */}
              <div className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center transition-colors",
                uploading || imageFiles.length >= 3
                  ? "border-gray-300 bg-gray-50 opacity-50"
                  : "border-emerald-300 bg-white hover:border-emerald-400 cursor-pointer"
              )}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading || imageFiles.length >= 3}
                />

                <label
                  htmlFor="image-upload"
                  className={cn(
                    "cursor-pointer block",
                    (uploading || imageFiles.length >= 3) && "cursor-not-allowed"
                  )}
                >
                  <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-800 mb-1">
                    {uploading ? 'Ladataan...' : 'Klikkaa tai raahaa kuvia'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {imageFiles.length}/3 kuvaa • PNG, JPG • Max 5MB
                  </p>
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 text-sm">
                    📋 Lisätyt kuvat
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {imagePreviews.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-emerald-500 text-white text-xs px-2 py-1 rounded">
                            Pääkuva
                          </div>
                        )}
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </ModernCard>

          {/* Date & Time (moved) */}
          <ModernCard variant="base">
            <div className="space-y-6">
              <h2 className="heading-3">Ajankohta (valinnainen)</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Päivämäärä</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.scheduled_date ? (
                      typeof formData.scheduled_date === 'string'
                        ? (formData.scheduled_date as string).split('T')[0]
                        : (formData.scheduled_date as Date).toISOString().split('T')[0]
                    ) : ''}
                    onChange={(e) => onFieldChange('scheduled_date', e.target.value ? new Date(e.target.value) : null)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="form-label">Aika</label>
                  <select
                    className="form-input"
                    value={formData.scheduled_time_slot || ''}
                    onChange={(e) => onFieldChange('scheduled_time_slot', e.target.value || null)}
                  >
                    <option value="">Joustava</option>
                    <option value="morning">Aamupäivä (8-12)</option>
                    <option value="afternoon">Iltapäivä (12-16)</option>
                    <option value="evening">Ilta (16-20)</option>
                    <option value="flexible">Joustava</option>
                  </select>
                </div>
              </div>
            </div>
          </ModernCard>

          {/* Budget (moved) */}
          <ModernCard variant="base">
            <div className="space-y-4">
              <h2 className="heading-3">Budjetti (€)</h2>

              <div>
                <input
                  type="number"
                  className="form-input"
                  placeholder={`Esim. ${budgetRange.suggested}`}
                  min={budgetRange.min}
                  max={budgetRange.max * 2}
                  value={formData.budget || ''}
                  onChange={(e) => onFieldChange('budget', Number(e.target.value) || null)}
                />
                <p className="text-xs text-gray-600 mt-2">
                  Tyypillisesti: {budgetRange.min}-{budgetRange.max}€
                </p>
              </div>
            </div>
          </ModernCard>

        </div>
      </div>
    </div>
  );
}