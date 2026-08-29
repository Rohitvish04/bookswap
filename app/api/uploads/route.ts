import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { requireUser, HttpError } from '@/lib/auth';
import { ok, handleError } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Stores book covers / avatars on local disk under public/uploads. Swap for S3/Cloudinary in production. */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    rateLimit(`upload:${user.id}`, 20, 60_000);

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new HttpError(400, 'No file provided.');
    if (!ALLOWED.has(file.type)) throw new HttpError(422, 'Only JPEG, PNG, or WEBP images are allowed.');
    if (file.size > MAX_BYTES) throw new HttpError(422, 'Image must be smaller than 5 MB.');

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const dir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);

    return ok({ url: `/uploads/${filename}` }, 201);
  } catch (err) {
    return handleError(err);
  }
}
