import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

type CategorySpecificQuestion = Database['public']['Tables']['category_specific_questions']['Row'];
type TaskSpecificAnswer = Database['public']['Tables']['task_specific_answers']['Row'];

export interface DynamicQuestion {
  id: string;
  question_text_fi: string;
  question_type: 'text' | 'textarea' | 'number' | 'select_single' | 'select_multiple';
  display_order: number;
  is_required: boolean;
  options_fi?: { value: string; label: string }[] | null;
  helper_text_fi?: string | null;
}

export interface CategoryQuestionsResponse {
  questions: DynamicQuestion[];
  error?: string;
}

export interface SaveAnswersData {
  taskId: string;
  answers: Record<string, any>;
}

/**
 * Fetch category-specific questions for a given category
 */
export async function getCategoryQuestions(categoryId: string): Promise<CategoryQuestionsResponse> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('category_specific_questions')
      .select('*')
      .eq('category_id', categoryId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching category questions:', error);
      return { questions: [], error: 'Failed to fetch questions' };
    }

    // Parse JSON options for each question
    const questions: DynamicQuestion[] = (data || []).map(question => ({
      id: question.id,
      question_text_fi: question.question_text_fi,
      question_type: question.question_type as DynamicQuestion['question_type'],
      display_order: question.display_order,
      is_required: question.is_required,
      options_fi: question.options_fi ? JSON.parse(question.options_fi as string) : null,
      helper_text_fi: question.helper_text_fi,
    }));

    return { questions };
  } catch (error) {
    console.error('Unexpected error fetching category questions:', error);
    return { questions: [], error: 'Unexpected error occurred' };
  }
}

/**
 * Save task-specific answers to the database
 */
export async function saveTaskAnswers(data: SaveAnswersData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { taskId, answers } = data;

    // Prepare answers for insertion
    const answersToInsert = Object.entries(answers)
      .filter(([key, value]) => key.startsWith('category_question_') && value !== '' && value !== null && value !== undefined)
      .map(([key, value]) => {
        const questionId = key.replace('category_question_', '');
        return {
          task_id: taskId,
          question_id: questionId,
          answer_value: typeof value === 'object' ? value : { value },
        };
      });

    if (answersToInsert.length === 0) {
      return { success: true }; // No answers to save
    }

    const { error } = await supabase
      .from('task_specific_answers')
      .insert(answersToInsert);

    if (error) {
      console.error('Error saving task answers:', error);
      return { success: false, error: 'Failed to save answers' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error saving task answers:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Get task answers for a specific task
 */
export async function getTaskAnswers(taskId: string): Promise<Record<string, any>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('task_specific_answers')
      .select(`
        question_id,
        answer_value,
        category_specific_questions!inner(
          question_text_fi,
          question_type
        )
      `)
      .eq('task_id', taskId);

    if (error) {
      console.error('Error fetching task answers:', error);
      return {};
    }

    // Transform the data into a more usable format
    const answers: Record<string, any> = {};
    (data || []).forEach(answer => {
      const key = `category_question_${answer.question_id}`;
      answers[key] = typeof answer.answer_value === 'object' && 
        answer.answer_value !== null && 
        !Array.isArray(answer.answer_value) && 
        'value' in answer.answer_value
        ? answer.answer_value.value 
        : answer.answer_value;
    });

    return answers;
  } catch (error) {
    console.error('Unexpected error fetching task answers:', error);
    return {};
  }
}

/**
 * Validate required questions are answered
 */
export function validateDynamicAnswers(
  questions: DynamicQuestion[], 
  answers: Record<string, any>
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  questions.forEach(question => {
    if (question.is_required) {
      const fieldName = `category_question_${question.id}`;
      const value = answers[fieldName];
      
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        missingFields.push(question.question_text_fi);
      }
    }
  });

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}