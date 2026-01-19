"use client";

import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFormContext } from 'react-hook-form';

export interface DynamicQuestion {
  id: string;
  question_text_fi: string;
  question_type: 'text' | 'textarea' | 'number' | 'select_single' | 'select_multiple';
  display_order: number;
  is_required: boolean;
  options_fi?: { value: string; label: string }[] | null;
  helper_text_fi?: string | null;
}

interface DynamicQuestionProps {
  question: DynamicQuestion;
  fieldName: string;
}

export function DynamicQuestionComponent({ question, fieldName }: DynamicQuestionProps) {
  const form = useFormContext();

  const renderQuestionInput = (field: any) => {
    switch (question.question_type) {
      case 'text':
        return (
          <Input
            {...field}
            placeholder={question.options_fi?.find(opt => opt.value === 'placeholder_fi')?.label || ''}
            name={fieldName}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...field}
            placeholder={question.options_fi?.find(opt => opt.value === 'placeholder_fi')?.label || ''}
            className="resize-none min-h-[100px]"
            name={fieldName}
          />
        );

      case 'number':
        return (
          <Input
            {...field}
            type="number"
            placeholder={question.options_fi?.find(opt => opt.value === 'placeholder_fi')?.label || ''}
            name={fieldName}
            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
          />
        );

      case 'select_single':
        if (!question.options_fi || question.options_fi.length === 0) {
          return <div className="text-sm text-gray-500">Ei vaihtoehtoja saatavilla</div>;
        }

        return (
          <Select onValueChange={field.onChange} defaultValue={field.value} name={fieldName}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Valitse vaihtoehto" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {question.options_fi.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'select_multiple':
        if (!question.options_fi || question.options_fi.length === 0) {
          return <div className="text-sm text-gray-500">Ei vaihtoehtoja saatavilla</div>;
        }

        return (
          <div className="space-y-3">
            {question.options_fi.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${fieldName}-${option.value}`}
                  value={option.value}
                  checked={Array.isArray(field.value) && field.value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(field.value) ? field.value : [];
                    if (e.target.checked) {
                      field.onChange([...currentValues, option.value]);
                    } else {
                      field.onChange(currentValues.filter((val: string) => val !== option.value));
                    }
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Label htmlFor={`${fieldName}-${option.value}`} className="text-sm font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return <Input {...field} name={fieldName} />;
    }
  };

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-1">
            {question.question_text_fi}
            {question.is_required && (
              <span className="text-red-500 text-sm">*</span>
            )}
          </FormLabel>
          <FormControl>
            {renderQuestionInput(field)}
          </FormControl>
          {question.helper_text_fi && (
            <FormDescription className="text-sm text-gray-600">
              {question.helper_text_fi}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}