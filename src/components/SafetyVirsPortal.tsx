import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  BookOpen,
  Send,
  CheckCircle2,
  Calendar,
  Plane,
  FileText,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { VirsIncidentReport, HemsAircraft } from '../types/hems';
import { INITIAL_VIRS_REPORTS, HEMS_AIRCRAFT_FLEET } from '../data/sampleHemsData';

interface SafetyVirsPortalProps {
  selectedAircraft: HemsAircraft;
}

export const SafetyVirsPortal: React.FC<SafetyVirsPortalProps> = ({ selectedAircraft }) => {
  const [reports, setReports] = useState<VirsIncidentReport[]>(INITIAL_VIRS_REPORTS);
  const [activeTab, setActiveTab] = useState<'submit' | 'history' | 'charter'>('submit');

  // Form State
  const [incidentCategory, setIncidentCategory] = useState<VirsIncidentReport['incidentCategory']>(
    'Landing Zone Hazard'
  );
  const [missionCode, setMissionCode] = useState('HEMS-295208');
  const [aircraftCallsign, setAircraftCallsign] = useState(selectedAircraft.callsign);
  const [reporterRole, setReporterRole] = useState<VirsIncidentReport['reporterRole']>(
    'Pilot in Command (PIC)'
  );
  const [severity, setSeverity] = useState<VirsIncidentReport['severity']>('Moderate Concern');
  const [description, setDescription] = useState('');
  const [mitigationOrAction, setMitigationOrAction] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newReport: VirsIncidentReport = {
      id: `virs-${Date.now()}`,
      incidentCategory,
      date: new Date().toISOString().split('T')[0],
      missionCode: missionCode.trim() || 'UNASSIGNED',
      aircraftCallsign,
      reporterRole,
      severity,
      description,
      mitigationOrAction: mitigationOrAction || 'Logged for flight safety council review.',
      submittedAt: new Date().toISOString(),
    };

    setReports([newReport, ...reports]);
    setIsSubmitted(true);
    setDescription('');
    setMitigationOrAction('');
    setTimeout(() => {
      setIsSubmitted(false);
      setActiveTab('history');
    }, 1500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Safety Management System (SMS) &amp; VIRS Reporting Portal
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Non-Punitive Virtual Incident Reporting System • FAA Part 135 &amp; CAMTS Compliance (VHOP-01 SOPs)
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'submit' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>File Incident (VIRS)</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'history' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Incident Log ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('charter')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'charter' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Safety Charter &amp; VHOP-01</span>
          </button>
        </div>
      </div>

      {/* SUBMIT VIRS REPORT TAB */}
      {activeTab === 'submit' && (
        <form onSubmit={handleSubmitReport} className="space-y-5">
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 text-xs text-emerald-200 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-100">Non-Punitive Reporting Guarantee (Just Culture Policy)</h4>
              <p className="mt-0.5 text-emerald-300/90 leading-relaxed">
                Virtual HEMS operates under a strict non-punitive safety reporting culture. Reports filed through VIRS
                are audited solely to update flight envelope procedures, hazard notices, and crew training—never for
                disciplinary action. Honest reporting protects every crew and patient.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Incident Category
              </label>
              <select
                value={incidentCategory}
                onChange={(e) => setIncidentCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 outline-none"
              >
                <option value="Landing Zone Hazard">Landing Zone Hazard (Debris, Wires, Lighting)</option>
                <option value="Flight Envelope Exceedance">Flight Envelope Exceedance (FLI / Pitch / Roll)</option>
                <option value="Inadvertent IMC / WX">Inadvertent IMC / Deteriorating Weather</option>
                <option value="Near Midair / Drone">Near Midair Collision / Drone Intrusion</option>
                <option value="Avionics / Mechanical Anomaly">Avionics / Mechanical System Failure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Mission Code (if applicable)
              </label>
              <input
                type="text"
                value={missionCode}
                onChange={(e) => setMissionCode(e.target.value)}
                placeholder="e.g. HEMS-295208"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Airframe &amp; Callsign
              </label>
              <select
                value={aircraftCallsign}
                onChange={(e) => setAircraftCallsign(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:border-red-500 outline-none"
              >
                {HEMS_AIRCRAFT_FLEET.map((a) => (
                  <option key={a.id} value={a.callsign}>
                    {a.callsign} ({a.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Reporter Role
              </label>
              <select
                value={reporterRole}
                onChange={(e) => setReporterRole(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 outline-none"
              >
                <option value="Pilot in Command (PIC)">Pilot in Command (PIC)</option>
                <option value="Flight Nurse (PHRN)">Flight Nurse (PHRN)</option>
                <option value="Flight Paramedic">Flight Paramedic</option>
                <option value="Communications Specialist">Communications Specialist (STATCOM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Perceived Severity Rating
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 outline-none"
              >
                <option value="Minor Deviation">Minor Deviation (Procedural anomaly, no hazard)</option>
                <option value="Moderate Concern">Moderate Concern (Potential hazard mitigated by crew)</option>
                <option value="Severe Hazard">Severe Hazard (Immediate safety of flight threat)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Factual Narrative Description of Event
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State what occurred, altitude AGL/MSL, airspeed, meteorological conditions, and what factors contributed..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 focus:border-red-500 outline-none resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Corrective Action Taken &amp; Proposed System Mitigation
            </label>
            <textarea
              rows={3}
              value={mitigationOrAction}
              onChange={(e) => setMitigationOrAction(e.target.value)}
              placeholder="Describe actions taken by crew, go-around, diversion, or recommendations for future operations..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 focus:border-red-500 outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitted}
              className={`px-8 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 transition shadow-lg ${
                isSubmitted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
              }`}
            >
              {isSubmitted ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>REPORT SUBMITTED TO SMS AUDIT ENGINE</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>SUBMIT NON-PUNITIVE VIRS REPORT</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* INCIDENT HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Archived incident reports filed by flight crews across the Western Pennsylvania aeromedical theater.
          </div>

          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-red-400 font-mono">{r.id.toUpperCase()}</span>
                    <span className="text-slate-500">|</span>
                    <span className="font-semibold text-xs text-slate-200">{r.incidentCategory}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        r.severity === 'Severe Hazard'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : r.severity === 'Moderate Concern'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {r.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>Callsign: {r.aircraftCallsign}</span>
                    <span>Date: {r.date}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{r.description}</p>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                  <strong className="text-emerald-400">Action &amp; Mitigation:</strong> {r.mitigationOrAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SAFETY CHARTER & VHOP-01 TAB */}
      {activeTab === 'charter' && (
        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-400" />
              Virtual HEMS Operational Safety Charter &amp; Core Values
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Virtual HEMS mandates compliance with three fundamental operational pillars: <strong>Integrity</strong> (transparent flight telemetry recording and honest self-reporting), <strong>Reliability</strong> (procedural timeline adherence and checklist execution), and <strong>Service</strong> (simulated patient dignity and ethical aeromedical transport).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <h5 className="text-xs font-bold text-red-400">1. Integrity (Just Culture)</h5>
                <p className="text-[11px] text-slate-400">
                  Voluntary reporting of flight envelope excursions, FLI spikes, and weather anomalies without fear of punitive action.
                </p>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <h5 className="text-xs font-bold text-amber-400">2. Reliability (CRM SOPs)</h5>
                <p className="text-[11px] text-slate-400">
                  Strict Sterile Cockpit enforcement below 1,000 ft AGL and dual crew cross-checks during Landing Zone reconnaissance.
                </p>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <h5 className="text-xs font-bold text-emerald-400">3. Service (Golden Hour)</h5>
                <p className="text-[11px] text-slate-400">
                  Efficient medical logistics ensuring trauma patients reach definitive tertiary care within the 60-minute window.
                </p>
              </div>
            </div>
          </div>

          {/* Operations Manual (VHOP-01) Table of Contents */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Virtual HEMS Operations Manual (VHOP-01) - Table of Contents
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                1.0 ADMINISTRATIVE &amp; CAMTS COMPLIANCE
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                2.0 CREW RESOURCE MANAGEMENT (PAVE MATRIX)
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                3.0 WEATHER MINIMA &amp; INADVERTENT IMC (IIMC)
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                4.0 LANDING ZONE (LZ) HIGH/LOW RECONNAISSANCE
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                5.0 FIRST LIMIT INDICATOR (FLI) &amp; ENGINE LIMITS
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                6.0 4-AXIS AFCS &amp; AUTO TRIM PROCEDURES
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                7.0 VIRTUAL INCIDENT REPORTING SYSTEM (VIRS)
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                8.0 GOLDEN HOUR CLINICAL DETERIORATION ENGINE
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
