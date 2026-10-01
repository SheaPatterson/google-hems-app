import React, { useState } from 'react';
import {
  Siren,
  HeartPulse,
  MapPin,
  Clock,
  Compass,
  Wind,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  ArrowRight,
  Send,
  FolderOpen,
} from 'lucide-react';
import { HemsMission } from '../types/hems';
import { ACTIVE_HEMS_MISSIONS } from '../data/sampleHemsData';

interface MissionDispatchBoardProps {
  missions: HemsMission[];
  activeMission: HemsMission | null;
  onSelectMission: (mission: HemsMission) => void;
  onUpdateMissionStatus: (missionId: string, nextStatus: HemsMission['status']) => void;
  onCompleteMission: (mission: HemsMission) => void;
  onBrowseDriveMissions?: () => void;
  onPreviewReport?: (mission: HemsMission) => void;
}

export const MissionDispatchBoard: React.FC<MissionDispatchBoardProps> = ({
  missions,
  activeMission,
  onSelectMission,
  onUpdateMissionStatus,
  onCompleteMission,
  onBrowseDriveMissions,
  onPreviewReport,
}) => {
  const current = activeMission || missions[0];

  const getPriorityBadge = (priority: HemsMission['priority']) => {
    switch (priority) {
      case 'Echo':
        return <span className="bg-rose-600 text-white font-black px-2 py-0.5 rounded text-[10px] tracking-wider animate-pulse">PRIORITY ECHO (CODE 3)</span>;
      case 'Alpha':
        return <span className="bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] tracking-wider">PRIORITY ALPHA</span>;
      case 'Bravo':
        return <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] tracking-wider">PRIORITY BRAVO</span>;
      default:
        return <span className="bg-slate-700 text-slate-200 font-medium px-2 py-0.5 rounded text-[10px]">ROUTINE</span>;
    }
  };

  const getStatusStepClass = (stepStatus: HemsMission['status'], currentStatus: HemsMission['status']) => {
    const order = ['dispatched', 'enroute_scene', 'on_scene', 'enroute_hospital', 'cleared'];
    const stepIdx = order.indexOf(stepStatus);
    const currIdx = order.indexOf(currentStatus);

    if (stepIdx < currIdx) return 'bg-emerald-500 text-slate-950 font-bold';
    if (stepIdx === currIdx) return 'bg-red-500 text-white font-bold ring-2 ring-red-400';
    return 'bg-slate-800 text-slate-500';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-6">
      {/* Header and Mission Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <Siren className="h-5 w-5 text-red-500 animate-pulse" />
            HEMS Mission Dispatch &amp; Patient Transport
          </h2>
          <p className="text-xs text-slate-400">
            Real-time medical flight routing, Landing Zone (LZ) reconnaissance, and patient telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onPreviewReport && current && (
            <button
              onClick={() => onPreviewReport(current)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 text-xs font-semibold rounded-lg shadow-sm transition"
              title="Generate printable PDF-style Mission Summary Report"
            >
              <FileText className="h-3.5 w-3.5 text-red-400" />
              <span>Mission PDF Report</span>
            </button>
          )}

          {onBrowseDriveMissions && (
            <button
              onClick={onBrowseDriveMissions}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs rounded-lg border border-slate-700 transition"
            >
              <FolderOpen className="h-3.5 w-3.5 text-cyan-400" />
              <span>Load from Drive HENS</span>
            </button>
          )}

          {/* Quick mission tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {missions.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMission(m)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  current?.id === m.id
                    ? 'bg-slate-800 text-red-400 border border-red-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {current && (
        <div className="space-y-6">
          {/* Mission Overview Banner */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-100 font-mono">{current.code}</span>
                {getPriorityBadge(current.priority)}
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  • {current.type.replace('_', ' ')}
                </span>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Est. Enroute: <span className="text-amber-400 font-bold">{current.estEnrouteMin} MIN</span> ({current.distanceNm} NM)
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-100">{current.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{current.description}</p>

            {/* Flight Routing Bar */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Departure Base</span>
                <span className="font-bold text-slate-200">{current.departureBase}</span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Receiving Trauma Facility</span>
                <span className="font-bold text-red-300">{current.destinationHospital}</span>
              </div>
            </div>
          </div>

          {/* Interactive Mission Progress Timeline */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Operational Flight Phase</span>
              <span className="text-[11px] text-red-400 capitalize">Current: {current.status.replace('_', ' ')}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold text-center">
              <button
                onClick={() => onUpdateMissionStatus(current.id, 'dispatched')}
                className={`p-2 rounded-lg transition ${getStatusStepClass('dispatched', current.status)}`}
              >
                1. Dispatched
              </button>
              <button
                onClick={() => onUpdateMissionStatus(current.id, 'enroute_scene')}
                className={`p-2 rounded-lg transition ${getStatusStepClass('enroute_scene', current.status)}`}
              >
                2. Enroute Scene
              </button>
              <button
                onClick={() => onUpdateMissionStatus(current.id, 'on_scene')}
                className={`p-2 rounded-lg transition ${getStatusStepClass('on_scene', current.status)}`}
              >
                3. On Scene / LZ
              </button>
              <button
                onClick={() => onUpdateMissionStatus(current.id, 'enroute_hospital')}
                className={`p-2 rounded-lg transition ${getStatusStepClass('enroute_hospital', current.status)}`}
              >
                4. Enroute Hospital
              </button>
              <button
                onClick={() => onCompleteMission(current)}
                className={`p-2 rounded-lg transition ${getStatusStepClass('cleared', current.status)}`}
              >
                5. Handover / Complete
              </button>
            </div>
          </div>

          {/* Dual Panel: Patient Telemetry & Landing Zone (LZ) Reconnaissance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Patient Vitals & Clinical Manifest */}
            <div className="bg-slate-850/70 border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                  <HeartPulse className="h-4 w-4" />
                  <span>Patient Clinical Telemetry</span>
                </div>
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">
                  {current.patient.triage}
                </span>
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Heart Rate</span>
                  <span className="text-base font-bold text-rose-400">{current.patient.heartRate} BPM</span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                  <span className="text-base font-bold text-slate-100">{current.patient.bloodPressure}</span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">SpO2</span>
                  <span className="text-base font-bold text-cyan-300">{current.patient.spo2}%</span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">GCS Scale</span>
                  <span className="text-base font-bold text-amber-300">{current.patient.gcs}/15</span>
                </div>
              </div>

              {/* Interventions list */}
              <div className="text-xs space-y-1 pt-1 text-slate-300">
                <p><span className="text-slate-400">Demographics:</span> {current.patient.age} y/o {current.patient.gender}</p>
                <p><span className="text-slate-400">Assessment:</span> {current.patient.chiefComplaint}</p>
                <p><span className="text-slate-400">Airway:</span> {current.patient.intubated ? `Intubated (${current.patient.ventilatorMode || 'Mechanical Vent'})` : 'Non-invasive O2 via NRB mask'}</p>
                <p><span className="text-slate-400">Vascular Access:</span> {current.patient.ivAccess}</p>
              </div>
            </div>

            {/* Landing Zone (LZ) Reconnaissance */}
            <div className="bg-slate-850/70 border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <Compass className="h-4 w-4" />
                  <span>Landing Zone (LZ) Recon &amp; Ingress</span>
                </div>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                  {current.lz.type}
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Designation</span>
                  <span className="font-semibold text-slate-100">{current.lz.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                  <span className="text-slate-400">Dimensions &amp; Surface</span>
                  <span>{current.lz.dimensions} ({current.lz.surface})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                  <span className="text-slate-400">Elevation</span>
                  <span>{current.lz.elevationFt} FT MSL</span>
                </div>
                <div className="py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 block text-[10px] uppercase">Obstacles &amp; Hazards</span>
                  <span className="text-amber-300 font-medium">{current.lz.obstacles}. {current.lz.hazards}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-400 block text-[10px] uppercase">Recommended Ingress / Approach</span>
                  <span className="text-emerald-400 font-medium">{current.lz.recommendedIngress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Aviation Weather METAR */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-cyan-400 shrink-0" />
              <span className="text-slate-400 uppercase">Live METAR:</span>
              <span className="text-slate-200">{current.weatherMetar}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
