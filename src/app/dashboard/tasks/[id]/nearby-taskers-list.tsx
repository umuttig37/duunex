import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NearbyTasker } from '@/services/tasks/findNearbyTaskers';

interface NearbyTaskersListProps {
  taskers: NearbyTasker[];
  isLoading: boolean;
  error: string | null;
}

export default function NearbyTaskersList({ taskers, isLoading, error }: NearbyTaskersListProps) {
  if (isLoading) {
    return <p>Loading nearby taskers...</p>; // Replace with Skeleton loaders if desired
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (taskers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nearby Taskers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No taskers found within the specified radius.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nearby Taskers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {taskers.map((tasker) => (
          <div key={tasker.id} className="flex items-center justify-between gap-4 p-2 border rounded-md">
            <div className="flex items-center gap-3">
              <Avatar>
                {/* Assuming avatar_url is fetched or added later */}
                {/* <AvatarImage src={tasker.avatar_url || undefined} alt={`${tasker.first_name} ${tasker.last_name}`} /> */}
                <AvatarFallback>{tasker.first_name?.[0]}{tasker.last_name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium">
                  {tasker.first_name} {tasker.last_name}
                </span>
                <p className="text-sm text-gray-500">Distance: {tasker.distance_meters?.toFixed(0) || 'N/A'}m</p>
              </div>
            </div>
            {/* Profile links removed - tasker contact through offers system */}
            <span className="text-sm text-gray-600">
              Kontakti tarjousten kautta
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
