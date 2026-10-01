import React, { useState } from 'react';
import {
  Compass,
  Gauge,
  Activity,
  Anchor,
  Radio,
  Flame,
  Fuel,
  AlertTriangle,
  Plane,
  ChevronDown,
  Power,
  ShieldAlert,
} from 'lucide-react';
import { HemsAircraft, HemsSimTelemetry, FlightSimPlatform } from '../types/hems';
import { HEMS_AIRCRAFT_FLEET } from '../data/sampleHemsData';

interface CockpitTelemetryHUDProps {
  telemetry: HemsSimTelemetry;
  selectedAircraft: HemsAircraft;
  onSelectAircraft: (aircraft: HemsAircraft) => void;
  onSimPlatformChange: (platform: FlightSimPlatform) => void;
  onToggleHoist: () => void;
}

export const CockpitTelemetryHUD: React.FC<CockpitTelemetryHUDProps> = ({
  telemetry,
  selectedAircraft,
  onSelectAircraft,
  onSimPlatformChange,
  onToggleHoist,
}) => {
  const [aircraftDropdownOpen, setAircraftDropdownOpen] = useState(false);

  // Critical terrain proximity alert if low AGL in cruise
  const isTerrainAlert = telemetry.altitudeAgl < 150 && telemetry.flightPhase !== 'landed' && telemetry.flightPhase !== 'preflight';
  const isRotorDroop = telemetry.rotorRpmPct < 96;

  // First Limit Indicator (FLI) per AGENTS.md & ARCHITECTURE.md: max(%N1, %TOT, %TRQ)
  const currentFli = telemetry.fliValue ?? Math.max(
    (telemetry.n1Pct ?? 98.4) / 10,
    (telemetry.totCelsius ?? 620) / 85,
    telemetry.engine1TorquePct / 10
  );
  const isFliExceedance = currentFli > 10.0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Top Banner: Aircraft Selection & SimConnect / X-Plane Bridge */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Aircraft Selector */}
        <div className="relative">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">
            Active HEMS Airframe
          </div>
          <button
            type="button"
            onClick={() => setAircraftDropdownOpen(!aircraftDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition"
          >
            <Plane className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{selectedAircraft.name}</span>
                <span className="text-[10px] font-mono text-red-400 bg-red-950/60 border border-red-800/40 px-1.5 py-0.5 rounded">
                  {selectedAircraft.callsign}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-xs">{selectedAircraft.model}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
          </button>

          {aircraftDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1">
              {HEMS_AIRCRAFT_FLEET.map((ac) => (
                <button
                  key={ac.id}
                  onClick={() => {
                    onSelectAircraft(ac);
                    setAircraftDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition ${
                    selectedAircraft.id === ac.id
                      ? 'bg-red-950/50 border border-red-700/50 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Plane className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">{ac.name}</div>
                    <div className="text-[10px] text-slate-400">{ac.manufacturer} • Cruise {ac.maxCruiseKts} kts</div>
                    {ac.hoistEquipped && (
                      <span className="inline-block mt-1 text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">
                        Hoist / Winch Equipped
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Flight Simulator Bridge Platform Selector */}
        <div className="flex flex-col sm:items-end gap-1.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Flight Simulator Bridge
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => onSimPlatformChange('msfs')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                telemetry.simPlatform === 'msfs'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MSFS 2020 / 2024
            </button>
            <button
              onClick={() => onSimPlatformChange('xplane')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                telemetry.simPlatform === 'xplane'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              X-Plane 11 / 12
            </button>
            <button
              onClick={() => onSimPlatformChange('simulated')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                telemetry.simPlatform === 'simulated'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sim Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* Terrain Proximity Warning Bar */}
      {isTerrainAlert && (
        <div className="p-3 bg-rose-950/70 border border-rose-600/80 rounded-xl text-rose-200 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
            <span>TERRAIN AWARENESS: RADALT LOW AT {Math.round(telemetry.altitudeAgl)} FT AGL!</span>
          </div>
          <span className="text-[10px] bg-rose-500 text-white font-mono px-2 py-0.5 rounded font-bold">
            PULL UP / VERIFY LZ
          </span>
        </div>
      )}

      {/* Main Glass Cockpit Flight Telemetry HUD Display */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Radar Altimeter (RADALT) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1 relative">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
            Radar Alt (AGL)
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-black font-mono tracking-tight ${
                telemetry.altitudeAgl < 200 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {Math.round(telemetry.altitudeAgl)}
            </span>
            <span className="text-xs text-slate-400 font-bold">FT</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">MSL: {Math.round(telemetry.altitudeMsl)} FT</div>
        </div>

        {/* Airspeed (KIAS) & Groundspeed */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
            Airspeed / GS
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-cyan-300 font-mono tracking-tight">
              {Math.round(telemetry.airspeedKts)}
            </span>
            <span className="text-xs text-slate-400 font-bold">KT</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">GS: {Math.round(telemetry.groundspeedKts)} KT</div>
        </div>

        {/* Heading & Rate of Climb */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
            HDG / Vertical Spd
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-300 font-mono tracking-tight">
              {Math.round(telemetry.headingDeg)}°
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            VSI: {telemetry.verticalSpeedFpm > 0 ? `+${telemetry.verticalSpeedFpm}` : telemetry.verticalSpeedFpm} FPM
          </div>
        </div>

        {/* Rotor RPM (NR) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
            Rotor RPM (NR)
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-black font-mono tracking-tight ${
                isRotorDroop ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {telemetry.rotorRpmPct.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full ${isRotorDroop ? 'bg-rose-500' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(100, telemetry.rotorRpmPct)}%` }}
            />
          </div>
        </div>

        {/* Engine Torque (TRQ) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
            First Limit Ind (FLI)
          </span>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span
              className={`text-2xl font-black ${
                isFliExceedance
                  ? 'text-rose-400 animate-pulse'
                  : currentFli > 8.5
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {currentFli.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ 10.0</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            TRQ {telemetry.engine1TorquePct.toFixed(0)}% • N1 {telemetry.n1Pct ?? 98.4}%
          </div>
        </div>

        {/* Fuel & Endurance */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
            Fuel Remaining
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-100 font-mono tracking-tight">
              {Math.round(telemetry.fuelRemainingKg)}
            </span>
            <span className="text-xs text-slate-400 font-bold">KG</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Endurance: ~{telemetry.fuelEnduranceMin} MIN</div>
        </div>
      </div>

      {/* 4-Axis AFCS & Flight Control System Banner */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">4-Axis AFCS:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px] font-bold">
            SAS ARMED (±10%)
          </span>
          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[10px] font-bold">
            ATT HOLD
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono text-[10px] font-bold">
            AUTO TRIM
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
            BEEP TRIM ON
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span>G-Force: <strong className="text-slate-200">{telemetry.gForce ?? 1.02}G</strong></span>
          <span>Pitch: <strong className="text-slate-200">{telemetry.pitchDeg}°</strong></span>
          <span>Roll: <strong className="text-slate-200">{telemetry.rollDeg}°</strong></span>
        </div>
      </div>

      {/* Rescue Hoist / Winch Sub-Panel (Critical for Alpine/Offshore HEMS) */}
      {selectedAircraft.hoistEquipped && (
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Anchor className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Goodrich Variable Speed Rescue Hoist</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.2 rounded font-semibold">
                  Arm Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Cable Payout: <span className="font-mono text-amber-400 font-bold">{telemetry.hoistCableFt} FT</span> • Load: <span className="font-mono text-slate-200">{telemetry.hoistLoadLbs} LBS</span> • Max Cap: 600 LBS (272 KG)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleHoist}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition"
            >
              {telemetry.hoistCableFt > 0 ? 'Reel In Hoist' : 'Deploy Cable to LZ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
