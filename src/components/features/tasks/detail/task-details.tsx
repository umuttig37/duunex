'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/supabase/database.types';
import type { NewTaskBookingFormData } from '@/types/forms/task-booking';
import PlacesInput from '@/components/ui/places-input';
import { Loader2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { CategoryRow } from './category-selection';

type CategorySpecificQuestion = Tables<'category_specific_questions'>;

interface TaskDetailsProps {
  formData: NewTaskBookingFormData;
  updateFormData: (data: Partial<NewTaskBookingFormData>) => void;
  selectedCategoryId?: string;
  templateData?: {
    id: string;
    name_fi: string;
    description_fi: string;
    questions: any[];
    categories: {
      id: string;
      name_fi: string;
      slug: string;
    };
  } | null;
}

// Address autocomplete now uses Nominatim (OpenStreetMap) via PlacesInput component

function getCategoryDisplayName(category: CategoryRow | null): string {
  if (!category) return 'Valitse kategoria ensin';
  return category.name_fi || category.slug;
}

export default function TaskDetails({
  formData,
  updateFormData,
  selectedCategoryId,
  templateData,
}: TaskDetailsProps): React.ReactElement {
  // Removed categoryFields state - now using dynamic system exclusively
  const [categorySpecificQuestions, setCategorySpecificQuestions] = useState<
    CategorySpecificQuestion[]
  >([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const supabase = createClient();


  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedCategoryId) {
        setCategorySpecificQuestions([]);
        return;
      }
      setIsLoadingQuestions(true);

      const { data, error } = await supabase
        .from('category_specific_questions')
        .select('*')
        .eq('category_id', selectedCategoryId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching category specific questions:', error);
        setCategorySpecificQuestions([]);
      } else {
        setCategorySpecificQuestions(data || []);
      }
      setIsLoadingQuestions(false);
    };

    fetchQuestions();
  }, [selectedCategoryId, supabase]);

  // Dynamic category questions system - old hardcoded fields removed to prevent duplication
  useEffect(() => {
    // Removed old category fields logic - now using dynamic system exclusively
  }, [formData.category, categorySpecificQuestions, isLoadingQuestions]);

  const handleDynamicFieldChange = (
    questionId: string,
    value: any,
    questionType: string
  ) => {
    let answerValue;
    switch (questionType) {
      case 'boolean':
        answerValue = { value: Boolean(value) };
        break;
      case 'number':
        answerValue = {
          value:
            value === '' || value === null || isNaN(Number(value))
              ? null
              : Number(value),
        };
        break;
      default:
        answerValue = { value: String(value) };
    }

    updateFormData({
      dynamicFieldAnswers: {
        ...(formData.dynamicFieldAnswers || {}),
        [questionId]: answerValue,
      },
    });
  };

  // Handle address selection from PlacesInput (Nominatim)
  const handleLocationChange = (value: string, coordinates?: { lat: number; lng: number }) => {
    updateFormData({
      location_text: value,
      latitude: coordinates?.lat ?? null,
      longitude: coordinates?.lng ?? null,
    });
  };

  // Render template questions if template data is available
  const renderTemplateQuestions = () => {
    if (
      !templateData ||
      !templateData.questions ||
      templateData.questions.length === 0
    ) {
      return null;
    }

    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-sm">
        <div className="flex items-center mb-4">
          <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2 text-sm text-white">
            📋
          </span>
          <h3 className="text-lg font-semibold text-gray-800">
            {templateData.name_fi} - Lisätiedot
          </h3>
        </div>
        <div className="space-y-4">
          {templateData.questions.map((question, index) => {
            const questionId = `template_q_${index}`;
            const currentValue =
              formData.dynamicFieldAnswers?.[questionId]?.value || '';

            return (
              <div
                key={index}
                className="bg-white p-4 rounded-lg border border-gray-200"
              >
                <Label
                  htmlFor={questionId}
                  className="flex text-sm font-medium text-gray-700 mb-2 items-center"
                >
                  {question.label_fi}
                  {question.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>

                {question.type === 'text' && (
                  <Input
                    id={questionId}
                    value={currentValue}
                    onChange={(e) => {
                      updateFormData({
                        dynamicFieldAnswers: {
                          ...formData.dynamicFieldAnswers,
                          [questionId]: {
                            value: e.target.value,
                            questionType: question.type,
                            questionLabel: question.label_fi,
                          },
                        },
                      });
                    }}
                    placeholder={`Kirjoita ${question.label_fi.toLowerCase()}`}
                    className="border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                  />
                )}

                {question.type === 'number' && (
                  <Input
                    id={questionId}
                    type="number"
                    min={question.min}
                    max={question.max}
                    value={currentValue}
                    onChange={(e) => {
                      updateFormData({
                        dynamicFieldAnswers: {
                          ...formData.dynamicFieldAnswers,
                          [questionId]: {
                            value: e.target.value,
                            questionType: question.type,
                            questionLabel: question.label_fi,
                          },
                        },
                      });
                    }}
                    placeholder={`Syötä ${question.label_fi.toLowerCase()}`}
                    className="border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                  />
                )}

                {question.type === 'textarea' && (
                  <Textarea
                    id={questionId}
                    value={currentValue}
                    onChange={(e) => {
                      updateFormData({
                        dynamicFieldAnswers: {
                          ...formData.dynamicFieldAnswers,
                          [questionId]: {
                            value: e.target.value,
                            questionType: question.type,
                            questionLabel: question.label_fi,
                          },
                        },
                      });
                    }}
                    placeholder={`Kirjoita ${question.label_fi.toLowerCase()}`}
                    className="border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                    rows={3}
                  />
                )}

                {question.type === 'select' && question.options_fi && (
                  <Select
                    value={currentValue}
                    onValueChange={(value) => {
                      updateFormData({
                        dynamicFieldAnswers: {
                          ...formData.dynamicFieldAnswers,
                          [questionId]: {
                            value,
                            questionType: question.type,
                            questionLabel: question.label_fi,
                          },
                        },
                      });
                    }}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-400 focus:ring-blue-400">
                      <SelectValue
                        placeholder={`Valitse ${question.label_fi.toLowerCase()}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options_fi.map(
                        (option: string, optIndex: number) => (
                          <SelectItem key={optIndex} value={option}>
                            {option}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}

                {question.type === 'checkbox' && question.options_fi && (
                  <div className="space-y-2">
                    {question.options_fi.map(
                      (option: string, optIndex: number) => {
                        const isChecked =
                          Array.isArray(currentValue) &&
                          currentValue.includes(option);
                        return (
                          <div
                            key={optIndex}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`${questionId}_${optIndex}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const currentArray = Array.isArray(currentValue)
                                  ? currentValue
                                  : [];
                                const newValue = checked
                                  ? [...currentArray, option]
                                  : currentArray.filter(
                                    (item) => item !== option
                                  );

                                updateFormData({
                                  dynamicFieldAnswers: {
                                    ...formData.dynamicFieldAnswers,
                                    [questionId]: {
                                      value: newValue,
                                      questionType: question.type,
                                      questionLabel: question.label_fi,
                                    },
                                  },
                                });
                              }}
                            />
                            <Label
                              htmlFor={`${questionId}_${optIndex}`}
                              className="text-sm text-gray-700"
                            >
                              {option}
                            </Label>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                {question.type === 'time_range' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1">
                        Alkaa
                      </Label>
                      <Input
                        type="time"
                        value={currentValue?.start || ''}
                        onChange={(e) => {
                          const timeRange =
                            typeof currentValue === 'object'
                              ? currentValue
                              : {};
                          updateFormData({
                            dynamicFieldAnswers: {
                              ...formData.dynamicFieldAnswers,
                              [questionId]: {
                                value: { ...timeRange, start: e.target.value },
                                questionType: question.type,
                                questionLabel: question.label_fi,
                              },
                            },
                          });
                        }}
                        className="border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1">
                        Päättyy
                      </Label>
                      <Input
                        type="time"
                        value={currentValue?.end || ''}
                        onChange={(e) => {
                          const timeRange =
                            typeof currentValue === 'object'
                              ? currentValue
                              : {};
                          updateFormData({
                            dynamicFieldAnswers: {
                              ...formData.dynamicFieldAnswers,
                              [questionId]: {
                                value: { ...timeRange, end: e.target.value },
                                questionType: question.type,
                                questionLabel: question.label_fi,
                              },
                            },
                          });
                        }}
                        className="border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDynamicCategoryFields = () => {
    if (isLoadingQuestions) {
      return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">
              Ladataan kategoria-spesifisiä kysymyksiä...
            </span>
          </div>
        </div>
      );
    }

    if (!selectedCategoryId || categorySpecificQuestions.length === 0) {
      return null;
    }

    const categoryDisplayName = getCategoryDisplayName(formData.category);

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            {categoryDisplayName} - Lisätiedot
          </h3>
        </div>

        <div className="space-y-6">
          {categorySpecificQuestions.map((question, index) => {
            const currentValue =
              formData.dynamicFieldAnswers?.[question.id]?.value;
            const isRequired = question.is_required;
            const hasError =
              isRequired &&
              (!currentValue ||
                (typeof currentValue === 'string' &&
                  currentValue.trim() === ''));

            return (
              <div
                key={question.id}
                className={`space-y-2 ${index > 0 ? 'pt-4 border-t border-gray-100' : ''}`}
              >
                <Label
                  htmlFor={question.id}
                  className="block text-sm font-medium text-gray-700"
                >
                  {question.question_text_fi}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {question.helper_text_fi && (
                  <p className="text-xs text-gray-500 mb-2 bg-gray-50 p-2 rounded-md border-l-2 border-blue-200">
                    💡 {question.helper_text_fi}
                  </p>
                )}

                {question.question_type === 'text' && (
                  <div>
                    <Input
                      id={question.id}
                      value={currentValue || ''}
                      onChange={(e) =>
                        handleDynamicFieldChange(
                          question.id,
                          e.target.value,
                          question.question_type
                        )
                      }
                      placeholder={
                        typeof question.options_fi === 'object' &&
                          question.options_fi &&
                          !Array.isArray(question.options_fi) &&
                          'placeholder_fi' in question.options_fi
                          ? String((question.options_fi as any).placeholder_fi)
                          : ''
                      }
                      className={`border-gray-300 focus:border-blue-400 focus:ring-blue-400 ${hasError ? 'border-red-300 bg-red-50' : ''}`}
                    />
                    {hasError && (
                      <p className="text-xs text-red-500 mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        Tämä kenttä on pakollinen
                      </p>
                    )}
                  </div>
                )}

                {question.question_type === 'textarea' && (
                  <div>
                    <Textarea
                      id={question.id}
                      value={currentValue || ''}
                      onChange={(e) =>
                        handleDynamicFieldChange(
                          question.id,
                          e.target.value,
                          question.question_type
                        )
                      }
                      placeholder={
                        typeof question.options_fi === 'object' &&
                          question.options_fi &&
                          !Array.isArray(question.options_fi) &&
                          'placeholder_fi' in question.options_fi
                          ? String((question.options_fi as any).placeholder_fi)
                          : ''
                      }
                      rows={3}
                      className={`border-gray-300 focus:border-blue-400 focus:ring-blue-400 resize-none ${hasError ? 'border-red-300 bg-red-50' : ''}`}
                    />
                    {hasError && (
                      <p className="text-xs text-red-500 mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        Tämä kenttä on pakollinen
                      </p>
                    )}
                  </div>
                )}

                {question.question_type === 'number' && (
                  <div>
                    <Input
                      id={question.id}
                      type="number"
                      value={
                        currentValue === null || currentValue === undefined
                          ? ''
                          : currentValue
                      }
                      onChange={(e) =>
                        handleDynamicFieldChange(
                          question.id,
                          e.target.value,
                          question.question_type
                        )
                      }
                      placeholder={
                        typeof question.options_fi === 'object' &&
                          question.options_fi &&
                          !Array.isArray(question.options_fi) &&
                          'placeholder_fi' in question.options_fi
                          ? String((question.options_fi as any).placeholder_fi)
                          : ''
                      }
                      className={`border-gray-300 focus:border-blue-400 focus:ring-blue-400 ${hasError ? 'border-red-300 bg-red-50' : ''}`}
                      min="0"
                    />
                    {hasError && (
                      <p className="text-xs text-red-500 mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        Tämä kenttä on pakollinen
                      </p>
                    )}
                  </div>
                )}

                {question.question_type === 'boolean' && (
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                    <Checkbox
                      id={question.id}
                      checked={Boolean(currentValue)}
                      onCheckedChange={(checked) =>
                        handleDynamicFieldChange(
                          question.id,
                          checked,
                          question.question_type
                        )
                      }
                      className="border-blue-300 data-[state=checked]:bg-blue-600"
                    />
                    <Label
                      htmlFor={question.id}
                      className="font-normal cursor-pointer"
                    >
                      {typeof question.options_fi === 'object' &&
                        question.options_fi &&
                        !Array.isArray(question.options_fi) &&
                        'label_fi' in question.options_fi
                        ? String((question.options_fi as any).label_fi)
                        : 'Kyllä'}
                    </Label>
                  </div>
                )}

                {question.question_type === 'select_single' &&
                  question.options_fi &&
                  Array.isArray(question.options_fi) && (
                    <div>
                      <Select
                        value={currentValue || ''}
                        onValueChange={(value) =>
                          handleDynamicFieldChange(
                            question.id,
                            value,
                            question.question_type
                          )
                        }
                      >
                        <SelectTrigger
                          id={question.id}
                          className={`w-full border-gray-300 focus:border-blue-400 focus:ring-blue-400 ${hasError ? 'border-red-300 bg-red-50' : ''}`}
                        >
                          <SelectValue
                            placeholder={
                              typeof question.options_fi === 'object' &&
                                question.options_fi &&
                                !Array.isArray(question.options_fi) &&
                                'placeholder_trigger_fi' in question.options_fi
                                ? String(
                                  (question.options_fi as any)
                                    .placeholder_trigger_fi
                                )
                                : 'Valitse...'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            question.options_fi as {
                              value: string;
                              label: string;
                            }[]
                          ).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {hasError && (
                        <p className="text-xs text-red-500 mt-1 flex items-center">
                          <span className="mr-1">⚠️</span>
                          Tämä kenttä on pakollinen
                        </p>
                      )}
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOldCategorySpecificFields = (category: CategoryRow) => {
    switch (category.slug) {
      case 'muuttoapu':
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Muuttoavun Lisätiedot
            </h3>
            <div className="space-y-5">
              <div>
                <Label
                  htmlFor="items"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Siirrettävät tavarat
                </Label>
                <Textarea
                  id="items"
                  placeholder="Listaa pääasialliset siirrettävät tavarat (esim. huonekalut, laatikot, kodinkoneet)"
                  value={formData.additionalDetails?.items || ''}
                  onChange={(e) =>
                    updateFormData({
                      additionalDetails: {
                        ...formData.additionalDetails,
                        items: e.target.value,
                      },
                    })
                  }
                  className="border-gray-300 focus:border-orange-400 focus:ring-orange-400 rounded-lg"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-3">
                  Tarvitsetko pakkausapua?
                </Label>
                <RadioGroup
                  value={formData.additionalDetails?.needs_packing || 'no'}
                  onValueChange={(value) =>
                    updateFormData({
                      additionalDetails: {
                        ...formData.additionalDetails,
                        needs_packing: value as 'yes' | 'no',
                      },
                    })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200">
                    <RadioGroupItem
                      value="yes"
                      id="packing-yes"
                      className="border-orange-300 text-orange-600"
                    />
                    <Label htmlFor="packing-yes" className="cursor-pointer">
                      Kyllä
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200">
                    <RadioGroupItem
                      value="no"
                      id="packing-no"
                      className="border-orange-300 text-orange-600"
                    />
                    <Label htmlFor="packing-no" className="cursor-pointer">
                      Ei
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label
                  htmlFor="floors"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Kuinka monta kerrosta?
                </Label>
                <Select
                  value={formData.additionalDetails?.floors || ''}
                  onValueChange={(value) =>
                    updateFormData({
                      additionalDetails: {
                        ...formData.additionalDetails,
                        floors: value,
                      },
                    })
                  }
                >
                  <SelectTrigger
                    id="floors"
                    className="w-full border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                  >
                    <SelectValue placeholder="Valitse kerrosten määrä" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ground">Vain maantaso</SelectItem>
                    <SelectItem value="one">
                      Yksi kerrosväli portaita
                    </SelectItem>
                    <SelectItem value="two">
                      Kaksi kerrosväliä portaita
                    </SelectItem>
                    <SelectItem value="elevator">
                      Hissi käytettävissä
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'lemmikin-hoito':
        return (
          <div className="space-y-4 pt-4 border-t mt-4">
            <h3 className="text-md font-semibold text-gray-700 mb-2">
              Lemmikin Hoidon Lisätiedot
            </h3>
            <div>
              <Label htmlFor="pet-type">Lemmikin tyyppi</Label>
              <Select
                value={formData.additionalDetails?.pet_type || ''}
                onValueChange={(value) =>
                  updateFormData({
                    additionalDetails: {
                      ...formData.additionalDetails,
                      pet_type: value,
                    },
                  })
                }
              >
                <SelectTrigger id="pet-type" className="w-full mt-1">
                  <SelectValue placeholder="Valitse lemmikin tyyppi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Koira</SelectItem>
                  <SelectItem value="cat">Kissa</SelectItem>
                  <SelectItem value="bird">Lintu</SelectItem>
                  <SelectItem value="fish">Kala</SelectItem>
                  <SelectItem value="other">Muu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="service-type">Palvelun tyyppi</Label>
              <Select
                value={formData.additionalDetails?.service_type || ''}
                onValueChange={(value) =>
                  updateFormData({
                    additionalDetails: {
                      ...formData.additionalDetails,
                      service_type: value,
                    },
                  })
                }
              >
                <SelectTrigger id="service-type" className="w-full mt-1">
                  <SelectValue placeholder="Valitse palvelun tyyppi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walking">Ulkoilutus</SelectItem>
                  <SelectItem value="sitting">Lemmikkivahti</SelectItem>
                  <SelectItem value="feeding">Ruokinta</SelectItem>
                  <SelectItem value="grooming">Turkinhoito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pet-details">Lemmikin tiedot</Label>
              <Textarea
                id="pet-details"
                placeholder="Ikä, rotu, luonne, erityistarpeet jne."
                value={formData.additionalDetails?.pet_details || ''}
                onChange={(e) =>
                  updateFormData({
                    additionalDetails: {
                      ...formData.additionalDetails,
                      pet_details: e.target.value,
                    },
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'siivous':
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Siivouksen Lisätiedot
            </h3>
            <div className="space-y-5">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-3">
                  Siivouksen tyyppi
                </Label>
                <RadioGroup
                  value={formData.additionalDetails?.cleaning_type || 'regular'}
                  onValueChange={(value) =>
                    updateFormData({
                      additionalDetails: {
                        ...formData.additionalDetails,
                        cleaning_type: value,
                      },
                    })
                  }
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all duration-200">
                    <RadioGroupItem
                      value="regular"
                      id="regular"
                      className="border-cyan-300 text-cyan-600"
                    />
                    <Label htmlFor="regular" className="cursor-pointer">
                      Perussiivous
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all duration-200">
                    <RadioGroupItem
                      value="deep"
                      id="deep"
                      className="border-cyan-300 text-cyan-600"
                    />
                    <Label htmlFor="deep" className="cursor-pointer">
                      Suursiivous
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all duration-200">
                    <RadioGroupItem
                      value="move-in"
                      id="move-in"
                      className="border-cyan-300 text-cyan-600"
                    />
                    <Label htmlFor="move-in" className="cursor-pointer">
                      Muuttosiivous
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label
                  htmlFor="home-size"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Kodin koko
                </Label>
                <Select
                  value={formData.additionalDetails?.home_size || ''}
                  onValueChange={(value) =>
                    updateFormData({
                      additionalDetails: {
                        ...formData.additionalDetails,
                        home_size: value,
                      },
                    })
                  }
                >
                  <SelectTrigger
                    id="home-size"
                    className="w-full border-gray-300 focus:border-cyan-400 focus:ring-cyan-400"
                  >
                    <SelectValue placeholder="Valitse kodin koko" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Yksiö</SelectItem>
                    <SelectItem value="1bed">Kaksio (1 makuuhuone)</SelectItem>
                    <SelectItem value="2bed">
                      Kolmio (2 makuuhuonetta)
                    </SelectItem>
                    <SelectItem value="3bed">
                      Neliö (3 makuuhuonetta)
                    </SelectItem>
                    <SelectItem value="4bed">5h+ (4+ makuuhuonetta)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-3">
                  Erityishuomiota vaativat alueet
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    'Keittiö',
                    'Kylpyhuone',
                    'Makuuhuoneet',
                    'Olohuone',
                    'Ikkunat',
                    'Lattiat',
                  ].map((area) => (
                    <div
                      key={area}
                      className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all duration-200"
                    >
                      <Checkbox
                        id={`area-${area}`}
                        checked={
                          formData.additionalDetails?.areas?.includes(area) ||
                          false
                        }
                        onCheckedChange={(checked) => {
                          const currentAreas =
                            formData.additionalDetails?.areas || [];
                          const newAreas = checked
                            ? [...currentAreas, area]
                            : currentAreas.filter((a: string) => a !== area);

                          updateFormData({
                            additionalDetails: {
                              ...formData.additionalDetails,
                              areas: newAreas,
                            },
                          });
                        }}
                        className="border-cyan-300 data-[state=checked]:bg-cyan-600"
                      />
                      <Label
                        htmlFor={`area-${area}`}
                        className="cursor-pointer text-sm"
                      >
                        {area}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4 pt-4 border-t mt-4">
            <h3 className="text-md font-semibold text-gray-700 mb-2">
              Lisätiedot
            </h3>
            <div>
              <Label htmlFor="specific-requirements">Erityisvaatimukset</Label>
              <Textarea
                id="specific-requirements"
                placeholder="Kuvaile mahdolliset erityisvaatimukset tehtävällesi"
                value={formData.additionalDetails?.specific_requirements || ''}
                onChange={(e) =>
                  updateFormData({
                    additionalDetails: {
                      ...formData.additionalDetails,
                      specific_requirements: e.target.value,
                    },
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
          {getCategoryDisplayName(formData.category)}
        </h2>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl">
          Kerro meille tehtävästäsi. Käytämme näitä tietoja näyttääksemme
          alueesi tekijöitä, jotka sopivat tarpeisiisi.
        </p>
      </div>

      <div className="space-y-6">
        {/* Task Description */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <Label
            htmlFor="description"
            className="flex text-base font-semibold text-gray-800 mb-3 items-center"
          >
            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">
              ✏️
            </span>
            Tehtävän kuvaus *
          </Label>
          <Textarea
            id="description"
            placeholder="Kerro tarkemmin tehtävästä... Mitä tehdään, milloin, missä?"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            required
            className="min-h-[120px] border-gray-300 focus:border-blue-400 focus:ring-blue-400 rounded-lg text-gray-700 placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-500 mt-2 italic">
            💡 Anna mahdollisimman paljon tietoa, jotta tekijä voi arvioida työn
            laajuuden ja hinnan.
          </p>
        </div>

        {/* Location */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <Label
            htmlFor="addressInput"
            className="flex text-base font-semibold text-gray-800 mb-3 items-center"
          >
            <span className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center mr-2 text-sm">
              📍
            </span>
            Missä tehtävä suoritetaan? *
          </Label>
          <PlacesInput
            value={formData.location_text || ''}
            onChange={handleLocationChange}
            placeholder="Kirjoita osoite tai paikka (esim. Mannerheimintie 1, Helsinki)"
          />
          {formData.latitude && formData.longitude && (
            <div className="mt-3 p-2 bg-sky-50 border border-sky-200 rounded-lg">
              <p className="text-xs text-sky-700 flex items-center">
                <span className="mr-1">✅</span>
                Tarkka sijainti tallennettu ({formData.latitude.toFixed(
                  4
                )}, {formData.longitude.toFixed(4)})
              </p>
            </div>
          )}
        </div>

        {/* Task Size */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <Label className="flex text-base font-semibold text-gray-800 mb-3 items-center">
            <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2 text-sm">
              ⏱️
            </span>
            Tehtävän koko
          </Label>
          <RadioGroup
            value={formData.task_size}
            onValueChange={(value) =>
              updateFormData({
                task_size: value as 'small' | 'medium' | 'large',
              })
            }
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
              <RadioGroupItem
                value="small"
                id="small"
                className="border-purple-300 text-purple-600"
              />
              <Label htmlFor="small" className="cursor-pointer flex-1 select-none">
                <span className="font-medium text-gray-800">Pieni tehtävä</span>
                <span className="block text-sm text-gray-500">
                  Arvio: 1 tunti tai alle
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
              <RadioGroupItem
                value="medium"
                id="medium"
                className="border-purple-300 text-purple-600"
              />
              <Label htmlFor="medium" className="cursor-pointer flex-1 select-none">
                <span className="font-medium text-gray-800">
                  Keskikokoinen tehtävä
                </span>
                <span className="block text-sm text-gray-500">
                  Arvio: 2-3 tuntia
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
              <RadioGroupItem
                value="large"
                id="large"
                className="border-purple-300 text-purple-600"
              />
              <Label htmlFor="large" className="cursor-pointer flex-1 select-none">
                <span className="font-medium text-gray-800">Suuri tehtävä</span>
                <span className="block text-sm text-gray-500">
                  Arvio: 4+ tuntia tai useampi päivä
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Render template questions if template data is available */}
        {renderTemplateQuestions()}

        {/* Render dynamic fields - new system takes precedence over old hardcoded fields */}
        {selectedCategoryId && renderDynamicCategoryFields()}
      </div>
    </div>
  );
}
