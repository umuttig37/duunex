import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, phone, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Kaikki pakolliset kentät tulee täyttää' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Virheellinen sähköpostiosoite' },
        { status: 400 }
      );
    }

    console.log('Contact form submission:', {
      name,
      email,
      company: company || 'Ei annettu',
      phone: phone || 'Ei annettu',
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

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
