'use server'

import { createClient } from '@/lib/supabase/server'

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  priority: 'low' | 'normal' | 'high'
}

export async function submitSupportRequest(formData: ContactFormData) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Käyttäjän tunnistaminen epäonnistui'
      }
    }

    // Create support ticket in database
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
        status: 'open',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating support ticket:', error)
      return {
        success: false,
        error: 'Tukipyynnön tallentaminen epäonnistui'
      }
    }

    // Send email notification to admin
    // Integrates with email service (SendGrid, Postmark, etc.)
    console.log('Support ticket created:', data)

    // For now, we'll just log the support request
    // In production, you would send an email here
    await sendEmailToAdmin({
      ticketId: data.id,
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
      priority: formData.priority
    })

    return {
      success: true,
      ticketId: data.id
    }

  } catch (error) {
    console.error('Unexpected error in submitSupportRequest:', error)
    return {
      success: false,
      error: 'Odottamaton virhe tapahtui'
    }
  }
}

// Mock email function - replace with actual email service integration
async function sendEmailToAdmin({
  ticketId,
  name,
  email,
  subject,
  message,
  priority
}: {
  ticketId: string
  name: string
  email: string
  subject: string
  message: string
  priority: string
}) {
  // This is a placeholder for email functionality
  // In production, integrate with services like:
  // - SendGrid
  // - Postmark
  // - AWS SES
  // - Nodemailer with SMTP
  
  console.log('📧 Email to admin:', {
    to: 'admin@duunex.fi',
    subject: `[${priority.toUpperCase()}] Tukipyyntö #${ticketId}: ${subject}`,
    body: `
      Uusi tukipyyntö saapunut:
      
      Tiketti ID: ${ticketId}
      Lähettäjä: ${name} (${email})
      Aihe: ${subject}
      Kiireellisyys: ${priority}
      
      Viesti:
      ${message}
      
      ---
      Duunex Tukijärjestelmä
    `
  })
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return true
} 