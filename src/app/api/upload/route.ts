import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createClient }   from '@/lib/supabase/server';
import { v4 as uuidv4 }   from 'uuid';
import path               from 'path';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get('file') as File | null;
  const bucket   = (formData.get('bucket') as string) || 'reports';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 422 });

  const ALLOWED = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png', 'image/webp',
  ];

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 422 });
  }

  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'File exceeds 50MB limit' }, { status: 422 });
  }

  const supabase = await createClient();
  const ext      = path.extname(file.name);
  const filePath = `${user.id}/${uuidv4()}${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return NextResponse.json({
    data: {
      url:       publicUrl,
      path:      filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    },
  }, { status: 201 });
}