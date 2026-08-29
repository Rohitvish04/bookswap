import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { requireAdmin, HttpError } from '@/lib/auth';
import { categorySchema } from '@/lib/validation';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    await requireAdmin();
    const categories = await prisma.category.findMany({
      include: { _count: { select: { books: true } } },
      orderBy: { name: 'asc' },
    });
    return ok(categories);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await parseBody(req, categorySchema);

    const slug = slugify(body.name);
    const exists = await prisma.category.findFirst({ where: { OR: [{ name: body.name }, { slug }] } });
    if (exists) throw new HttpError(409, 'A category with this name already exists.');

    const category = await prisma.category.create({ data: { name: body.name, slug, isActive: body.isActive } });
    return ok(category, 201);
  } catch (err) {
    return handleError(err);
  }
}
