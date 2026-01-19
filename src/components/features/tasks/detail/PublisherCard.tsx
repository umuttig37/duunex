import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, User, UserCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface PublisherCardProps {
  publisher: {
    id?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  taskId: string;
  canMessage?: boolean;
}

export default function PublisherCard({ 
  publisher, 
  taskId, 
  canMessage = false 
}: PublisherCardProps) {
  const fullName = `${publisher?.first_name || ''} ${publisher?.last_name || ''}`.trim() || 'Tuntematon';

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
          <UserCheck className="h-5 w-5 mr-2 text-slate-600" />
          Ilmoittaja
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {publisher?.avatar_url ? (
              <Image
                src={publisher.avatar_url}
                alt={fullName}
                width={56}
                height={56}
                className="rounded-full border-2 border-slate-200"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                <User className="h-7 w-7 text-slate-500" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 text-base mb-1">
              {fullName}
            </h3>

            {canMessage && publisher?.id && (
              <Link
                href={`/dashboard/messages?receiverId=${publisher.id}&taskId=${taskId}`}
                className="inline-flex items-center text-sm text-slate-600 hover:text-slate-700 hover:underline font-medium"
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