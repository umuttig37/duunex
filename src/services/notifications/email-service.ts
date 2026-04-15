'use server'

import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Email service for Duunex
// This module handles all email notifications sent by the application

interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

interface TaskApprovedEmailData {
  taskTitle: string;
  taskId: string;
  userFirstName: string;
  taskUrl: string;
  adminNotes?: string;
}

interface TaskRejectedEmailData {
  taskTitle: string;
  taskId: string;
  userFirstName: string;
  rejectionReason: string;
  adminNotes?: string;
  resubmitUrl: string;
}

interface EarlyCompletionRequestedEmailData {
  taskTitle: string;
  taskId: string;
  userFirstName: string;
  taskUrl: string;
  scheduledDate?: string | null;
  deadlineHours?: number; // default 72
}

interface EarlyCompletionReminderEmailData extends EarlyCompletionRequestedEmailData {
  hoursLeft: number;
}

interface EarlyCompletionAutoAcceptedEmailData {
  taskTitle: string;
  taskId: string;
  userFirstName: string;
  taskUrl: string;
}

// Email templates
const createTaskApprovedEmail = (data: TaskApprovedEmailData): EmailTemplate => {
  const subject = `✅ Tehtäväsi "${data.taskTitle}" on hyväksytty ja julkaistu!`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; }
        .footer { background: #e5e7eb; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
        .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .highlight { background: #e0f2fe; padding: 10px; border-left: 4px solid #0ea5e9; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Tehtäväsi on hyväksytty!</h1>
        </div>
        <div class="content">
          <p>Hei ${data.userFirstName},</p>
          
          <p>Hienoja uutisia! Tehtäväsi <strong>"${data.taskTitle}"</strong> on hyväksytty ja julkaistu Duunex-palvelussa.</p>
          
          <div class="highlight">
            <p><strong>Mitä tapahtuu seuraavaksi?</strong></p>
            <ul>
              <li>Tehtäväsi on nyt näkyvissä kaikille taskereillemme</li>
              <li>Saat ilmoituksen, kun joku tekijä tekee tarjouksen</li>
              <li>Voit tarkastella ja vertailla tarjouksia hallintapaneelissasi</li>
              <li>Kun hyväksyt tarjouksen, saat yhteydenoton tekijältä</li>
            </ul>
          </div>
          
          ${data.adminNotes ? `
          <p><strong>Admin-kommentti:</strong><br>
          <em>${data.adminNotes}</em></p>
          ` : ''}
          
          <p style="text-align: center;">
            <a href="${data.taskUrl}" class="button">Katso tehtävääsi</a>
          </p>
          
          <p>Kiitos, että käytät Duunexia!</p>
        </div>
        <div class="footer">
          <p>Duunex - Tehtävien markkinapaikka<br>
          <a href="https://duunex.fi">duunex.fi</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Hei ${data.userFirstName},

Hienoja uutisia! Tehtäväsi "${data.taskTitle}" on hyväksytty ja julkaistu Duunex-palvelussa.

Mitä tapahtuu seuraavaksi?
- Tehtäväsi on nyt näkyvissä kaikille taskereillemme
- Saat ilmoituksen, kun joku tekijä tekee tarjouksen
- Voit tarkastella ja vertailla tarjouksia hallintapaneelissasi
- Kun hyväksyt tarjouksen, saat yhteydenoton tekijältä

${data.adminNotes ? `Admin-kommentti: ${data.adminNotes}` : ''}

Katso tehtävääsi: ${data.taskUrl}

Kiitos, että käytät Duunexia!

---
Duunex - Tehtävien markkinapaikka
https://duunex.fi
  `;

  return { subject, htmlBody, textBody };
};

const createTaskRejectedEmail = (data: TaskRejectedEmailData): EmailTemplate => {
  const subject = `❌ Tehtäväsi "${data.taskTitle}" tarvitsee muutoksia`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; }
        .footer { background: #e5e7eb; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .warning { background: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0; }
        .help { background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Tehtäväsi tarvitsee muutoksia</h1>
        </div>
        <div class="content">
          <p>Hei ${data.userFirstName},</p>
          
          <p>Valitettavasti tehtäväsi <strong>"${data.taskTitle}"</strong> ei voitu julkaista nykyisessä muodossaan.</p>
          
          <div class="warning">
            <p><strong>Hylkäyksen syy:</strong><br>
            ${data.rejectionReason}</p>
          </div>
          
          ${data.adminNotes ? `
          <p><strong>Lisätietoja:</strong><br>
          <em>${data.adminNotes}</em></p>
          ` : ''}
          
          <div class="help">
            <p><strong>Mitä voit tehdä?</strong></p>
            <ul>
              <li>Muokkaa tehtävän kuvausta edellä mainittujen ohjeiden mukaan</li>
              <li>Tarkista, että kaikki tiedot ovat täydelliset ja tarkat</li>
              <li>Lähetä tehtävä uudelleen tarkistettavaksi</li>
            </ul>
          </div>
          
          <p style="text-align: center;">
            <a href="${data.resubmitUrl}" class="button">Muokkaa ja lähetä uudelleen</a>
          </p>
          
          <p>Jos sinulla on kysymyksiä, ota yhteyttä asiakaspalveluumme.</p>
        </div>
        <div class="footer">
          <p>Duunex - Tehtävien markkinapaikka<br>
          <a href="https://duunex.fi">duunex.fi</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Hei ${data.userFirstName},

Valitettavasti tehtäväsi "${data.taskTitle}" ei voitu julkaista nykyisessä muodossaan.

Hylkäyksen syy:
${data.rejectionReason}

${data.adminNotes ? `Lisätietoja: ${data.adminNotes}` : ''}

Mitä voit tehdä?
- Muokkaa tehtävän kuvausta edellä mainittujen ohjeiden mukaan
- Tarkista, että kaikki tiedot ovat täydelliset ja tarkat
- Lähetä tehtävä uudelleen tarkistettavaksi

Muokkaa ja lähetä uudelleen: ${data.resubmitUrl}

Jos sinulla on kysymyksiä, ota yhteyttä asiakaspalveluumme.

---
Duunex - Tehtävien markkinapaikka
https://duunex.fi
  `;

  return { subject, htmlBody, textBody };
};

// Main email sending function
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  options: {
    from?: string;
    replyTo?: string;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // MVP safeguard: if no Resend key (or in dev) - log instead of sending.
    // This prevents accidental spam and keeps local development usable.
    if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) {
      console.log('\n📧 EMAIL (Development Mode):');
      console.log('From:', options.from || 'no-reply@duunex.fi');
      console.log('To:', to);
      console.log('Subject:', template.subject);
      console.log('---');
      console.log(template.textBody);
      console.log('---\n');

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: options.from || 'Duunex <no-reply@duunex.fi>',
      to,
      subject: template.subject,
      html: template.htmlBody,
      text: template.textBody,
      replyTo: options.replyTo,
    });

    return { success: true };

  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}

