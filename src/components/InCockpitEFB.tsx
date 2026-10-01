import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Clock,
  AlertTriangle,
  CheckSquare,
  Square,
  Radio,
  FileText,
  Activity,
  ShieldAlert,
  Wind,
  Compass,
  Volume2,
  VolumeX,
  Send,
  CheckCircle2,
  RefreshCw,
  Flame,
  Stethoscope,
} from 'lucide-react';
import { HemsMission, HemsSimTelemetry } from '../types/hems';

interface InCockpitEFBProps {
  activeMission: HemsMission;
  telemetry: HemsSimTelemetry;
  onUpdateMissionStatus?: (status: HemsMission['status']) => void;
}

export const InCockpitEFB: React.FC<InCockpitEFBProps> = ({
  activeMission,
  telemetry,
  onUpdateMissionStatus,
}) => {
  const [efbTab, setEfbTab] = useState<'vitals' | 'checklists' | 'patch_call'>('vitals');

  // Golden Hour countdown timer (60 minutes = 3600 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    Math.max(0, 3600 - (activeMission.goldenHourElapsedMin || 0) * 60)
  );
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);

  // Time-based exponential deterioration calculation: GCS(t) = GCS_0 * exp(-lambda * t)
  // Per AGENTS.md, AI-INSTRUCTIONS.md & Master Spec Section 2.3
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(activeMission.goldenHourElapsedMin || 0);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          const next = Math.max(0, prev - 1);
          return next;
        });
        setElapsedMinutes((prev) => prev + 1 / 60);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining]);

  const lambda = activeMission.decayLambda || 0.015;
  const baselineGcs = activeMission.patient.gcs || 8;
  const currentCalculatedGcs = Math.max(
    3,
    Math.min(15, Math.round(baselineGcs * Math.exp(-lambda * elapsedMinutes)))
  );

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const goldenHourProgressPct = Math.min(100, Math.max(0, (secondsRemaining / 3600) * 100));

  // Checklists state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [activeChecklistCategory, setActiveChecklistCategory] = useState<
    'startup' | 'lz_recon' | 'emergency' | 'critical_care'
  >('startup');

  const toggleChecklist = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const CHECKLIST_ITEMS = {
    startup: [
      { id: 'pre-1', label: 'Battery Master & Standby Bus', sub: 'ON (Verify 24V DC min)' },
      { id: 'pre-2', label: 'Rotor Brake Lever', sub: 'CONFIRMED RELEASED & LATCHED' },
      { id: 'pre-3', label: 'CPDS / VEMD Displays', sub: 'INITIALIZED & SYSTEM SEL TEST PASS' },
      { id: 'pre-4', label: 'AFCS (4-Axis SAS / Trim)', sub: 'ATT & SAS COUPLED, BEEP TRIM ARMED' },
      { id: 'pre-5', label: 'Fuel Pumps (Main 1 & 2)', sub: 'ON - FEED TANKS PRESSURIZED' },
      { id: 'pre-6', label: 'Engine 1 Start Switch', sub: 'ENGAGED -> N1 > 15%, TOT < 750°C' },
      { id: 'pre-7', label: 'Engine 2 Start Switch', sub: 'ENGAGED -> ROTOR ACCEL, 100% NR' },
      { id: 'pre-8', label: 'First Limit Indicator (FLI)', sub: 'VERIFIED ZERO MARGIN OFFSET' },
    ],
    lz_recon: [
      { id: 'lz-1', label: 'High Reconnaissance (500 ft AGL)', sub: 'Determine Wind Vector, Wires, Obstacles & Slope' },
      { id: 'lz-2', label: 'Power Check (Hover In Ground Effect - HIGE)', sub: 'FLI margin recorded, verify OGE reserve' },
      { id: 'lz-3', label: 'Low Reconnaissance (300 ft AGL)', sub: 'Evaluate Surface (Concrete/Asphalt/Grass), Debris & FOD' },
      { id: 'lz-4', label: 'Ingress Axis & Escape Vector', sub: 'Confirm heading into prevailing wind & clear climb-out' },
      { id: 'lz-5', label: 'Ground Incident Command Contact', sub: 'Confirm LZ secure, vehicle lighting angled down' },
      { id: 'lz-6', label: 'Final Approach & Touchdown', sub: 'Rate of descent < 300 FPM, no Vortex Ring State (VRS)' },
      { id: 'lz-7', label: 'Hot Loading Safety Protocols', sub: 'Ground crew approached from front 10 o’clock under disc' },
    ],
    emergency: [
      { id: 'em-1', label: 'Engine Failure in Cruise (Single OEI)', sub: 'Collective ADJUST to maintain NR > 97%, FLI OEI LIMIT' },
      { id: 'em-2', label: 'Dual Engine Flameout / Autorotation', sub: 'Immediate FULL DOWN collective, cyclic for 70 kts glide' },
      { id: 'em-3', label: 'Vortex Ring State (VRS) Recovery', sub: 'Vuichard Recovery: Left cyclic + forward cyclic + right pedal' },
      { id: 'em-4', label: 'Loss of Tail Rotor Effectiveness (LTE)', sub: 'Forward cyclic to regain translational lift, lower collective' },
      { id: 'em-5', label: 'Inadvertent IMC Entry (IIMC SOP)', sub: 'Level wings (ATT), climb straight ahead to MSA, call ATC' },
    ],
    critical_care: [
      { id: 'med-1', label: 'Rapid Sequence Intubation (RSI) Kit', sub: 'Video laryngoscope, ET tube #7.5, verify balloon' },
      { id: 'med-2', label: 'Ventilator Settings Checked', sub: 'PRVC FiO2 1.0, PEEP 5, Vt 450 mL, backup bag ready' },
      { id: 'med-3', label: 'Vascular Access & TXA Infusion', sub: 'Dual 16G/18G lines patent, Tranexamic Acid 1g running' },
      { id: 'med-4', label: 'Blood Product Administration', sub: '2 units PRBC + 2 units FFP in Golden Hour cooler' },
      { id: 'med-5', label: 'Hospital Radio Patch Call Transmitted', sub: 'ETA, GCS, vitals, and surgical request sent to receiving pad' },
    ],
  };

  // Patch call state
  const [patchCallSent, setPatchCallSent] = useState(false);
  const [patchCallNotes, setPatchCallNotes] = useState(
    `STATCOM / ${activeMission.destinationHospital} Emergency Receiving:\nThis is ${telemetry.simPlatform.toUpperCase()} HEMS ${activeMission.departureBase} inbound with a ${activeMission.patient.age}-year-old ${activeMission.patient.gender} polytrauma victim. Current GCS is ${currentCalculatedGcs}, HR ${activeMission.patient.heartRate}, BP ${activeMission.patient.bloodPressure}, SpO2 ${activeMission.patient.spo2}%. Bilateral large-bore IVs running with TXA. ETA to rooftop helipad is ${Math.round(activeMission.estEnrouteMin)} minutes. Request trauma team alpha activation.`
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
      {/* EFB Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Radio className="h-5 w-5 text-cyan-400" />
              Cockpit Electronic Flight Bag (EFB) &amp; Clinical Deterioration Terminal
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mission: <span className="text-red-400 font-mono font-bold">{activeMission.code}</span> • Destination:{' '}
            <span className="text-slate-200">{activeMission.destinationHospital}</span>
          </p>
        </div>

        {/* EFB Sub-Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setEfbTab('vitals')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              efbTab === 'vitals'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HeartPulse className="h-3.5 w-3.5" />
            <span>Golden Hour &amp; Vitals</span>
          </button>

          <button
            onClick={() => setEfbTab('checklists')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              efbTab === 'checklists'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>SOP Checklists</span>
          </button>

          <button
            onClick={() => setEfbTab('patch_call')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              efbTab === 'patch_call'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Radio Patch Call</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GOLDEN HOUR & VITALS ENGINE */}
      {efbTab === 'vitals' && (
        <div className="space-y-6">
          {/* Golden Hour Countdown Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    secondsRemaining < 900
                      ? 'bg-rose-600 text-white animate-pulse'
                      : secondsRemaining < 1800
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                    CRITICAL CARE TRANSPORT TIMELINE
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                      {formatTimer(secondsRemaining)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ 60:00 GOLDEN HOUR</span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                >
                  {isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
                </button>
                <button
                  onClick={() => setSoundAlerts(!soundAlerts)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                  title="Toggle Audio Alarms"
                >
                  {soundAlerts ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-1000 ${
                  secondsRemaining < 900
                    ? 'bg-rose-500'
                    : secondsRemaining < 1800
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${goldenHourProgressPct}%` }}
              />
            </div>

            {/* Warning if on-scene time exceeds 15 min or Golden hour < 15 min */}
            {elapsedMinutes > 15 && (
              <div className="mt-3 bg-amber-950/70 border border-amber-600/70 rounded-lg p-2.5 text-xs text-amber-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  <strong>On-Scene Exceedance Alert:</strong> Elapsed time on scene ({elapsedMinutes.toFixed(1)} min)
                  exceeds 15:00 min target. Rapid departure to definitive trauma surgical suite recommended.
                </span>
              </div>
            )}
          </div>

          {/* Real-Time Patient Physiological Degradation Engine */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Glasgow Coma Scale (GCS) Exponential Decay */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Current Glasgow Coma Scale</span>
                <span className="text-[10px] font-mono text-cyan-400">λ = {lambda}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-black font-mono ${
                    currentCalculatedGcs < 8
                      ? 'text-rose-500 animate-pulse'
                      : currentCalculatedGcs <= 12
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {currentCalculatedGcs}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ 15 GCS</span>
                <span className="text-[11px] text-slate-500 ml-auto">
                  Baseline: {baselineGcs}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Computed via dynamic exponential deterioration algorithm:{' '}
                <span className="font-mono text-slate-300">GCS(t) = GCS₀ · e^(-λt)</span>
              </p>
              {currentCalculatedGcs < 8 && (
                <div className="bg-rose-950/80 border border-rose-600/80 rounded p-1.5 text-[11px] text-rose-300 font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  <span>CRITICAL AIRWAY ALERT: GCS &lt; 8. Immediate intubation / RSI protocol mandated.</span>
                </div>
              )}
            </div>

            {/* Hemodynamic Status */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold uppercase text-slate-400">Hemodynamic Profile</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">HEART RATE</span>
                  <span className="text-base font-bold text-slate-100 font-mono">
                    {activeMission.patient.heartRate} bpm
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">BLOOD PRESSURE</span>
                  <span className="text-base font-bold text-slate-100 font-mono">
                    {activeMission.patient.bloodPressure}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">PULSE OX (SpO2)</span>
                  <span className="text-base font-bold text-cyan-400 font-mono">
                    {activeMission.patient.spo2}%
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">RESP RATE</span>
                  <span className="text-base font-bold text-slate-100 font-mono">
                    {activeMission.patient.respRate} rpm
                  </span>
                </div>
              </div>
            </div>

            {/* Active Clinical Interventions */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold uppercase text-slate-400">Interventions &amp; Access</span>
              <div className="text-xs text-slate-300 space-y-1.5">
                <p>
                  <strong className="text-slate-400">Intubation:</strong>{' '}
                  <span className={activeMission.patient.intubated ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                    {activeMission.patient.intubated ? 'Intubated (Ventilated)' : 'Spontaneous Airway'}
                  </span>
                </p>
                {activeMission.patient.ventilatorMode && (
                  <p>
                    <strong className="text-slate-400">Vent Mode:</strong> {activeMission.patient.ventilatorMode}
                  </p>
                )}
                <p>
                  <strong className="text-slate-400">Vascular:</strong> {activeMission.patient.ivAccess}
                </p>
                <p>
                  <strong className="text-slate-400">Triage:</strong>{' '}
                  <span className="text-rose-400 font-bold">{activeMission.patient.triage}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOP CHECKLISTS */}
      {efbTab === 'checklists' && (
        <div className="space-y-4">
          {/* Checklist categories */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            {[
              { id: 'startup', label: '1. Engine Startup & FLI Check' },
              { id: 'lz_recon', label: '2. Landing Zone (LZ) Reconnaissance' },
              { id: 'emergency', label: '3. Emergency & Inadvertent IMC' },
              { id: 'critical_care', label: '4. Critical Care Handover' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveChecklistCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeChecklistCategory === cat.id
                    ? 'bg-slate-800 text-red-400 border border-red-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Checklist items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CHECKLIST_ITEMS[activeChecklistCategory].map((item) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    isChecked
                      ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isChecked ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${isChecked ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                      {item.label}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-slate-400">
              Completed:{' '}
              {
                CHECKLIST_ITEMS[activeChecklistCategory].filter((i) => checkedItems[i.id]).length
              }{' '}
              / {CHECKLIST_ITEMS[activeChecklistCategory].length} items
            </span>
            <button
              onClick={() => {
                const nextChecked = { ...checkedItems };
                CHECKLIST_ITEMS[activeChecklistCategory].forEach((i) => {
                  nextChecked[i.id] = true;
                });
                setCheckedItems(nextChecked);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Mark All Completed
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: RADIO PATCH CALL */}
      {efbTab === 'patch_call' && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="h-4 w-4 text-cyan-400" />
                Standardized HEMS Medical Direction / Receiving Hospital Patch Call
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Freq: {telemetry.simPlatform === 'msfs' ? '123.050 MHz' : '123.025 MHz'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Transmit early report to trauma team via STATCOM / LifeFlight medical control frequency to prepare blood
              products, CT scanner, or surgical operating room.
            </p>

            <textarea
              rows={5}
              value={patchCallNotes}
              onChange={(e) => setPatchCallNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 font-mono focus:border-cyan-500 outline-none resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Hospital Target: <strong className="text-slate-200">{activeMission.destinationHospital}</strong>
              </span>

              <button
                onClick={() => {
                  setPatchCallSent(true);
                  setTimeout(() => setPatchCallSent(false), 4000);
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  patchCallSent
                    ? 'bg-emerald-600 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
                }`}
              >
                {patchCallSent ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>PATCH CALL BROADCASTED &amp; ACKNOWLEDGED</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>TRANSMIT RADIO PATCH CALL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
