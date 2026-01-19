import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, phone, subject, message } = await req.json();

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Kaikki pakolliset kentät tulee täyttää' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Virheellinen sähköpostiosoite' },
        { status: 400 }
      );
    }

    // Here you would typically send an email or store in database
    // For now, we'll just log the contact form submission
    console.log('Contact form submission:', {
      name,
      email,
      company: company || 'Ei annettu',
      phone: phone || 'Ei annettu',
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // Implement actual email sending or database storage for contact form submissions
    // Example with email service:
    // await sendEmail({
    //   to: 'info@tehtavamestari.fi',
    //   subject: `Yhteydenotto: ${subject}`,
    //   html: `
    //     <h2>Uusi yhteydenotto TehtäväMestari-sivustolta</h2>
    //     <p><strong>Nimi:</strong> ${name}</p>
    //     <p><strong>Sähköposti:</strong> ${email}</p>
    //     <p><strong>Yritys:</strong> ${company || 'Ei annettu'}</p>
    //     <p><strong>Puhelin:</strong> ${phone || 'Ei annettu'}</p>
    //     <p><strong>Aihe:</strong> ${subject}</p>
    //     <p><strong>Viesti:</strong></p>
    //     <p>${message}</p>
    //   `
    // });

    return NextResponse.json(
      { message: 'Viesti lähetetty onnistuneesti' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Sisäinen palvelinvirhe' },
      { status: 500 }
    );
  }
}