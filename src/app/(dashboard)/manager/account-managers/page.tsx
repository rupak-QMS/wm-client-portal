'use client';

import { useState }         from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button }           from '@/components/ui/button';
import { AMTable }          from '@/components/account-managers/AMTable';
import { AddAMModal }       from '@/components/account-managers/AddAMModal';
import { deleteUserAction } from '@/lib/auth';
import { UserPlus }         from 'lucide-react';
import { toast }            from 'sonner';
import type { User }        from '@/types';

export default function AccountManagersPage() {
  const [showAdd,    setShowAdd]    = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const qc = useQueryClient();

  const { data: managers = [], isLoading } = useQuery<User[]>({
    queryKey: ['account-managers'],
    queryFn: async () => {
      const res  = await fetch('/api/users?role=account_manager');
      const json = await res.json();
      return json.data;
    },
  });

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const result = await deleteUserAction(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      qc.invalidateQueries({ queryKey: ['account-managers'] });
    }
    setIsDeleting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Account Managers</h1>
          <p className="text-muted-foreground text-sm">
            Manage your team of account managers
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Account Manager
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : (
        <AMTable
          managers={managers}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      )}

      <AddAMModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['account-managers'] })}
      />
    </div>
  );
}