type EmailDeliveryLogParams = {
  eventType: string;
  eventId: string;
  recipientId: string;
  recipientEmail: string;
  template: EmailTemplate;
  options?: {
    from?: string;
    replyTo?: string;
  };
};

async function sendEmailWithDeliveryLog({
  eventType,
  eventId,
  recipientId,
  recipientEmail,
  template,
  options,
}: EmailDeliveryLogParams): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  try {
    const supabaseAny = supabaseAdmin;

    // Dedup by (eventType, eventId, recipientId)
    const { data: existing } = await supabaseAny
      .from('email_delivery_logs')
      .select('id,status')
      .eq('event_type', eventType)
      .eq('event_id', eventId)
      .eq('recipient_id', recipientId)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      return { success: true, skipped: true };
    }

    const { data: logRow } = await supabaseAny
      .from('email_delivery_logs')
      .insert({
        event_type: eventType,
        event_id: eventId,
        recipient_id: recipientId,
        recipient_email: recipientEmail,
        status: 'queued',
      } as any)
      .select('id')
      .single();

    const sendResult = await sendEmail(recipientEmail, template, options);
    const logId: string | undefined = logRow?.id;
    if (!logId) {
      // If for some reason the delivery log row wasn't created, we still consider
      // the email outcome returned by Resend.
      return sendResult;
    }

    if (sendResult.success) {
      await supabaseAny
        .from('email_delivery_logs')
        .update({
          status: 'sent',
          error: null,
          sent_at: new Date().toISOString(),
        })
        .eq('id', logId);
    } else {
      await supabaseAny
        .from('email_delivery_logs')
        .update({
          status: 'failed',
          error: sendResult.error ?? 'Unknown email error',
          sent_at: null,
        })
        .eq('id', logId);
    }

    return sendResult;
  } catch (error) {
    console.error('Email delivery log error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown email delivery log error' };
  }
}

// Specific email functions
export async function sendTaskApprovedEmail(data: TaskApprovedEmailData, userEmail: string) {
  const template = createTaskApprovedEmail(data);
  return await sendEmail(userEmail, template, {
    from: 'Duunex <no-reply@duunex.fi>',
    replyTo: 'tuki@duunex.fi',
  });
}

