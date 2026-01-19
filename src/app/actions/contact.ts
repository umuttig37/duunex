'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitContactLead(payload: {
  firstName: string
  lastName: string
  email: string
  company?: string
  message: string
  subscribe?: boolean
}) {
  try {
    const supabase = await createClient()

    // try to get current user (optional)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          name: `${payload.firstName} ${payload.lastName}`.trim(),
          email: payload.email,
          subject: payload.company ? `Yhteydenotto – ${payload.company}` : 'Yhteydenotto lomakkeesta',
          message: payload.message,
          priority: 'normal',
          status: 'open',
        })
        .select('id')
        .single()

      if (error) {
        console.error('submitContactLead error', error)
        return { success: false, error: 'Tallennus epäonnistui' }
      }

      return { success: true, id: data.id }
    }

    // If not logged in, just log lead for now to avoid RLS constraint
    console.log('Contact lead (visitor):', payload)
    return { success: true }
  } catch (e) {
    console.error('submitContactLead unexpected', e)
    return { success: false, error: 'Odottamaton virhe' }
  }
}
