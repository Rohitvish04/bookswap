'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatDate } from '@/lib/utils';

export function AdminCharts({
  registrationsByDay,
  exchangesByDay,
}: {
  registrationsByDay: { day: string; count: number }[];
  exchangesByDay: { day: string; count: number }[];
}) {
  const fmt = (rows: { day: string; count: number }[]) => rows.map((r) => ({ ...r, label: formatDate(r.day) }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold">User Registrations (30 days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={fmt(registrationsByDay)}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold">Exchanges Created (30 days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={fmt(exchangesByDay)}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
