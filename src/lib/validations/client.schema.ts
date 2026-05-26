import { z } from 'zod';

export const createClientSchema = z.object({
  company_name:             z.string().min(2, 'Company name required'),
  contact_person:           z.string().min(2, 'Contact person required'),
  email:                    z.string().email('Valid email required'),
  phone:                    z.string().optional(),
  website:                  z.string().url('Valid URL').optional().or(z.literal('')),
  assigned_account_manager: z.string().uuid().optional(),
  notes:                    z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;