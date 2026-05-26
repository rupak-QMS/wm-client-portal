'use client';

import { useParams }      from 'next/navigation';
import { ClientProfile }  from '@/components/clients/ClientProfile';

export default function ManagerClientDetailPage() {
  const params = useParams();
  return (
    <ClientProfile
      clientId={params.id as string}
      canEdit={false}
      backHref="/manager/clients"
    />
  );
}
