import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { requireAdmin, HttpError } from '@/lib/auth';
import { categorySchema } from '@/lib/validation';
import { slugify } from '@/lib/utils';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await parseBody(req, categorySchema);

    const category = await prisma.category.update({
      where: { id },
      data: { name: body.name, slug: slugify(body.name), isActive: body.isActive },
    });
    return ok(category);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const inUse = await prisma.book.count({ where: { categoryId: id } });
    if (inUse > 0) {
      // Books reference this category — disable instead of a hard delete that would orphan them.
      const category = await prisma.category.update({ where: { id }, data: { isActive: false } });
      return ok(category);
    }
    const deletedCat = await prisma.category.findUnique({ where: { id } });
    if (!deletedCat) throw new HttpError(404, 'Category not found.');
    await prisma.category.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
