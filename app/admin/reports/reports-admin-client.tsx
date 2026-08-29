'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/site/empty-state';
import { Flag } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

type Report = {
  id: string; reason: string; detail: string | null; status: string; createdAt: string;
  reporter: { fullName: string; email: string };
  targetUser: { fullName: string; email: string } | null;
  exchange: { code: string; status: string } | null;
};

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'destructive' | 'muted'> = {
  OPEN: 'warning', REVIEWING: 'warning', RESOLVED: 'success', DISMISSED: 'muted',
};

export function ReportsAdminClient() {
  const [reports, setReports] = useState<Report[] | null>(null);

  async function load() {
    const res = await apiFetch<Report[]>('/api/admin/reports');
    if (res.ok) setReports(res.data);
  }

  useEffect(() => { load(); }, []);

  async function resolve(id: string, status: string) {
    const resolution = status === 'DISMISSED' ? '' : prompt('Resolution notes:') || '';
    const res = await apiFetch(`/api/admin/reports/${id}`, { method: 'PATCH', body: { status, resolution } });
    if (res.ok) { toast.success('Report updated.'); load(); }
    else toast.error(res.error);
  }

  if (reports === null) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (reports.length === 0) return <EmptyState icon={Flag} title="No reports" description="Nothing has been reported yet." />;

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <Card key={r.id}>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{r.reason}</p>
              <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
            </div>
            {r.detail && <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>}
            <p className="mt-2 text-xs text-muted-foreground">
              Reported by {r.reporter.fullName}
              {r.targetUser && ` against ${r.targetUser.fullName}`}
              {r.exchange && ` · Exchange ${r.exchange.code}`}
              {' · '}{formatDateTime(r.createdAt)}
            </p>
            {r.status === 'OPEN' || r.status === 'REVIEWING' ? (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => resolve(r.id, 'REVIEWING')}>Mark Reviewing</Button>
                <Button size="sm" onClick={() => resolve(r.id, 'RESOLVED')}>Resolve</Button>
                <Button size="sm" variant="ghost" onClick={() => resolve(r.id, 'DISMISSED')}>Dismiss</Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
