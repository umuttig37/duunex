import DashboardLayout from '@/components/shared/layout/dashboard_layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Database } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'
import { AlertTriangle } from 'lucide-react'
import { redirect } from 'next/navigation'

import TukiClientContent from './tuki-client-content'

export default async function TukiPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login?message=Please log in to access support.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Support: Error fetching profile:', profileError)
    const errorProfile = { 
      id: user?.id || '', 
      role: '', 
      first_name: null, 
      last_name: null, 
      avatar_url: null,
      phone_number: null,
      bio: null,
      is_verified: false,
      created_at: new Date().toISOString(),
      address: null,
      city: null,
      zipcode: null,
      email: user?.email || null 
    } as Database['public']['Tables']['profiles']['Row']

    return (
      <DashboardLayout user={errorProfile}>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <AlertTriangle className="mr-2" /> Virhe Profiilin Latauksessa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Profiilitietojen lataaminen epäonnistui. Yritä myöhemmin uudelleen.</p>
              <p className="mt-1 text-xs text-gray-500">Virhe: {profileError?.message || 'Tuntematon virhe'}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={profile}>
      <TukiClientContent />
    </DashboardLayout>
  )
} 