export async function sendTaskRejectedEmail(data: TaskRejectedEmailData, userEmail: string) {
  const template = createTaskRejectedEmail(data);
  return await sendEmail(userEmail, template, {
    from: 'Duunex <no-reply@duunex.fi>',
    replyTo: 'tuki@duunex.fi',
  });
}

// Early completion email templates
const createEarlyCompletionRequestedEmail = (data: EarlyCompletionRequestedEmailData): EmailTemplate => {
  const subject = `⏰ Aikainen valmistuminen odottaa vahvistustasi – "${data.taskTitle}"`;
  const deadlineText = data.deadlineHours ? `${data.deadlineHours} h` : '72 h';
  const dateText = data.scheduledDate ? ` (aikataulupäivä ${new Date(data.scheduledDate).toLocaleDateString('fi-FI')})` : '';
  const htmlBody = `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4338ca; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f5f7ff; padding: 20px; }
        .footer { background: #e5e7eb; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
        .button { display: inline-block; background: #4338ca; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .highlight { background: #eef2ff; padding: 10px; border-left: 4px solid #4338ca; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Aikainen valmistuminen odottaa vahvistustasi</h1></div>
        <div class="content">
          <p>Hei ${data.userFirstName},</p>
          <p>Tekijä on merkinnyt tehtävän <strong>"${data.taskTitle}"</strong> valmiiksi ennen aikataulua${dateText}.</p>
          <div class="highlight">
            <p><strong>Toimi ${deadlineText} kuluessa</strong> hyväksyäksesi, hylätäksesi tai riitauttaaksesi valmistumisen.</p>
          </div>
          <p style="text-align:center"><a class="button" href="${data.taskUrl}">Avaa tehtävä</a></p>
          <p>Jos et reagoi ajoissa, järjestelmä tekee automaattisen päätöksen.</p>
        </div>
        <div class="footer">Duunex – Tehtävien markkinapaikka</div>
      </div>
    </body></html>`;
  const textBody = `Hei ${data.userFirstName},\n\nTekijä on merkinnyt tehtävän "${data.taskTitle}" valmiiksi ennen aikataulua.${dateText}\n\nToimi ${deadlineText} kuluessa hyväksyäksesi, hylätäksesi tai riitauttaaksesi valmistumisen.\n\nAvaa tehtävä: ${data.taskUrl}\n\nDuunex`;
  return { subject, htmlBody, textBody };
};

const createEarlyCompletionReminderEmail = (data: EarlyCompletionReminderEmailData): EmailTemplate => {
  const subject = `⏳ Muistutus: ${data.hoursLeft} h aikaa vahvistaa – "${data.taskTitle}"`;
  const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
    <p>Hei ${data.userFirstName},</p>
    <p>Muistutus: ${data.hoursLeft} h aikaa reagoida tehtävän "${data.taskTitle}" varhaiseen valmistumiseen.</p>
    <p><a href="${data.taskUrl}">Avaa tehtävä</a></p>
  </body></html>`;
  const textBody = `Hei ${data.userFirstName},\n\nMuistutus: ${data.hoursLeft} h aikaa reagoida tehtävän "${data.taskTitle}" varhaiseen valmistumiseen.\n\n${data.taskUrl}`;
  return { subject, htmlBody, textBody };
};

const createEarlyCompletionAutoAcceptedEmail = (data: EarlyCompletionAutoAcceptedEmailData): EmailTemplate => {
  const subject = `✅ Aikainen valmistuminen hyväksyttiin automaattisesti – "${data.taskTitle}"`;
  const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
    <p>Hei ${data.userFirstName},</p>
    <p>Tehtävä "${data.taskTitle}" hyväksyttiin automaattisesti määräajan umpeuduttua.</p>
    <p><a href="${data.taskUrl}">Avaa tehtävä</a></p>
  </body></html>`;
  const textBody = `Hei ${data.userFirstName},\n\nTehtävä "${data.taskTitle}" hyväksyttiin automaattisesti määräajan umpeuduttua.\n\n${data.taskUrl}`;
  return { subject, htmlBody, textBody };
};

export async function sendEarlyCompletionRequestedEmail(data: EarlyCompletionRequestedEmailData, userEmail: string) {
  const template = createEarlyCompletionRequestedEmail(data);
  return await sendEmail(userEmail, template, {
    from: 'Duunex <no-reply@duunex.fi>',
    replyTo: 'tuki@duunex.fi',
  });
}

export async function sendEarlyCompletionReminderEmail(data: EarlyCompletionReminderEmailData, userEmail: string) {
  const template = createEarlyCompletionReminderEmail(data);
  return await sendEmail(userEmail, template, {
    from: 'Duunex <no-reply@duunex.fi>',
    replyTo: 'tuki@duunex.fi',
  });
}

