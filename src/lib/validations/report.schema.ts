import { z } from 'zod';

export const uploadReportSchema = z.object({
  client_id:   z.string().uuid('Select a client'),
  report_type: z.enum(['seo', 'website_update', 'analytics', 'audit', 'other']),
  title:       z.string().min(3, 'Title required'),
  description: z.string().optional(),
  file_url:    z.string().url(),
  file_name:   z.string(),
  file_size:   z.number().optional(),
  mime_type:   z.string().optional(),
});

export type UploadReportInput = z.infer<typeof uploadReportSchema>;