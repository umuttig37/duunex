'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

interface PaymentFilterSelectProps {
  currentStatus: string;
}

export function PaymentFilterSelect({
  currentStatus,
}: PaymentFilterSelectProps) {
  const router = useRouter();

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams();
    if (value !== 'all') {
      params.set('status', value);
    }

    const newUrl = `/admin/payments${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl);
  };

  return (
    <Select value={currentStatus || 'all'} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Suodata tilan mukaan" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Kaikki</SelectItem>
        <SelectItem value="paid">Maksetut</SelectItem>
        <SelectItem value="pending">Odottavat</SelectItem>
        <SelectItem value="failed">Epäonnistuneet</SelectItem>
        <SelectItem value="refunded">Palautetut</SelectItem>
      </SelectContent>
    </Select>
  );
}
