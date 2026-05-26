'use server';

import { revalidatePath } from 'next/cache';
import { redirect }       from 'next/navigation';
import { createClient }   from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import prisma             from '@/lib/prisma';
import type { UserRole, CreateUserFormValues } from '@/types';

// Admin client with service role key — can create/delete users
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const profile = await prisma.user.findUnique({ where: { id: user.id } });
  return profile;
}

export async function loginAction(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication failed' };

  const profile = await prisma.user.findUnique({ where: { id: user.id } });
  const dashPath =
    profile?.role === 'manager'         ? '/manager/dashboard' :
    profile?.role === 'account_manager' ? '/account/dashboard' :
                                          '/client/dashboard';
  redirect(dashPath);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function forgotPasswordAction(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function createUserAction(values: CreateUserFormValues) {
  const me = await getCurrentUser();
  if (me?.role !== 'manager') return { error: 'Unauthorized' };

  const adminClient = getAdminClient();

  const { data, error } = await adminClient.auth.admin.createUser({
    email:         values.email,
    password:      values.password,
    email_confirm: true,
    user_metadata: {
      full_name: values.full_name,
      role:      values.role,
    },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: 'User creation failed' };

  await prisma.user.upsert({
    where:  { id: data.user.id },
    update: { full_name: values.full_name, role: values.role as UserRole },
    create: {
      id:        data.user.id,
      email:     values.email,
      full_name: values.full_name,
      role:      values.role as UserRole,
    },
  });

  revalidatePath('/manager/account-managers');
  revalidatePath('/manager/clients');
  return { success: true };
}

export async function deleteUserAction(userId: string) {
  const me = await getCurrentUser();
  if (me?.role !== 'manager') return { error: 'Unauthorized' };

  const adminClient = getAdminClient();
  await adminClient.auth.admin.deleteUser(userId);
  await prisma.user.delete({ where: { id: userId } });

  revalidatePath('/manager/account-managers');
  return { success: true };
}