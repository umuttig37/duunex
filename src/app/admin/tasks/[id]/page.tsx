import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Euro,
    Eye,
    MapPin,
    MessageSquare,
    User,
    XCircle,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Task = Database['public']['Tables']['tasks']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface ExtendedTask extends Task {
  categories: { name_fi: string; name: string } | null;
  publisher: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'> | null;
  task_attachments: Array<{ id: string; file_url: string; file_type: string }>;
  assigned_tasker_profile?: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url' | 'email' | 'bio'> | null;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'paid':
      return 'default';
    case 'completed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'open':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    case 'pending_approval':
      return 'secondary';
    case 'assigned':
      return 'default';
    case 'awaiting_payment':
      return 'secondary';
    case 'in_progress':
      return 'default';
    case 'early_completed':
      return 'default';
    case 'disputed':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Maksettu';
    case 'completed':
      return 'Valmis';
    case 'pending':
      return 'Odottaa';
    case 'open':
      return 'Avoin';
    case 'cancelled':
      return 'Peruttu';
    case 'pending_approval':
      return 'Odottaa hyväksyntää';
    case 'assigned':
      return 'Osoitettu';
    case 'awaiting_payment':
      return 'Odottaa maksua';
    case 'in_progress':
      return 'Käynnissä';
    case 'early_completed':
      return 'Varhain valmistunut';
    case 'disputed':
      return 'Riitautettu';
    default:
      return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
    case 'paid':
    case 'early_completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'cancelled':
    case 'disputed':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'pending_approval':
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'open':
    case 'assigned':
    case 'awaiting_payment':
    case 'in_progress':
      return <AlertTriangle className="h-4 w-4 text-blue-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

export default async function AdminTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const resolvedParams = await params;

  // Fetch task details with comprehensive information
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(
      `
      *,
      categories:category_id(name_fi, name),
      publisher:profiles!tasks_user_id_profiles_fkey(first_name, last_name, avatar_url, email),
      task_attachments(id, file_url, file_type),
      assigned_tasker_profile:profiles!tasks_assigned_tasker_id_fkey(first_name, last_name, avatar_url, email, bio)
    `
    )
    .eq('id', resolvedParams.id)
    .single();

  if (taskError) {
    console.error('Error fetching task:', taskError);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <h1 className="text-2xl font-bold mb-4">Virhe</h1>
          <p>Tehtävän tietoja ei voitu ladata: {taskError.message}</p>
          <Button asChild className="mt-4">
            <Link href="/admin/tasks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Takaisin tehtävälistaan
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tehtävää ei löytynyt</h1>
          <Button asChild>
            <Link href="/admin/tasks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Takaisin tehtävälistaan
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Fetch related data
  const { data: offers } = await supabase
    .from('task_offers')
    .select(`
      *,
      tasker_profile:profiles!task_offers_tasker_id_fkey(first_name, last_name, avatar_url, email)
    `)
    .eq('task_id', resolvedParams.id)
    .order('created_at', { ascending: false });

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_profile_id_fkey(first_name, last_name),
      reviewee:profiles!reviews_reviewee_profile_id_fkey(first_name, last_name)
    `)
    .eq('task_id', resolvedParams.id);

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('task_id', resolvedParams.id)
    .order('created_at', { ascending: false });

  const typedTask = task as ExtendedTask;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/tasks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Takaisin
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{typedTask.title}</h1>
            <p className="text-gray-600">Tehtävä #{typedTask.id.slice(0, 8)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusIcon(typedTask.status)}
          <Badge variant={getStatusBadgeVariant(typedTask.status)}>
            {getStatusText(typedTask.status)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Tehtävän tiedot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Kuvaus</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{typedTask.description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Sijainti:</span>
                  <span className="text-sm">{typedTask.location_text}</span>
                </div>
                
                {typedTask.budget && (
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Budjetti:</span>
                    <span className="text-sm font-medium">{typedTask.budget}€</span>
                  </div>
                )}

                {typedTask.scheduled_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Aikataulu:</span>
                    <span className="text-sm">
                      {format(new Date(typedTask.scheduled_date), 'dd.MM.yyyy', { locale: fi })}
                      {typedTask.scheduled_time_slot && ` (${typedTask.scheduled_time_slot})`}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Luotu:</span>
                  <span className="text-sm">
                    {format(new Date(typedTask.created_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                  </span>
                </div>
              </div>

              {typedTask.categories && (
                <div>
                  <span className="text-sm text-gray-600">Kategoria:</span>
                  <Badge variant="outline" className="ml-2">
                    {typedTask.categories.name_fi}
                  </Badge>
                </div>
              )}

              {/* Task Attachments */}
              {typedTask.task_attachments && typedTask.task_attachments.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Liitteet</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {typedTask.task_attachments.map((attachment) => (
                      <div key={attachment.id} className="relative">
                        <img
                          src={attachment.file_url}
                          alt="Task attachment"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Offers */}
          {offers && offers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Tarjoukset ({offers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {offers.map((offer: any) => (
                    <div key={offer.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {offer.tasker_profile?.first_name?.[0] || 'T'}
                          </div>
                          <span className="font-medium">
                            {offer.tasker_profile?.first_name} {offer.tasker_profile?.last_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{offer.offered_price}€</span>
                          <Badge variant={offer.status === 'accepted' ? 'default' : 'outline'}>
                            {offer.status === 'accepted' ? 'Hyväksytty' : 
                             offer.status === 'declined' ? 'Hylätty' : 'Odottaa'}
                          </Badge>
                        </div>
                      </div>
                      {offer.message && (
                        <p className="text-gray-700 text-sm">{offer.message}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {format(new Date(offer.created_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Asiakas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  {typedTask.publisher?.avatar_url ? (
                    <img
                      src={typedTask.publisher.avatar_url}
                      alt="Customer"
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-medium">
                      {typedTask.publisher?.first_name?.[0] || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {typedTask.publisher?.first_name} {typedTask.publisher?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{(typedTask.publisher as any)?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Tasker */}
          {typedTask.assigned_tasker_profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Osoitettu tekijä
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    {typedTask.assigned_tasker_profile.avatar_url ? (
                      <img
                        src={typedTask.assigned_tasker_profile.avatar_url}
                        alt="Tasker"
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <span className="text-lg font-medium">
                        {typedTask.assigned_tasker_profile.first_name?.[0] || 'T'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {typedTask.assigned_tasker_profile.first_name} {typedTask.assigned_tasker_profile.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{typedTask.assigned_tasker_profile.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
          {payments && payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Maksutiedot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {payments.map((payment: any) => (
                    <div key={payment.id} className="flex justify-between items-center">
                      <span className="text-sm">{payment.amount}€</span>
                      <Badge variant={payment.status === 'paid' ? 'default' : 'outline'}>
                        {payment.status === 'paid' ? 'Maksettu' : 'Odottaa'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Arvostelut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="border-b pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {review.reviewer?.first_name} {review.reviewer?.last_name}
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
