'use server';

import { revalidatePath } from 'next/cache';
import { redirect }       from 'next/navigation';
import { createClient }   from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import prisma             from '@/lib/prisma';
import type { UserRole, CreateUserFormValues } from '@/types';

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

  if ((profile as any)?.status === 'pending') {
    await supabase.auth.signOut();
    return { error: 'Your account is pending manager approval. Please wait before logging in.' };
  }

  const dashPath =
    profile?.role === 'manager'         ? '/manager/dashboard'     :
    profile?.role === 'account_manager' ? '/account/dashboard'     :
    profile?.role === 'sales_team'      ? '/sales/dashboard'       :
    profile?.role === 'team_leader'     ? '/team-leader/dashboard' :
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

export async function createUserAction(values: CreateUserFormValues & { sales_team_group?: string }) {
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
    update: {
      full_name:        values.full_name,
      role:             values.role as UserRole,
      sales_team_group: (values.sales_team_group as any) ?? null,
      status:           'active',
    },
    create: {
      id:               data.user.id,
      email:            values.email,
      full_name:        values.full_name,
      role:             values.role as UserRole,
      sales_team_group: (values.sales_team_group as any) ?? null,
      status:           'active',
    },
  });

  revalidatePath('/manager/sales-team');
  revalidatePath('/manager/account-managers');
  revalidatePath('/manager/clients');
  return { success: true };
}

export async function updateUserAction(values: {
  id:                string;
  full_name?:        string;
  sales_team_group?: string | null;
  new_password?:     string;
}) {
  const me = await getCurrentUser();
  if (me?.role !== 'manager') return { error: 'Unauthorized' };

  const adminClient = getAdminClient();

  if (values.new_password) {
    const { error } = await adminClient.auth.admin.updateUserById(values.id, {
      password: values.new_password,
    });
    if (error) return { error: error.message };
  }

  await prisma.user.update({
    where: { id: values.id },
    data: {
      ...(values.full_name !== undefined        ? { full_name: values.full_name }                       : {}),
      ...(values.sales_team_group !== undefined ? { sales_team_group: values.sales_team_group as any } : {}),
    },
  });

  revalidatePath('/manager/sales-team');
  return { success: true };
}

export async function deleteUserAction(userId: string) {
  const me = await getCurrentUser();
  if (me?.role !== 'manager') return { error: 'Unauthorized' };

  try {
    // 1. Block deletion if non-nullable FK relations exist
    const [clientsCreated, leadsCreated, logsCreated, revenueCreated, salesTargetsCreated, upsells] =
      await Promise.all([
        prisma.client.count({ where: { created_by: userId } }),
        prisma.salesLead.count({ where: { created_by: userId } }),
        prisma.salesLog.count({ where: { created_by: userId } }),
        prisma.revenueTarget.count({ where: { created_by: userId } }),
        prisma.salesTarget.count({ where: { created_by: userId } }),
        prisma.upsell.count({ where: { account_manager_id: userId } }),
      ]);

    const blockers = [
      clientsCreated      && `${clientsCreated} client(s) created by this user`,
      leadsCreated        && `${leadsCreated} sales lead(s) created by this user`,
      logsCreated         && `${logsCreated} sales log(s) created by this user`,
      revenueCreated      && `${revenueCreated} revenue target(s) created by this user`,
      salesTargetsCreated && `${salesTargetsCreated} sales target(s) created by this user`,
      upsells             && `${upsells} upsell(s) assigned to this user`,
    ].filter(Boolean);

    if (blockers.length > 0) {
      return { error: `Cannot delete: reassign or remove the following first — ${blockers.join('; ')}.` };
    }

    // 2. Null out nullable FK relations
    await prisma.$transaction([
      prisma.client.updateMany({
        where: { assigned_account_manager: userId },
        data:  { assigned_account_manager: null },
      }),
      prisma.salesLead.updateMany({
        where: { approved_by: userId },
        data:  { approved_by: null },
      }),
      prisma.salesLead.updateMany({
        where: { assigned_am: userId },
        data:  { assigned_am: null },
      }),
      prisma.deleteRequest.updateMany({
        where: { approved_by: userId },
        data:  { approved_by: null },
      }),
      prisma.salesPerformanceNote.deleteMany({ where: { author_id: userId } }),
    ]);

    // 3. Delete user row — DB cascades handle the rest:
    //    Comments, Messages, Notifications, ActivityLog, RevenueTarget(AM),
    //    SalesTarget(member), SalesPerformanceBadge, SalesPerformanceNote(target)
    await prisma.user.delete({ where: { id: userId } });

    // 4. Delete from Supabase Auth
    const adminClient = getAdminClient();
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) throw new Error(authError.message);

  } catch (err: any) {
    console.error('deleteUserAction error:', err);
    return { error: err?.message ?? 'Failed to delete user' };
  }

  revalidatePath('/manager/account-managers');
  revalidatePath('/manager/sales-team');
  return { success: true };
}