export async function sendEarlyCompletionAutoAcceptedEmail(data: EarlyCompletionAutoAcceptedEmailData, userEmail: string) {
  const template = createEarlyCompletionAutoAcceptedEmail(data);
  return await sendEmail(userEmail, template, {
    from: 'Duunex <no-reply@duunex.fi>',
    replyTo: 'tuki@duunex.fi',
  });
}

// ============================================================================
// Chat / Offers / Payments email templates
// ============================================================================

interface ChatMessageEmailData {
  messageId: string;
  taskId: string;
  taskTitle: string;
  senderName: string;
  recipientFirstName: string;
  messagePreview: string;
  taskUrl: string;
}

const createChatMessageEmail = (data: ChatMessageEmailData): EmailTemplate => {
  const subject = `💬 Uusi viesti: "${data.taskTitle}"`;
  const safePreview = data.messagePreview || 'Sinulla on uusi viesti.';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#0ea5e9;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="margin:0;font-size:20px;">Uusi viesti Duunexissa</h1>
          </div>
          <div style="background:#f0f9ff;padding:20px;">
            <p>Hei ${data.recipientFirstName},</p>
            <p><strong>${data.senderName}</strong> lähetti sinulle viestin tehtävästä <strong>"${data.taskTitle}"</strong>.</p>
            <div style="background:#e0f2fe;padding:15px;border-left:4px solid #0ea5e9;margin:15px 0;">
              <p style="margin:0;"><strong>Viesti:</strong><br />${safePreview.replaceAll('\n', '<br/>')}</p>
            </div>
            <p style="text-align:center;">
              <a href="${data.taskUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin:15px 0;">
                Lue viesti
              </a>
            </p>
            <p style="font-size:14px;color:#475569;">Jos et tunnista lähettäjää, tarkista tehtävän tiedot sovelluksesta.</p>
          </div>
          <div style="background:#e5e7eb;padding:15px;text-align:center;border-radius:0 0 8px 8px;font-size:14px;">
            <p style="margin:0;">Duunex – Tehtävien markkinapaikka<br/><a href="https://duunex.fi">duunex.fi</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `Hei ${data.recipientFirstName},\n\n${data.senderName} lähetti sinulle viestin tehtävästä "${data.taskTitle}".\n\nViesti:\n${safePreview}\n\nLue viesti: ${data.taskUrl}\n\nDuunex\nhttps://duunex.fi`;

  return { subject, htmlBody, textBody };
};

interface TaskOfferEmailData {
  offerId: string;
  taskId: string;
  taskTitle: string;
  taskerName: string;
  ownerFirstName: string;
  offeredPrice: number;
  taskUrl: string;
}

const createTaskOfferEmail = (data: TaskOfferEmailData): EmailTemplate => {
  const subject = `📩 Uusi tarjous: "${data.taskTitle}" (${data.offeredPrice}€)`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#0ea5e9;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="margin:0;font-size:20px;">Sinulle on tehty tarjous</h1>
          </div>
          <div style="background:#f0f9ff;padding:20px;">
            <p>Hei ${data.ownerFirstName},</p>
            <p>${data.taskerName} teki sinulle tarjouksen tehtävästä <strong>"${data.taskTitle}"</strong>.</p>
            <div style="background:#e0f2fe;padding:15px;border-left:4px solid #0ea5e9;margin:15px 0;">
              <p style="margin:0;"><strong>Tarjoushinta:</strong> ${data.offeredPrice}€</p>
            </div>
            <p style="text-align:center;">
              <a href="${data.taskUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin:15px 0;">
                Katso tarjous
              </a>
            </p>
            <p style="font-size:14px;color:#475569;">Voit hyväksyä tai hylätä tarjouksen sovelluksessa.</p>
          </div>
          <div style="background:#e5e7eb;padding:15px;text-align:center;border-radius:0 0 8px 8px;font-size:14px;">
            <p style="margin:0;">Duunex – Tehtävien markkinapaikka<br/><a href="https://duunex.fi">duunex.fi</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `Hei ${data.ownerFirstName},\n\n${data.taskerName} teki sinulle tarjouksen tehtävästä "${data.taskTitle}".\n\nTarjoushinta: ${data.offeredPrice}€\n\nKatso tarjous: ${data.taskUrl}\n\nDuunex\nhttps://duunex.fi`;

  return { subject, htmlBody, textBody };
};

type PaymentEmailRecipientKind = 'customer' | 'tasker';

