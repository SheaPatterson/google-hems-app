import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  CheckCircle2,
  Clock,
  Plane,
  HeartHandshake,
  Anchor,
  FileSpreadsheet,
  Trash2,
  FileText,
  Printer,
} from 'lucide-react';
import { FlightLogEntry } from '../types/hems';
import { MissionTrendsChart } from './MissionTrendsChart';

interface PilotLogbookProps {
  logs: FlightLogEntry[];
  callsign: string;
  onViewReport?: (log: FlightLogEntry) => void;
}

export const PilotLogbook: React.FC<PilotLogbookProps> = ({ logs, callsign, onViewReport }) => {
  const [notification, setNotification] = useState<string | null>(null);

  const totalFlightTimeMin = logs.reduce((acc, l) => acc + l.flightDurationMin, 0);
  const totalHours = (totalFlightTimeMin / 60).toFixed(1);

  const handleExportCsv = () => {
    const timestamp = new Date().toISOString();
    const dateStr = new Date().toISOString().slice(0, 10);

    let csv = `sep=,\r\n`;
    csv += `"HEMS FLIGHT SIMULATION PILOT LOGBOOK & MISSION ANALYTICS"\r\n`;
    csv += `"Export Timestamp","${timestamp}"\r\n`;
    csv += `"Unit Callsign","${callsign}"\r\n`;
    csv += `"Total Missions Logged","${logs.length}"\r\n`;
    csv += `"Total Flight Hours","${totalHours} hrs"\r\n`;
    csv += `\r\n`;

    csv += `"Mission ID","Callsign","Aircraft Model","Departure Base","Destination Hospital","Duration (min)","Patient Outcome","Completed Timestamp"\r\n`;

    logs.forEach((l) => {
      csv += `"${l.missionCode}","${l.callsign}","${l.aircraftModel}","${l.departureLocation}","${l.destinationLocation}","${l.flightDurationMin.toFixed(1)}","${l.patientOutcome}","${l.completedAt}"\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HEMS_FlightLog_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification(`Exported logbook to HEMS_FlightLog_${dateStr}.csv`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-red-500" />
            HEMS Pilot Logbook &amp; Mission Records
          </h2>
          <p className="text-xs text-slate-400">
            Certified record of simulated emergency air medical dispatches, scene hops, and patient handovers
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg shadow-sm transition"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Logbook CSV</span>
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600/60 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Flight Time</span>
          <span className="text-2xl font-black text-slate-100 font-mono">{totalHours}</span>
          <span className="text-xs text-slate-400 ml-1">HRS</span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Missions Completed</span>
          <span className="text-2xl font-black text-red-400 font-mono">{logs.length}</span>
          <span className="text-xs text-slate-400 ml-1">SORTIES</span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Handover Success</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">100%</span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Airframe Unit</span>
          <span className="text-xl font-black text-amber-300 font-mono">{callsign}</span>
        </div>
      </div>

      {/* Mission Completion Trends Chart (Recharts) */}
      <MissionTrendsChart logs={logs} />

      {/* Log Entries Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
            <tr>
              <th className="p-3">Mission</th>
              <th className="p-3">Airframe</th>
              <th className="p-3">Departure Base</th>
              <th className="p-3">Hospital Destination</th>
              <th className="p-3">Duration</th>
              <th className="p-3">Handover Outcome</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-850/50 transition">
                <td className="p-3 font-mono font-bold text-red-400">{log.missionCode}</td>
                <td className="p-3">{log.aircraftModel}</td>
                <td className="p-3">{log.departureLocation}</td>
                <td className="p-3">{log.destinationLocation}</td>
                <td className="p-3 font-mono">{log.flightDurationMin.toFixed(1)} min</td>
                <td className="p-3 text-emerald-400 font-medium">{log.patientOutcome}</td>
                <td className="p-3 text-slate-400 font-mono">{new Date(log.completedAt).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  {onViewReport && (
                    <button
                      onClick={() => onViewReport(log)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 rounded-lg text-[11px] font-semibold transition"
                      title="View & Print Official PDF Mission Report"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>PDF Report</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
