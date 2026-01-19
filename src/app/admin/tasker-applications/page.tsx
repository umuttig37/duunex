import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import { type SupabaseClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Eye } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type UserProfile = Database['public']['Tables']['profiles']['Row'];
type TaskerApplication =
  Database['public']['Tables']['tasker_applications']['Row'];

interface ExtendedTaskerApplication extends TaskerApplication {
  profile: Pick<UserProfile, 'first_name' | 'last_name' | 'email'> | null;
}

async function getTaskerApplications(
  supabase: SupabaseClient<Database>
): Promise<ExtendedTaskerApplication[]> {
  const { data, error } = await supabase
    .from('tasker_applications')
    .select(
      `
      *,
      profile:profiles!tasker_applications_profile_id_fkey (first_name, last_name, email)
    `
    )
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasker applications:', error);
    return [];
  }
  return data as ExtendedTaskerApplication[];
}

const getStatusBadgeVariant = (
  status: string | null
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'pending':
      return 'outline';
    case 'approved':
      return 'default'; // Or a success color like green if you have one
    case 'not_approved':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default async function TaskerApplicationsPage() {
  const supabase = await createClient();
  const applications = await getTaskerApplications(supabase);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tekijähakemukset</CardTitle>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Ei käsiteltäviä hakemuksia.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hakija</TableHead>
                <TableHead>Sähköposti</TableHead>
                <TableHead>Lähetetty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Muistiinpanot</TableHead>
                <TableHead className="text-right">Toiminnot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    {app.profile?.first_name || 'N/A'}{' '}
                    {app.profile?.last_name || ''}
                  </TableCell>
                  <TableCell>{app.profile?.email || 'N/A'}</TableCell>
                  <TableCell>
                    {app.submitted_at
                      ? format(new Date(app.submitted_at), 'dd.MM.yyyy HH:mm', {
                          locale: fi,
                        })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(app.status)}
                      className="capitalize"
                    >
                      {app.status || 'Tuntematon'}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="max-w-xs truncate"
                    title={app.review_notes || ''}
                  >
                    {app.review_notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/tasker-applications/${app.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> Tarkastele
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
