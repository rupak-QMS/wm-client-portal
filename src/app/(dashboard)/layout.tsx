import { redirect }       from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Sidebar }        from '@/components/layout/Sidebar';
import { Navbar }         from '@/components/layout/Navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const serializedUser = {
    ...user,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar role={serializedUser.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={serializedUser} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
