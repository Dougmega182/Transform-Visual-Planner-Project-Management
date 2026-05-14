'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { usePlannerStore } from '@/store/usePlannerStore';
import { startOfWeek, subWeeks, format, isWithinInterval } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export const PPCChart: React.FC = () => {
  const { tasks } = usePlannerStore();
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const today = new Date();
  const weeks = Array.from({ length: 6 }).map((_, i) => {
    const start = startOfWeek(subWeeks(today, 5 - i), { weekStartsOn: 1 });
    const end = startOfWeek(subWeeks(today, 4 - i), { weekStartsOn: 1 });
    return { start, end, label: `W-${format(start, 'w')}` };
  });

  const ppcData = weeks.map(week => {
    const weekTasks = tasks.filter(t => {
      if (!t.startDate) return false;
      const d = new Date(t.startDate);
      return isWithinInterval(d, { start: week.start, end: week.end });
    });
    if (weekTasks.length === 0) return 0;
    const completed = weekTasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / weekTasks.length) * 100);
  });

  if (!hasMounted) {
    return <div className="rounded-xl p-5 h-full animate-pulse" style={{ background: 'var(--bg-secondary)' }} />;
  }

  const avgPPC = ppcData.length > 0
    ? Math.round(ppcData.reduce((a, b) => a + b, 0) / ppcData.length)
    : 0;

  const data = {
    labels: weeks.map(w => w.label),
    datasets: [{
      label: 'PPC %',
      data: ppcData,
      borderColor: '#26a69a',
      backgroundColor: 'rgba(38, 166, 154, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#26a69a',
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => `PPC: ${ctx.parsed.y}%` } },
    },
    scales: {
      y: {
        min: 0, max: 100,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#5f6368', callback: (v: any) => `${v}%` },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#5f6368' },
      },
    },
  };

  return (
    <div className="rounded-xl p-5 border flex flex-col" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Reliability Analytics</h3>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Percent Plan Complete (PPC)</p>
        </div>
        <div className="px-2.5 py-1 rounded text-[10px] font-black" style={{ background: 'rgba(38,166,154,0.15)', color: '#26a69a' }}>
          AVG: {avgPPC}%
        </div>
      </div>
      <div className="flex-1 min-h-[200px]">
        <Line options={options as any} data={data} />
      </div>
    </div>
  );
};
