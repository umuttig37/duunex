import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/supabase/database.types';
import Link from 'next/link';

// Accept the expanded task object with category and publisher info
interface TaskCardProps {
    task: Database['public']['Tables']['tasks']['Row'] & {
        categories?: Pick<Database['public']['Tables']['categories']['Row'], 'name_fi' | 'icon_url'> | null;
        publisher?: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
    };
    showEdit?: boolean;
    showStatus?: boolean;
    showActions?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, showEdit, showStatus, showActions }) => {
    const publisherName = task.publisher
        ? `${task.publisher.first_name ?? ''} ${task.publisher.last_name ?? ''}`.trim() || 'Tuntematon'
        : 'Tuntematon';
    // Status badge color logic
    const statusColors: Record<string, string> = {
        open: 'bg-blue-500 text-white',
        assigned: 'bg-yellow-500 text-white',
        request_sent: 'bg-yellow-600 text-white',
        request_declined: 'bg-red-600 text-white',
        paid: 'bg-sky-600 text-white',
        in_progress: 'bg-blue-700 text-white',
        completed: 'bg-sky-500 text-white',
        early_completed: 'bg-orange-500 text-white',
        cancelled: 'bg-gray-400 text-white',
        disputed: 'bg-red-500 text-white',
    };
    const statusLabel: Record<string, string> = {
        open: 'Avoin',
        assigned: 'Varattu',
        request_sent: 'Pyyntö lähetetty',
        request_declined: 'Hylätty',
        paid: 'Maksettu',
        in_progress: 'Työn alla',
        completed: 'Suoritettu',
        early_completed: 'Odottaa vahvistusta',
        cancelled: 'Peruttu',
        disputed: 'Riitautettu',
    };
    return (
        <Card className="w-full h-full flex flex-col">
            <CardHeader className="flex-grow-0">
                <CardTitle className="line-clamp-2">{task.title}</CardTitle>
                <CardDescription className="line-clamp-3">{task.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow py-4">
                {/* Additional task details can be added here */}
                <div className="space-y-2 text-sm text-gray-600">
                    {task.location_text && (
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400">📍</span>
                            <span className="truncate">{task.location_text}</span>
                        </div>
                    )}
                    {task.budget && (
                        <div className="flex items-center gap-1">
                            <span className="text-sky-600 font-semibold">{task.budget}€</span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 justify-between mt-auto pt-4 border-t bg-gray-50/50">
                <Button variant="outline" asChild className="flex-1 min-w-fit">
                    <Link href={`/dashboard/tasks/${task.id}`}>
                        <span className="hidden sm:inline">Katso Tehtävä</span>
                        <span className="sm:hidden">Katso</span>
                    </Link>
                </Button>
                {showEdit && (
                    <Button asChild className="flex-1 min-w-fit">
                        <Link href={`/dashboard/tasks/edit/${task.id}`}>
                            <span className="hidden sm:inline">Muokkaa</span>
                            <span className="sm:hidden">Edit</span>
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default TaskCard;