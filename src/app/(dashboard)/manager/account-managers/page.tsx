'use client';
import { useState }                 from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AMTable }                  from '@/components/account-managers/AMTable';
import { AddAMModal }               from '@/components/account-managers/AddAMModal';
import { deleteUserAction }         from '@/lib/auth';
import { UserPlus, UserCheck }      from 'lucide-react';
import { toast }                    from 'sonner';
import type { User }                from '@/types';

export default function AccountManagersPage() {
  const [showAdd,    setShowAdd]    = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const qc = useQueryClient();

  const { data: managers = [], isLoading } = useQuery<User[]>({
    queryKey: ['account-managers'],
    queryFn:  async () => (await (await fetch('/api/users?role=account_manager')).json()).data,
  });

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const result = await deleteUserAction(id);
    if (result?.error) toast.error(result.error);
    else qc.invalidateQueries({ queryKey: ['account-managers'] });
    setIsDeleting(false);
  };

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }} className="wm-fade-up">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <UserCheck size={15} style={{ color: '#34d399' }} />
            <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Team
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Account Managers</h1>
          <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>Manage your team of account managers</p>
        </div>
        <button className="wm-btn-primary" onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38 }}>
          <UserPlus size={15} /> Add Account Manager
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : (
        <div className="wm-fade-up-2">
          <AMTable managers={managers} onDelete={handleDelete} isDeleting={isDeleting} />
        </div>
      )}

      <AddAMModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['account-managers'] })}
      />
    </div>
  );
}