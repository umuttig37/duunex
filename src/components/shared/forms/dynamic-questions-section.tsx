"use client";

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DynamicQuestionComponent, type DynamicQuestion } from './dynamic-question';

interface DynamicQuestionsSectionProps {
  categoryId: string | undefined;
  onQuestionsLoaded?: (questions: DynamicQuestion[]) => void;
}

export function DynamicQuestionsSection({ categoryId, onQuestionsLoaded }: DynamicQuestionsSectionProps) {
  const [questions, setQuestions] = useState<DynamicQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setQuestions([]);
      onQuestionsLoaded?.([]);
      return;
    }

    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('category_specific_questions')
          .select('*')
          .eq('category_id', categoryId)
          .order('display_order', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        // Parse JSON options for each question
        const parsedQuestions: DynamicQuestion[] = (data || []).map(question => ({
          id: question.id,
          question_text_fi: question.question_text_fi,
          question_type: question.question_type as DynamicQuestion['question_type'],
          display_order: question.display_order,
          is_required: question.is_required,
          options_fi: question.options_fi ? JSON.parse(question.options_fi as string) : null,
          helper_text_fi: question.helper_text_fi,
        }));

        setQuestions(parsedQuestions);
        onQuestionsLoaded?.(parsedQuestions);
      } catch (err) {
        console.error('Error fetching category questions:', err);
        setError('Kategorian kysymysten lataaminen epäonnistui');
        setQuestions([]);
        onQuestionsLoaded?.([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [categoryId, onQuestionsLoaded]);

  if (!categoryId) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Kategoria-specifisiä kysymyksiä
        </h3>
        <div className="space-y-6">
          {questions.map((question) => (
            <DynamicQuestionComponent
              key={question.id}
              question={question}
              fieldName={`category_question_${question.id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}