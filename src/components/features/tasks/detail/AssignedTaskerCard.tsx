import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, User, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface AssignedTaskerCardProps {
  tasker: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    bio?: string;
  };
  taskId: string;
  canMessage?: boolean;
  status?: string;
}

export default function AssignedTaskerCard({ 
  tasker, 
  taskId, 
  canMessage = false,
  status = 'paid'
}: AssignedTaskerCardProps) {
  const fullName = `${tasker.first_name || ''} ${tasker.last_name || ''}`.trim() || 'Tuntematon';

  return (
    <Card className="border-primary/20 bg-primary/5/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
          <Star className="h-5 w-5 mr-2 text-primary" />
          {status === 'request_sent' ? 'Pyyntö lähetetty tekijälle' : 'Valittu tekijä'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {tasker.avatar_url ? (
              <Image
                src={tasker.avatar_url}
                alt={fullName}
                width={56}
                height={56}
                className="rounded-full border-2 border-primary/20"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <User className="h-7 w-7 text-primary" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 text-base mb-1">
              {fullName}
            </h3>
            
            {tasker.bio && (
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                {tasker.bio}
              </p>
            )}

            {status === 'request_sent' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-amber-700 font-medium">
                  Odottaa tekijän vastausta
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Tekijä saa ilmoituksen ja voi hyväksyä tai hylätä tehtävän.
                </p>
              </div>
            )}

            {canMessage && (
              <Link
                href={`/dashboard/messages?receiverId=${tasker.id}&taskId=${taskId}`}
                className="inline-flex items-center text-sm text-primary hover:text-primary hover:underline font-medium"
              >
                <MessageSquare className="mr-1 h-4 w-4" />
                Lähetä viesti
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}