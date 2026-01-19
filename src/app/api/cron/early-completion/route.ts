import { createClient } from '@/lib/supabase/server';
import { sendEarlyCompletionAutoAcceptedEmail, sendEarlyCompletionReminderEmail } from '@/services/notifications/email-service';
import { NextResponse } from 'next/server';

type TaskRow = {
  id: string;
  title: string | null;
  user_id: string;
  assigned_tasker_id: string | null;
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, user_id, assigned_tasker_id, scheduled_date, created_at, updated_at')
      .eq('status', 'early_completed')
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('Cron: fetch early_completed tasks error', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const now = Date.now();
    const processed: { id: string; action: 'reminder_24h' | 'reminder_4h' | 'auto_accepted' | 'none'; }[] = [];

    for (const task of (tasks as TaskRow[] || [])) {
      const requestedAtIso = task.updated_at || task.created_at;
      const requestedAt = new Date(requestedAtIso).getTime();
      const deadlineMs = requestedAt + 72 * 60 * 60 * 1000; // 72h deadline
      const msLeft = deadlineMs - now;

      if (msLeft <= 0) {
        // Auto-accept if still early_completed
        const { error: updateErr } = await supabase
          .from('tasks')
          .update({ status: 'completed' })
          .eq('id', task.id)
          .eq('status', 'early_completed');
        if (updateErr) {
          console.error('Cron: auto-accept update failed for task', task.id, updateErr);
          processed.push({ id: task.id, action: 'none' });
          continue;
        }

        // Notify participants in-app
        try {
          await supabase.from('notifications').insert([
            {
              recipient_id: task.user_id,
              title: 'Aikainen valmistuminen hyväksyttiin automaattisesti',
              message: 'Määräaika ylittyi ilman vastausta. Tehtävä merkitty valmiiksi.',
              type: 'early_completion_auto_accepted',
              related_task_id: task.id,
              is_read: false,
            },
            task.assigned_tasker_id ? {
              recipient_id: task.assigned_tasker_id,
              title: 'Aikainen valmistuminen hyväksyttiin automaattisesti',
              message: 'Asiakas ei reagoinut määräaikaan mennessä. Tehtävä merkitty valmiiksi.',
              type: 'early_completion_auto_accepted',
              related_task_id: task.id,
              is_read: false,
            } : undefined,
          ].filter(Boolean) as any[]);
        } catch (nErr) {
          console.warn('Cron: notify auto-accept failed', nErr);
        }

        // Send email to user
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, email')
            .eq('id', task.user_id)
            .single();
          if (profile?.email) {
            await sendEarlyCompletionAutoAcceptedEmail({
              taskTitle: task.title ?? 'Tehtävä',
              taskId: task.id,
              userFirstName: profile.first_name || 'Asiakas',
              taskUrl: `/dashboard/tasks/${task.id}`,
            }, profile.email);
          }
        } catch (e) {
          console.warn('Cron: email auto-accept failed', e);
        }

        processed.push({ id: task.id, action: 'auto_accepted' });
        continue;
      }

      // Reminders
      const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000));
      if (hoursLeft === 24 || hoursLeft === 4) {
        const reminderType = hoursLeft === 24 ? 'early_completion_reminder_24h' : 'early_completion_reminder_4h';
        // Check if reminder already sent
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('related_task_id', task.id)
          .eq('type', reminderType)
          .limit(1);
        if (existing && existing.length > 0) {
          processed.push({ id: task.id, action: 'none' });
          continue;
        }

        // Create in-app notification and send email
        try {
          await supabase.from('notifications').insert({
            recipient_id: task.user_id,
            title: hoursLeft === 24 ? 'Muistutus: 24 h aikaa vahvistaa' : 'Muistutus: 4 h aikaa vahvistaa',
            message: 'Tehtävä on merkitty valmiiksi aikaisin. Vahvista, hylkää tai riitauta ennen määräaikaa.',
            type: reminderType,
            related_task_id: task.id,
            is_read: false,
          });
        } catch (nErr) {
          console.warn('Cron: reminder notification failed', nErr);
        }

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, email')
            .eq('id', task.user_id)
            .single();
          if (profile?.email) {
            await sendEarlyCompletionReminderEmail({
              taskTitle: task.title ?? 'Tehtävä',
              taskId: task.id,
              userFirstName: profile.first_name || 'Asiakas',
              taskUrl: `/dashboard/tasks/${task.id}`,
              scheduledDate: task.scheduled_date,
              deadlineHours: 72,
              hoursLeft,
            }, profile.email);
          }
        } catch (e) {
          console.warn('Cron: reminder email failed', e);
        }

        processed.push({ id: task.id, action: hoursLeft === 24 ? 'reminder_24h' : 'reminder_4h' });
        continue;
      }

      processed.push({ id: task.id, action: 'none' });
    }

    return NextResponse.json({ success: true, processed });
  } catch (err: any) {
    console.error('Cron error', err);
    return NextResponse.json({ success: false, error: err?.message || 'Unknown' }, { status: 500 });
  }
}


