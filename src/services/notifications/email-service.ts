'use server'

// Email service for TaskMVP
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
        .header { background: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; }
        .footer { background: #e5e7eb; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
        .button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .highlight { background: #dcfce7; padding: 10px; border-left: 4px solid #22c55e; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Tehtäväsi on hyväksytty!</h1>
        </div>
        <div class="content">
          <p>Hei ${data.userFirstName},</p>
          
          <p>Hienoja uutisia! Tehtäväsi <strong>"${data.taskTitle}"</strong> on hyväksytty ja julkaistu TaskMVP-palvelussa.</p>
          
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
          
          <p>Kiitos, että käytät TaskMVP:tä!</p>
        </div>
        <div class="footer">
          <p>TaskMVP - Tehtävien markkinapaikka<br>
          <a href="https://taskmvp.fi">taskmvp.fi</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textBody = `
Hei ${data.userFirstName},

Hienoja uutisia! Tehtäväsi "${data.taskTitle}" on hyväksytty ja julkaistu TaskMVP-palvelussa.

Mitä tapahtuu seuraavaksi?
- Tehtäväsi on nyt näkyvissä kaikille taskereillemme
- Saat ilmoituksen, kun joku tekijä tekee tarjouksen
- Voit tarkastella ja vertailla tarjouksia hallintapaneelissasi
- Kun hyväksyt tarjouksen, saat yhteydenoton tekijältä

${data.adminNotes ? `Admin-kommentti: ${data.adminNotes}` : ''}

Katso tehtävääsi: ${data.taskUrl}

Kiitos, että käytät TaskMVP:tä!

---
TaskMVP - Tehtävien markkinapaikka
https://taskmvp.fi
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
          <p>TaskMVP - Tehtävien markkinapaikka<br>
          <a href="https://taskmvp.fi">taskmvp.fi</a></p>
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
TaskMVP - Tehtävien markkinapaikka
https://taskmvp.fi
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
    // For development - log email instead of sending
    if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_API_KEY) {
      console.log('\n📧 EMAIL (Development Mode):');
      console.log('From:', options.from || 'no-reply@taskmvp.fi');
      console.log('To:', to);
      console.log('Subject:', template.subject);
      console.log('---');
      console.log(template.textBody);
      console.log('---\n');
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true };
    }

    // Production email sending would go here
    // Example integrations:
    
    // RESEND (recommended)
    /*
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: options.from || 'TaskMVP <no-reply@taskmvp.fi>',
      to,
      subject: template.subject,
      html: template.htmlBody,
      text: template.textBody,
      replyTo: options.replyTo,
    });
    */
    
    // SENDGRID
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send({
      to,
      from: options.from || 'no-reply@taskmvp.fi',
      subject: template.subject,
      html: template.htmlBody,
      text: template.textBody,
    });
    */
    
    // For now, just log in production too until email service is configured
    console.log('📧 EMAIL (Production - Not Configured):', {
      to,
      subject: template.subject,
      timestamp: new Date().toISOString(),
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

// Specific email functions
export async function sendTaskApprovedEmail(data: TaskApprovedEmailData, userEmail: string) {
  const template = createTaskApprovedEmail(data);
  return await sendEmail(userEmail, template, {
    from: 'TaskMVP <no-reply@taskmvp.fi>',
    replyTo: 'tuki@taskmvp.fi',
  });
}

export async function sendTaskRejectedEmail(data: TaskRejectedEmailData, userEmail: string) {
  const template = createTaskRejectedEmail(data);
  return await sendEmail(userEmail, template, {
    from: 'TaskMVP <no-reply@taskmvp.fi>',
    replyTo: 'tuki@taskmvp.fi',
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
        <div class="footer">TaskMVP – Tehtävien markkinapaikka</div>
      </div>
    </body></html>`;
  const textBody = `Hei ${data.userFirstName},\n\nTekijä on merkinnyt tehtävän "${data.taskTitle}" valmiiksi ennen aikataulua.${dateText}\n\nToimi ${deadlineText} kuluessa hyväksyäksesi, hylätäksesi tai riitauttaaksesi valmistumisen.\n\nAvaa tehtävä: ${data.taskUrl}\n\nTaskMVP`;
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
    from: 'TaskMVP <no-reply@taskmvp.fi>',
    replyTo: 'tuki@taskmvp.fi',
  });
}

export async function sendEarlyCompletionReminderEmail(data: EarlyCompletionReminderEmailData, userEmail: string) {
  const template = createEarlyCompletionReminderEmail(data);
  return await sendEmail(userEmail, template, {
    from: 'TaskMVP <no-reply@taskmvp.fi>',
    replyTo: 'tuki@taskmvp.fi',
  });
}

export async function sendEarlyCompletionAutoAcceptedEmail(data: EarlyCompletionAutoAcceptedEmailData, userEmail: string) {
  const template = createEarlyCompletionAutoAcceptedEmail(data);
  return await sendEmail(userEmail, template, {
    from: 'TaskMVP <no-reply@taskmvp.fi>',
    replyTo: 'tuki@taskmvp.fi',
  });
}

// Email service configuration check
export async function isEmailServiceConfigured(): Promise<boolean> {
  return !!(
    process.env.RESEND_API_KEY || 
    process.env.SENDGRID_API_KEY || 
    process.env.EMAIL_API_KEY
  );
}
