'use client';

import { useParams }      from 'next/navigation';
import { ClientProfile }  from '@/components/clients/ClientProfile';

export default function AMClientDetailPage() {
  const params = useParams();
  return (
    <ClientProfile
      clientId={params.id as string}
      canEdit={true}
      backHref="/account/clients"
    />
  );
}