interface PaymentSucceededEmailData {
  paymentId: string;
  taskId: string;
  taskTitle: string;
  amount: number;
  currency: string;
  recipientKind: PaymentEmailRecipientKind;
  recipientFirstName: string;
  otherPartyName?: string;
  taskUrl: string;
}

const createPaymentSucceededEmail = (data: PaymentSucceededEmailData): EmailTemplate => {
  const subject =
    data.recipientKind === 'customer'
      ? `✅ Maksu onnistui – tehtävä "${data.taskTitle}" on varattu`
      : `✅ Maksu vastaanotettu – voit aloittaa: "${data.taskTitle}"`;

  const otherPartyLine =
    data.otherPartyName
      ? data.recipientKind === 'customer'
        ? `<p>Työntekijänä toimii nyt <strong>${data.otherPartyName}</strong>.</p>`
        : `<p>Asiakas on <strong>${data.otherPartyName}</strong>.</p>`
      : '';

  const headerBg = data.recipientKind === 'customer' ? '#0ea5e9' : '#f59e0b';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:${headerBg};color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="margin:0;font-size:20px;">Maksu onnistui</h1>
          </div>
          <div style="background:#f9fafb;padding:20px;">
            <p>Hei ${data.recipientFirstName},</p>
            <p>Tehtävä <strong>"${data.taskTitle}"</strong> on nyt ${data.recipientKind === 'customer' ? 'varattu' : 'sinun aloitettavissa'}.</p>
            ${otherPartyLine}
            <div style="background:#eef2ff;padding:15px;border-left:4px solid #6366f1;margin:15px 0;">
              <p style="margin:0;"><strong>Summa:</strong> ${data.amount} ${data.currency}</p>
            </div>
            <p style="text-align:center;">
              <a href="${data.taskUrl}" style="display:inline-block;background:${headerBg};color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin:15px 0;">
                Avaa tehtävä
              </a>
            </p>
            <p style="font-size:14px;color:#475569;">Jos sinulla on kysyttävää, avaa viestit tehtävän sivulta.</p>
          </div>
          <div style="background:#e5e7eb;padding:15px;text-align:center;border-radius:0 0 8px 8px;font-size:14px;">
            <p style="margin:0;">Duunex – Tehtävien markkinapaikka<br/><a href="https://duunex.fi">duunex.fi</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `Hei ${data.recipientFirstName},\n\nTehtävä "${data.taskTitle}" on nyt ${data.recipientKind === 'customer' ? 'varattu' : 'sinun aloitettavissa'}.\n\nSumma: ${data.amount} ${data.currency}\n\nAvaa tehtävä: ${data.taskUrl}\n\nDuunex\nhttps://duunex.fi`;

  return { subject, htmlBody, textBody };
};

const truncate = (value: string, maxChars: number) => {
  const v = value || '';
  if (v.length <= maxChars) return v;
  return `${v.slice(0, maxChars)}...`;
};

export async function sendChatMessageEmail(data: ChatMessageEmailData, recipientEmail: string, recipientId: string) {
  const template = createChatMessageEmail({
    ...data,
    messagePreview: truncate(data.messagePreview, 300),
  });
  return await sendEmailWithDeliveryLog({
    eventType: 'chat_message_created',
    eventId: data.messageId,
    recipientId,
    recipientEmail,
    template,
    options: {
      from: 'Duunex <no-reply@duunex.fi>',
      replyTo: 'tuki@duunex.fi',
    },
  });
}

export async function sendTaskOfferEmail(data: TaskOfferEmailData, recipientEmail: string, recipientId: string) {
  const template = createTaskOfferEmail(data);
  return await sendEmailWithDeliveryLog({
    eventType: 'task_offer_created',
    eventId: data.offerId,
    recipientId,
    recipientEmail,
    template,
    options: {
      from: 'Duunex <no-reply@duunex.fi>',
      replyTo: 'tuki@duunex.fi',
    },
  });
}

export async function sendPaymentSucceededEmail(
  data: PaymentSucceededEmailData,
  recipientEmail: string,
  recipientId: string,
) {
  const template = createPaymentSucceededEmail(data);
  return await sendEmailWithDeliveryLog({
    eventType: 'payment_succeeded',
    eventId: data.paymentId,
    recipientId,
    recipientEmail,
    template,
    options: {
      from: 'Duunex <no-reply@duunex.fi>',
      replyTo: 'tuki@duunex.fi',
    },
  });
}

// Email service configuration check
export async function isEmailServiceConfigured(): Promise<boolean> {
  return !!(
    process.env.RESEND_API_KEY ||
    process.env.SENDGRID_API_KEY
  );
}
