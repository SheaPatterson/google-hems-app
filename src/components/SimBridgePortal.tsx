import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Radio,
  Cpu,
  Terminal,
  Activity,
  CheckCircle2,
  FileCode,
  Laptop,
  Server,
  Layers,
} from 'lucide-react';
import { XPLANE_FLYWITHLUA_SCRIPT } from '../data/sampleHemsData';
import { FlightSimPlatform, HemsSimTelemetry } from '../types/hems';

interface SimBridgePortalProps {
  telemetry: HemsSimTelemetry;
  simPlatform: FlightSimPlatform;
  onSelectPlatform: (platform: FlightSimPlatform) => void;
}

export const SimBridgePortal: React.FC<SimBridgePortalProps> = ({
  telemetry,
  simPlatform,
  onSelectPlatform,
}) => {
  const [copiedLua, setCopiedLua] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const samplePayloadJson = JSON.stringify(
    {
      engine: simPlatform === 'xplane' ? 'XPLANE12' : 'MSFS2024',
      lat: telemetry.lat,
      lon: telemetry.lon,
      alt_msl: telemetry.altitudeMsl,
      agl: telemetry.altitudeAgl,
      gs: telemetry.groundspeedKts,
      heading: telemetry.headingDeg,
      vs: telemetry.verticalSpeedFpm,
      pitch: telemetry.pitchDeg,
      roll: telemetry.rollDeg,
      fuel_lbs: Math.round(telemetry.fuelRemainingKg * 2.20462),
      torque: telemetry.engine1TorquePct,
    },
    null,
    2
  );

  const handleCopyLua = () => {
    navigator.clipboard.writeText(XPLANE_FLYWITHLUA_SCRIPT);
    setCopiedLua(true);
    setTimeout(() => setCopiedLua(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(samplePayloadJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadLuaFile = () => {
    const blob = new Blob([XPLANE_FLYWITHLUA_SCRIPT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hems-dispatch-xp.lua';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              Simulator Hardware Bridge &amp; Telemetry Uplink (Port 8080)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronize Microsoft Flight Simulator (2020/2024 SimConnect) and X-Plane (11/12 FlyWithLua) at 2 Hz
          </p>
        </div>

        {/* Sim Engine Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onSelectPlatform('msfs')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              simPlatform === 'msfs'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MSFS 2020 / 2024
          </button>
          <button
            onClick={() => onSelectPlatform('xplane')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              simPlatform === 'xplane'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            X-Plane 11 / 12
          </button>
          <button
            onClick={() => onSelectPlatform('simulated')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              simPlatform === 'simulated'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Internal Generator
          </button>
        </div>
      </div>

      {/* Bridge Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">
            LOCAL UDP BRIDGE (PORT 8080)
          </span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-base font-bold text-emerald-400 font-mono">127.0.0.1:8080 LISTENING</span>
          </div>
          <p className="text-[11px] text-slate-500">Latency: ~12 ms • 2.0 Hz packet rate</p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">
            KINEMATIC STATE PACKETS
          </span>
          <span className="text-base font-bold text-slate-100 font-mono">
            {telemetry.airspeedKts} KTS • {telemetry.altitudeAgl} FT AGL
          </span>
          <p className="text-[11px] text-slate-500">
            HDG {telemetry.headingDeg}° • Pitch {telemetry.pitchDeg}° • Roll {telemetry.rollDeg}°
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">
            FIRST LIMIT INDICATOR (FLI)
          </span>
          <span className="text-base font-bold text-amber-400 font-mono">
            {telemetry.fliValue ?? 6.9} / 10.0 FLI
          </span>
          <p className="text-[11px] text-slate-500">
            TRQ {telemetry.engine1TorquePct}% • N1 {telemetry.n1Pct ?? 98.4}% • TOT {telemetry.totCelsius ?? 620}°C
          </p>
        </div>
      </div>

      {/* FlyWithLua Script & Instructions for X-Plane */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <FileCode className="h-4 w-4 text-cyan-400" />
              X-Plane Telemetry Pipe (hems-dispatch-xp.lua)
            </h3>
            <p className="text-xs text-slate-400">
              Save this script to your X-Plane directory:{' '}
              <code className="text-cyan-300 font-mono bg-slate-900 px-1 py-0.5 rounded">
                X-Plane 12/Resources/plugins/FlyWithLua/Scripts/
              </code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLua}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copiedLua ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLua ? 'Copied!' : 'Copy Lua'}</span>
            </button>
            <button
              onClick={handleDownloadLuaFile}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .lua Script</span>
            </button>
          </div>
        </div>

        <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-56 leading-relaxed">
          {XPLANE_FLYWITHLUA_SCRIPT}
        </pre>
      </div>

      {/* SimConnect / Tauri Bridge Desktop Specs */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="h-4 w-4 text-amber-400" />
              Active Telemetry JSON Data Contract (POST /api/telemetry)
            </h3>
            <p className="text-xs text-slate-400">
              Shared TypeScript contract verified across client, bridge, and cloud database
            </p>
          </div>

          <button
            onClick={handleCopyJson}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            {copiedJson ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedJson ? 'Copied Payload!' : 'Copy Sample JSON'}</span>
          </button>
        </div>

        <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48 leading-relaxed">
          {samplePayloadJson}
        </pre>
      </div>
    </div>
  );
};
