import { z } from 'zod';

export const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const createUserSchema = z.object({
  full_name: z.string().min(2),
  email:     z.string().email(),
  password:  z.string().min(8),
  role:      z.enum(['manager', 'account_manager', 'sales_team', 'team_leader', 'client']),
});