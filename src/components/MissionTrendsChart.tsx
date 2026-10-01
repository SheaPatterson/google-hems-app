import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { TrendingUp, Calendar, Activity, Award } from 'lucide-react';
import { FlightLogEntry } from '../types/hems';

interface MissionTrendsChartProps {
  logs: FlightLogEntry[];
}

interface WeeklyTrendData {
  weekKey: string;
  weekLabel: string;
  missions: number;
  flightHours: number;
  startDate: Date;
}

export const MissionTrendsChart: React.FC<MissionTrendsChartProps> = ({ logs }) => {
  const trendData = useMemo(() => {
    // Determine the reference date (latest log or current date)
    const validDates = logs
      .map((l) => new Date(l.completedAt))
      .filter((d) => !isNaN(d.getTime()));

    const latestDate = validDates.length > 0
      ? new Date(Math.max(...validDates.map((d) => d.getTime())))
      : new Date('2026-09-30T18:00:00Z');

    // Helper: Get Monday of the week
    const getWeekMonday = (d: Date): Date => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    // Build the last 6 calendar weeks leading up to latestDate
    const currentMonday = getWeekMonday(latestDate);
    const weeksMap = new Map<string, WeeklyTrendData>();

    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(currentMonday);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const key = weekStart.toISOString().slice(0, 10);
      const monthName = weekStart.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = weekStart.getDate();
      const label = `Wk of ${monthName} ${dayNum}`;

      weeksMap.set(key, {
        weekKey: key,
        weekLabel: label,
        missions: 0,
        flightHours: 0,
        startDate: weekStart,
      });
    }

    // Populate with data from logs
    logs.forEach((log) => {
      const logDate = new Date(log.completedAt);
      if (isNaN(logDate.getTime())) return;

      const logMonday = getWeekMonday(logDate);
      const key = logMonday.toISOString().slice(0, 10);

      if (weeksMap.has(key)) {
        const item = weeksMap.get(key)!;
        item.missions += 1;
        item.flightHours = Number((item.flightHours + log.flightDurationMin / 60).toFixed(2));
      } else {
        // If outside 6 weeks window, add dynamically
        const monthName = logMonday.toLocaleDateString('en-US', { month: 'short' });
        const dayNum = logMonday.getDate();
        weeksMap.set(key, {
          weekKey: key,
          weekLabel: `Wk of ${monthName} ${dayNum}`,
          missions: 1,
          flightHours: Number((log.flightDurationMin / 60).toFixed(2)),
          startDate: logMonday,
        });
      }
    });

    // Convert map to sorted array
    const sorted = Array.from(weeksMap.values()).sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );

    return sorted;
  }, [logs]);

  // Aggregate metrics
  const totalMissions = logs.length;
  const peakWeeklyMissions = Math.max(...trendData.map((d) => d.missions), 0);
  const activeWeeksCount = trendData.filter((d) => d.missions > 0).length || 1;
  const avgMissionsPerWeek = (totalMissions / activeWeeksCount).toFixed(1);

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Mission Completion Trends</span>
              <span className="text-[10px] text-red-400 font-mono bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded-full">
                MISSIONS / WEEK
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Weekly sortie cadence &amp; completed emergency transport volume
            </p>
          </div>
        </div>

        {/* Quick KPI pills */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <div className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
            Peak Week:{' '}
            <strong className="text-red-400 font-bold">{peakWeeklyMissions}</strong> sorties
          </div>
          <div className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
            Avg / Week:{' '}
            <strong className="text-emerald-400 font-bold">{avgMissionsPerWeek}</strong> sorties
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={trendData}
            margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="missionBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#991b1b" stopOpacity={0.65} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="weekLabel"
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            <YAxis
              allowDecimals={false}
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              domain={[0, (dataMax: number) => Math.max(4, Math.ceil(dataMax + 1))]}
            />

            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as WeeklyTrendData;
                  return (
                    <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1 font-sans">
                      <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                        <span>{label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {data.weekKey}
                        </span>
                      </div>
                      <div className="text-red-400 font-bold flex items-center justify-between gap-4 pt-1">
                        <span>Missions Completed:</span>
                        <span className="font-mono text-sm">{data.missions} sorties</span>
                      </div>
                      <div className="text-slate-400 flex items-center justify-between gap-4">
                        <span>Flight Time:</span>
                        <span className="font-mono text-slate-200">{data.flightHours} hrs</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
              formatter={() => (
                <span className="text-slate-400 text-xs font-semibold">
                  Completed Missions (Sorties)
                </span>
              )}
            />

            <Bar
              dataKey="missions"
              name="Completed Missions"
              fill="url(#missionBarGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            >
              {trendData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.missions > 0 ? 'url(#missionBarGradient)' : '#1e293b'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
