import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  HeartPulse,
  Compass,
  Plane,
  Clock,
  MapPin,
  Hospital,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { HemsMission, FlightLogEntry, HemsAircraft, HemsSimTelemetry } from '../types/hems';

interface MissionSummaryReportModalProps {
  mission: HemsMission;
  flightLog?: FlightLogEntry;
  aircraft: HemsAircraft;
  telemetry: HemsSimTelemetry;
  onClose: () => void;
}

export const MissionSummaryReportModal: React.FC<MissionSummaryReportModalProps> = ({
  mission,
  flightLog,
  aircraft,
  telemetry,
  onClose,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const completedTime = flightLog?.completedAt
    ? new Date(flightLog.completedAt)
    : new Date();

  const formattedDate = completedTime.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedZulu = completedTime.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const durationMin = flightLog?.flightDurationMin || mission.estEnrouteMin;

  // Browser print trigger for PDF generation
  const handlePrintPdf = () => {
    window.print();
  };

  // Text/Markdown export fallback
  const handleDownloadText = () => {
    const textContent = `
================================================================================
   PACIFIC NORTHWEST HEMS CRITICAL CARE TRANSPORT SERVICE
   MISSION SUMMARY & CLINICAL PATIENT HANDOVER REPORT (ASR)
================================================================================
MISSION CODE       : ${mission.code}
CLASSIFICATION     : PRIORITY ${mission.priority.toUpperCase()} (${mission.type.replace('_', ' ').toUpperCase()})
INCIDENT TITLE     : ${mission.title}
COMPLETED TIMESTAMP: ${formattedZulu}
TOTAL SORTIE TIME  : ${durationMin.toFixed(1)} MIN

--------------------------------------------------------------------------------
1. AIRFRAME & SIMULATOR TELEMETRY
--------------------------------------------------------------------------------
Airframe Unit      : ${aircraft.name} (${aircraft.callsign})
Avionics / Model   : ${aircraft.model}
Sim Platform Bridge: ${telemetry.simPlatform.toUpperCase()}
Fuel Remaining     : ${Math.round(telemetry.fuelRemainingKg)} KG (~${telemetry.fuelEnduranceMin} MIN endurance)
Hoist Extraction   : ${aircraft.hoistEquipped ? `Equipped (Payout: ${telemetry.hoistCableFt} FT)` : 'N/A (Standard Skids)'}

--------------------------------------------------------------------------------
2. ROUTING & LANDING ZONE (LZ) RECONNAISSANCE
--------------------------------------------------------------------------------
Departure Base     : ${mission.departureBase}
Incident Scene LZ  : ${mission.lz.name}
LZ Coordinates     : ${mission.lz.lat.toFixed(4)}°N, ${Math.abs(mission.lz.lon).toFixed(4)}°W
Elevation / Surface: ${mission.lz.elevationFt} FT MSL | ${mission.lz.surface} (${mission.lz.dimensions})
Recommended Ingress: ${mission.lz.recommendedIngress}
Hazards & Obstacles: ${mission.lz.obstacles}; ${mission.lz.hazards}

Receiving Facility : ${mission.destinationHospital}
Weather METAR      : ${mission.weatherMetar}

--------------------------------------------------------------------------------
3. PATIENT CLINICAL TELEMETRY & IN-FLIGHT CARE
--------------------------------------------------------------------------------
Demographics       : ${mission.patient.age} Y/O ${mission.patient.gender}
Triage Category    : ${mission.patient.triage}
Chief Complaint    : ${mission.patient.chiefComplaint}
Vitals At Transport:
  - Heart Rate     : ${mission.patient.heartRate} BPM
  - Blood Pressure : ${mission.patient.bloodPressure} mmHg
  - SpO2           : ${mission.patient.spo2}%
  - Resp Rate      : ${mission.patient.respRate} RPM
  - Temperature    : ${mission.patient.tempC}°C
  - GCS Scale      : ${mission.patient.gcs}/15
  - Pain Scale     : ${mission.patient.painScale}/10

Airway / Breathing : ${mission.patient.intubated ? `Intubated (${mission.patient.ventilatorMode || 'Mechanical Ventilation'})` : 'Non-invasive high-flow O2'}
Vascular Access    : ${mission.patient.ivAccess}
Patient Handover   : ${flightLog?.patientOutcome || 'Completed at Receiving Trauma Center'}

--------------------------------------------------------------------------------
4. OPERATIONAL ATTESTATION
--------------------------------------------------------------------------------
Pilot-in-Command   : ${aircraft.callsign} (Attested / Flight Logged)
Clinical Crew      : HEMS Flight Paramedic / Flight Nurse (Attested)
Report Ref         : HEMS-ASR-${mission.code}-${Date.now().toString(36).toUpperCase()}
================================================================================
`.trim();

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mission_Summary_${mission.code}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:rounded-none print:bg-white">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="no-print bg-slate-850 border-b border-slate-800 p-4 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Mission Summary Report (PDF-Style)</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded font-semibold">
                  FLIGHT COMPLETED
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official HEMS sortie record, patient care manifest, and flight logbook entry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg shadow-sm transition"
              title="Print document or Save as PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={handleDownloadText}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              title="Download text summary"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Text</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-100 rounded-lg transition"
              title="Close Report"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable PDF Document Canvas */}
        <div className="overflow-y-auto p-4 sm:p-8 flex-1 bg-slate-950/50 print:bg-white print:p-0 print:overflow-visible">
          <div
            ref={reportRef}
            className="print-page bg-white text-slate-900 rounded-xl shadow-xl p-6 sm:p-8 space-y-6 text-xs border border-slate-200 print:border-none print:shadow-none print:p-0 print:rounded-none"
          >
            {/* Document Header & Seal */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-700 font-black tracking-widest text-[11px] uppercase">
                    <HeartPulse className="h-4 w-4 shrink-0" />
                    <span>AEROMEDICAL EMERGENCY MEDICAL EVACUATION SERVICE</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
                    MISSION SUMMARY &amp; CLINICAL REPORT
                  </h1>
                  <p className="text-[11px] text-slate-600 font-mono">
                    Sortie Logbook Attestation • Flight Simulation Companion Record (MSFS &amp; X-Plane)
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block border-2 border-slate-900 px-2.5 py-1 text-center font-mono">
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-slate-500">MISSION CODE</span>
                    <span className="text-base font-black text-slate-950">{mission.code}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Ref: HEMS-ASR-{mission.code}
                  </div>
                </div>
              </div>

              {/* Fast Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Sortie Date</span>
                  <span className="font-bold text-slate-900">{formattedDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Zulu Timestamp</span>
                  <span className="font-bold text-slate-900">{formattedZulu}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Triage Priority</span>
                  <span className="font-bold text-rose-700">CODE {mission.priority.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Total Flight Time</span>
                  <span className="font-bold text-slate-900">{durationMin.toFixed(1)} MIN</span>
                </div>
              </div>
            </div>

            {/* Section 1: Incident Description & Routing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h3 className="font-bold text-slate-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-slate-700" />
                  <span>1. Incident Profile &amp; Flight Routing</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-600 uppercase">
                  Operation: {mission.type.replace('_', ' ')}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">{mission.title}</div>
                <p className="text-slate-700 leading-relaxed text-[11px]">{mission.description}</p>
              </div>

              {/* Waypoint Routing Table */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="border border-slate-200 rounded p-2.5 bg-slate-50">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Departure Base</span>
                  <span className="font-bold text-slate-900">{mission.departureBase}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Liftoff &amp; Dispatch Point</span>
                </div>

                <div className="border border-amber-300 rounded p-2.5 bg-amber-50/60">
                  <span className="text-[9px] font-bold text-amber-800 uppercase block">Incident Scene (LZ)</span>
                  <span className="font-bold text-amber-950">{mission.lz.name}</span>
                  <span className="text-[10px] text-amber-800 font-mono block mt-0.5">
                    {mission.lz.lat.toFixed(4)}°N, {Math.abs(mission.lz.lon).toFixed(4)}°W ({mission.lz.elevationFt} ft)
                  </span>
                </div>

                <div className="border border-rose-300 rounded p-2.5 bg-rose-50/60">
                  <span className="text-[9px] font-bold text-rose-800 uppercase block">Receiving Trauma Facility</span>
                  <span className="font-bold text-rose-950">{mission.destinationHospital}</span>
                  <span className="text-[10px] text-rose-800 block mt-0.5">Definitive Care Handover</span>
                </div>
              </div>

              {/* LZ Reconnaissance Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-slate-100/70 p-2.5 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500 font-sans block text-[9px] uppercase font-bold">LZ Specifications</span>
                  <span>{mission.lz.type} • {mission.lz.surface} • {mission.lz.dimensions}</span>
                  <div className="text-slate-600 mt-0.5">Night Lighting: {mission.lz.nightLighting}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-sans block text-[9px] uppercase font-bold">Ingress &amp; Hazards</span>
                  <span className="text-slate-900 font-sans">{mission.lz.recommendedIngress}</span>
                  <div className="text-amber-800 text-[10px] mt-0.5">Obs: {mission.lz.obstacles}</div>
                </div>
              </div>
            </div>

            {/* Section 2: Airframe & Simulator Telemetry */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h3 className="font-bold text-slate-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Plane className="h-3.5 w-3.5 text-slate-700" />
                  <span>2. Aircraft Operations &amp; Flight Simulator Log</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-600 uppercase">
                  Sim: {telemetry.simPlatform.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <span className="text-slate-500 font-sans text-[9px] uppercase block">Airframe Callsign</span>
                  <span className="font-bold text-slate-900">{aircraft.callsign}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{aircraft.name}</span>
                </div>

                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <span className="text-slate-500 font-sans text-[9px] uppercase block">Max Airspeed / Cruise</span>
                  <span className="font-bold text-slate-900">{aircraft.maxCruiseKts} KTS</span>
                  <span className="text-[10px] text-slate-500 block">Groundspeed: ~{Math.round(telemetry.groundspeedKts)} KTS</span>
                </div>

                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <span className="text-slate-500 font-sans text-[9px] uppercase block">Fuel Logged</span>
                  <span className="font-bold text-slate-900">{Math.round(telemetry.fuelRemainingKg)} KG</span>
                  <span className="text-[10px] text-slate-500 block">Endurance: ~{telemetry.fuelEnduranceMin} MIN</span>
                </div>

                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <span className="text-slate-500 font-sans text-[9px] uppercase block">Rescue Hoist Status</span>
                  <span className="font-bold text-slate-900">
                    {aircraft.hoistEquipped ? `Equipped (${telemetry.hoistCableFt} FT)` : 'None (Slick)'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {aircraft.hoistEquipped ? `Load: ${telemetry.hoistLoadLbs} LBS` : 'Ground Operations'}
                  </span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                <span className="font-bold text-slate-700">METAR AT DEPARTURE:</span> {mission.weatherMetar}
              </div>
            </div>

            {/* Section 3: Patient Clinical Manifest & Telemetry */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h3 className="font-bold text-slate-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <HeartPulse className="h-3.5 w-3.5 text-rose-700" />
                  <span>3. Patient Clinical Record &amp; Vitals Manifest</span>
                </h3>
                <span className="text-[10px] font-bold text-rose-700 uppercase">
                  Triage: {mission.patient.triage}
                </span>
              </div>

              {/* Patient Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <span className="text-slate-500 text-[9px] uppercase font-bold block">Patient Demographics</span>
                  <span className="font-bold text-slate-900">{mission.patient.age} Y/O {mission.patient.gender}</span>
                </div>
                <div className="sm:col-span-2 p-2 border border-slate-200 rounded bg-slate-50">
                  <span className="text-slate-500 text-[9px] uppercase font-bold block">Chief Complaint / Traumatic Mechanism</span>
                  <span className="font-bold text-slate-900">{mission.patient.chiefComplaint}</span>
                </div>
              </div>

              {/* Vitals Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center font-mono">
                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <span className="text-[9px] text-slate-500 font-sans uppercase font-bold block">Heart Rate</span>
                  <span className="text-sm font-black text-rose-700">{mission.patient.heartRate}</span>
                  <span className="text-[9px] text-slate-500 block">BPM</span>
                </div>

                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <span className="text-[9px] text-slate-500 font-sans uppercase font-bold block">Blood Pressure</span>
                  <span className="text-sm font-black text-slate-900">{mission.patient.bloodPressure}</span>
                  <span className="text-[9px] text-slate-500 block">mmHg</span>
                </div>

                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <span className="text-[9px] text-slate-500 font-sans uppercase font-bold block">SpO2 Oxygen</span>
                  <span className="text-sm font-black text-cyan-800">{mission.patient.spo2}%</span>
                  <span className="text-[9px] text-slate-500 block">Pulse Ox</span>
                </div>

                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <span className="text-[9px] text-slate-500 font-sans uppercase font-bold block">Resp Rate</span>
                  <span className="text-sm font-black text-slate-900">{mission.patient.respRate}</span>
                  <span className="text-[9px] text-slate-500 block">RPM</span>
                </div>

                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <span className="text-[9px] text-slate-500 font-sans uppercase font-bold block">GCS Scale</span>
                  <span className="text-sm font-black text-amber-700">{mission.patient.gcs}/15</span>
                  <span className="text-[9px] text-slate-500 block">Neurological</span>
                </div>

                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <span className="text-[9px] text-slate-500 font-sans uppercase font-bold block">Temperature</span>
                  <span className="text-sm font-black text-slate-900">{mission.patient.tempC}°C</span>
                  <span className="text-[9px] text-slate-500 block">Core Temp</span>
                </div>
              </div>

              {/* Critical Interventions */}
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-1 text-[11px]">
                <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                  Critical In-Flight Interventions:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-900">Airway Management: </span>
                    {mission.patient.intubated
                      ? `Endotracheal Intubation (${mission.patient.ventilatorMode || 'Mechanical Ventilation Active'})`
                      : 'Non-invasive high-flow supplemental oxygen (15L NRB mask)'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Vascular Access &amp; Resuscitation: </span>
                    {mission.patient.ivAccess}
                  </div>
                </div>
                <div className="pt-1 text-slate-700 border-t border-slate-200">
                  <span className="font-semibold text-slate-900">Transfer Outcome: </span>
                  <span className="text-emerald-800 font-medium">
                    {flightLog?.patientOutcome || 'Definitive care handover completed to Trauma Resuscitation Team.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: Operational Attestation & Signatures */}
            <div className="pt-4 border-t-2 border-slate-900 space-y-4">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                4. Sortie Attestation &amp; Transfer of Care Sign-Off
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[10px]">
                <div className="space-y-4 border-t border-slate-400 pt-1">
                  <div className="font-bold text-slate-900">PILOT-IN-COMMAND (PIC)</div>
                  <div className="font-mono text-slate-600">
                    Callsign: {aircraft.callsign} • Airframe: {aircraft.model}
                  </div>
                  <div className="border-b border-dashed border-slate-400 pb-1 text-slate-400 italic">
                    Signed electronically via SimConnect / X-Plane
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-400 pt-1">
                  <div className="font-bold text-slate-900">FLIGHT NURSE / PARAMEDIC (CCRN/FP-C)</div>
                  <div className="font-mono text-slate-600">
                    Lead Medical Officer • Medic 1 HEMS Ops
                  </div>
                  <div className="border-b border-dashed border-slate-400 pb-1 text-slate-400 italic">
                    Patient Handover Completed
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-400 pt-1">
                  <div className="font-bold text-slate-900">RECEIVING TRAUMA TEAM PHYSICIAN</div>
                  <div className="font-mono text-slate-600">
                    {mission.destinationHospital.split('(')[0]}
                  </div>
                  <div className="border-b border-dashed border-slate-400 pb-1 text-slate-400 italic">
                    Care Assumed in Trauma Bay
                  </div>
                </div>
              </div>

              {/* Verification Footer */}
              <div className="flex flex-wrap items-center justify-between text-[9px] text-slate-500 font-mono pt-2 border-t border-slate-200">
                <span>DOCUMENT SECURITY: HEMS-ASR-VERIFIED-{mission.code}</span>
                <span>SYSTEM CLOUD DATABASE: SYNCED TO FIRESTORE</span>
                <span>GENERATED: {formattedZulu}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="no-print bg-slate-850 border-t border-slate-800 p-3 px-6 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono">Ctrl+P</kbd> or click <b>Print / Save as PDF</b> to export.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold rounded-lg border border-slate-700 transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
