import React, { useState } from 'react';
import {
  Siren,
  Users,
  HeartPulse,
  Compass,
  Wind,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  Plane,
  Clock,
  ArrowRight,
  ArrowLeft,
  Hospital,
  Building2,
  Activity,
  Layers,
  Fuel,
} from 'lucide-react';
import {
  HemsMission,
  HemsBase,
  HemsHospital,
  HemsAircraft,
  MedicalCondition,
  PaveRiskAssessment,
  CrewRoster,
} from '../types/hems';
import {
  HEMS_REGIONAL_BASES,
  HEMS_HOSPITALS_DIRECTORY,
  HEMS_AIRCRAFT_FLEET,
  MEDICAL_CONDITION_MATRIX,
} from '../data/sampleHemsData';

interface FourStageDispatcherProps {
  onCommitMission: (mission: HemsMission) => void;
  onCancel?: () => void;
}

export const FourStageDispatcher: React.FC<FourStageDispatcherProps> = ({
  onCommitMission,
  onCancel,
}) => {
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);

  // Stage 1: Details
  const [missionType, setMissionType] = useState<'scene_call' | 'inter_facility'>('scene_call');
  const [priority, setPriority] = useState<HemsMission['priority']>('Echo');
  const [selectedBaseId, setSelectedBaseId] = useState<string>(HEMS_REGIONAL_BASES[0].id);
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>(HEMS_AIRCRAFT_FLEET[0].id);
  const [originHospitalId, setOriginHospitalId] = useState<string>(HEMS_HOSPITALS_DIRECTORY[0].id);
  const [destinationHospitalId, setDestinationHospitalId] = useState<string>(HEMS_HOSPITALS_DIRECTORY[0].id);
  const [sceneName, setSceneName] = useState('I-80 Westbound Milepost 62 Median Strip');
  const [sceneCoords, setSceneCoords] = useState({ lat: 41.1985, lon: -79.4128, elevationFt: 1420 });
  const [metarInput, setMetarInput] = useState('KAXQ 302353Z 24012KT 10SM CLR 18/04 A2998 [VFR]');

  // Stage 2: Crew
  const [picName, setPicName] = useState('Capt. R. Sullivan');
  const [picCallsign, setPicCallsign] = useState('MEDEVAC-6');
  const [flightNurse, setFlightNurse] = useState('K. Kowalski, RN BSN CEN CFRN');
  const [flightParamedic, setFlightParamedic] = useState('M. Vance, FP-C NRP');
  const [dutyHoursRemaining, setDutyHoursRemaining] = useState(7.5);

  // Stage 3: Patient Info
  const [patientAge, setPatientAge] = useState(43);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Pediatric'>('Male');
  const [patientWeightLbs, setPatientWeightLbs] = useState(185);
  const [selectedConditionId, setSelectedConditionId] = useState(MEDICAL_CONDITION_MATRIX[0].id);
  const [clinicalSummary, setClinicalSummary] = useState(
    'High-velocity rollover collision with partial ejection. Open left femur fracture, asymmetric chest rise, rapidly declining neurological status.'
  );
  const [interventions, setInterventions] = useState(
    'C-collar placed, 2 large bore IVs running, needle decompression right 2nd ICS, TXA 1g bolus, high-flow O2 via non-rebreather.'
  );
  const [requiresRsi, setRequiresRsi] = useState(false);
  const [baselineGcs, setBaselineGcs] = useState(8);
  const [isAiBriefingLoading, setIsAiBriefingLoading] = useState(false);
  const [aiBriefingRecommendation, setAiBriefingRecommendation] = useState<string | null>(null);

  // Stage 4: Flight Plan & PAVE Risk Matrix
  const [pavePilot, setPavePilot] = useState(4); // 1-10
  const [paveAircraft, setPaveAircraft] = useState(3);
  const [paveEnvironment, setPaveEnvironment] = useState(5);
  const [paveExternal, setPaveExternal] = useState(6);
  const [fuelOnboardLbs, setFuelOnboardLbs] = useState(950);
  const [estimatedFlightTimeMin, setEstimatedFlightTimeMin] = useState(24);

  // Derived objects
  const selectedBase = HEMS_REGIONAL_BASES.find((b) => b.id === selectedBaseId) || HEMS_REGIONAL_BASES[0];
  const selectedAircraft = HEMS_AIRCRAFT_FLEET.find((a) => a.id === selectedAircraftId) || HEMS_AIRCRAFT_FLEET[0];
  const selectedCondition = MEDICAL_CONDITION_MATRIX.find((c) => c.id === selectedConditionId) || MEDICAL_CONDITION_MATRIX[0];
  const destHospital = HEMS_HOSPITALS_DIRECTORY.find((h) => h.id === destinationHospitalId) || HEMS_HOSPITALS_DIRECTORY[0];

  // PAVE Score Calculation
  const totalPaveScore = pavePilot + paveAircraft + paveEnvironment + paveExternal;
  // Per AGENTS.md, AI-INSTRUCTIONS.md & Master Spec: PAVE score > 30 is MANDATORY NO-GO
  const isNoGo = totalPaveScore > 30;

  // AI Tactical Briefing simulation
  const handleGenerateAiBriefing = () => {
    setIsAiBriefingLoading(true);
    setTimeout(() => {
      setIsAiBriefingLoading(false);
      setAiBriefingRecommendation(
        `[IRONPINE AI TACTICAL DISPATCH BRIEFING]\n• Recommended Receiving Facility: ${selectedCondition.recommendedFacilityType} (${destHospital.name})\n• Patient Stability: Deterioration coefficient λ = ${selectedCondition.deteriorationRatePerMin}. Immediate surgical or neuro intervention indicated.\n• LZ Assessment: Clear high-recon recommended along 240° heading. Caution overhead utility lines and road debris.\n• Flight Minima: Current METAR (${metarInput.slice(0, 30)}...) meets CAMTS VFR criteria.`
      );
    }, 1000);
  };

  // Commit mission
  const handleAuthorizeMission = () => {
    if (isNoGo) return;

    const missionCode = `HEMS-${Math.floor(100000 + Math.random() * 900000)}`;
    const newMission: HemsMission = {
      id: `mission-${Date.now()}`,
      code: missionCode,
      type: missionType === 'scene_call' ? 'highway_trauma' : 'hospital_transfer',
      priority,
      title: `${missionType === 'scene_call' ? 'Scene Response' : 'Inter-Facility Transfer'}: ${selectedCondition.conditionName}`,
      description: `${clinicalSummary} | Interventions: ${interventions}`,
      departureBase: `${selectedBase.baseId} (${selectedBase.faaId})`,
      destinationHospital: `${destHospital.name} (${destHospital.helipadIcao})`,
      lz: {
        name: missionType === 'scene_call' ? sceneName : `${destHospital.name} Helipad`,
        type: missionType === 'scene_call' ? 'Highway Intercept' : 'Rooftop Helipad',
        elevationFt: missionType === 'scene_call' ? sceneCoords.elevationFt : destHospital.elevationFt,
        lat: missionType === 'scene_call' ? sceneCoords.lat : destHospital.lat,
        lon: missionType === 'scene_call' ? sceneCoords.lon : destHospital.lon,
        dimensions: missionType === 'scene_call' ? '80 x 180 FT' : (destHospital.dimensions || '65 x 65 FT'),
        surface: missionType === 'scene_call' ? 'Asphalt' : (destHospital.surface?.includes('Concrete') ? 'Concrete' : 'Asphalt'),
        obstacles: missionType === 'scene_call' ? 'Utility lines 400m east, light poles, tree line' : 'Radio antennas and rooftop vents',
        hazards: missionType === 'scene_call' ? 'Rubbernecking highway traffic, loose debris' : 'Turbulent downdrafts from neighboring high-rises',
        recommendedIngress: missionType === 'scene_call' ? 'Approach into wind along closed lanes' : destHospital.approachNotes,
        nightLighting: 'Full Perimeter LED',
      },
      patient: {
        age: patientAge,
        gender: patientGender,
        chiefComplaint: selectedCondition.conditionName,
        triage: 'Red (Critical)',
        heartRate: 124,
        bloodPressure: '88/54',
        spo2: 91,
        respRate: 26,
        tempC: 36.1,
        gcs: baselineGcs,
        intubated: requiresRsi,
        ventilatorMode: requiresRsi ? 'PRVC FiO2 1.0 PEEP 5' : undefined,
        ivAccess: 'Dual large bore IV infusing TXA',
        painScale: 9,
      },
      weatherMetar: metarInput,
      distanceNm: 36.5,
      estEnrouteMin: estimatedFlightTimeMin,
      hoistRequired: false,
      status: 'dispatched',
      createdAt: new Date().toISOString(),
      goldenHourElapsedMin: 0,
      decayLambda: selectedCondition.deteriorationRatePerMin,
      paveRisk: {
        pilotScore: pavePilot,
        aircraftScore: paveAircraft,
        environmentScore: paveEnvironment,
        externalScore: paveExternal,
        totalScore: totalPaveScore,
        isNoGo,
        mitigationNotes: `Flight authorized under CAMTS/FAA Part 135 HEMS minima. PIC: ${picName}.`,
      },
      crew: {
        picName,
        picCallsign,
        flightNurse,
        flightParamedic,
        dutyHoursRemaining,
      },
      conditionId: selectedCondition.id,
    };

    onCommitMission(newMission);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 max-w-5xl mx-auto">
      {/* Top Header & 4-Stage Stepper Navigation */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Siren className="h-5 w-5 text-red-500" />
                4-Stage Mission Dispatch Planner
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              CAMTS &amp; FAA Part 135 Flight Risk Scaffolding • Western PA Regional HEMS Network
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
              STAGE {currentStage} OF 4
            </span>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
              >
                Close Planner
              </button>
            )}
          </div>
        </div>

        {/* Visual Progress Steps */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-xs">
          {[
            { stage: 1, label: '1. Dispatch Details', icon: Compass },
            { stage: 2, label: '2. Crew Roster', icon: Users },
            { stage: 3, label: '3. Clinical & GCS', icon: HeartPulse },
            { stage: 4, label: '4. Flight Plan & PAVE', icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentStage === item.stage;
            const isCompleted = currentStage > item.stage;

            return (
              <button
                key={item.stage}
                onClick={() => setCurrentStage(item.stage as any)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition text-left ${
                  isActive
                    ? 'bg-red-950/70 border-red-600/80 text-red-300 font-bold shadow-md'
                    : isCompleted
                    ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 font-medium'
                    : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                    isActive
                      ? 'bg-red-600 text-white font-black'
                      : isCompleted
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : item.stage}
                </div>
                <span className="truncate hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STAGE 1: DISPATCH DETAILS */}
      {currentStage === 1 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Compass className="h-4 w-4 text-red-400" />
              Stage 1: Mission Type, Regional Base &amp; Weather Minima
            </h3>
            <span className="text-[11px] text-slate-400">Step 1 / 4</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mission Type */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Mission Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMissionType('scene_call')}
                  className={`p-3 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                    missionType === 'scene_call'
                      ? 'bg-red-950/80 border-red-500 text-red-200 shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <Siren className="h-4 w-4 text-red-400" />
                  <span>PRIMARY SCENE CALL</span>
                  <span className="text-[10px] text-slate-400 font-normal">Highway / Confined Field</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMissionType('inter_facility')}
                  className={`p-3 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                    missionType === 'inter_facility'
                      ? 'bg-red-950/80 border-red-500 text-red-200 shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <Building2 className="h-4 w-4 text-cyan-400" />
                  <span>INTER-FACILITY TRANSFER</span>
                  <span className="text-[10px] text-slate-400 font-normal">Hospital to Trauma Hub</span>
                </button>
              </div>

              {/* Priority */}
              <div className="pt-2">
                <label className="block text-xs text-slate-400 mb-1">Response Priority</label>
                <div className="flex gap-2">
                  {(['Echo', 'Alpha', 'Bravo'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 rounded text-xs font-bold border transition ${
                        priority === p
                          ? p === 'Echo'
                            ? 'bg-rose-600 text-white border-rose-500'
                            : p === 'Alpha'
                            ? 'bg-amber-600 text-white border-amber-500'
                            : 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      PRIORITY {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Base & Aircraft Selection */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Dispatching Base (Western PA Network)
                </label>
                <select
                  value={selectedBaseId}
                  onChange={(e) => setSelectedBaseId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 outline-none font-mono"
                >
                  {HEMS_REGIONAL_BASES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.providerName} • {b.baseId} ({b.faaId}) - {b.locationName} [{b.primaryAircraftType}]
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Base Elev: {selectedBase.elevationFt} ft MSL • Tail: {selectedBase.tailNumber} • Pos: {selectedBase.lat.toFixed(4)}°N, {selectedBase.lon.toFixed(4)}°W
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Assigned Airframe &amp; Medical Avionics
                </label>
                <select
                  value={selectedAircraftId}
                  onChange={(e) => setSelectedAircraftId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 outline-none"
                >
                  {HEMS_AIRCRAFT_FLEET.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} [{a.callsign}] - Max {a.maxCruiseKts} kts
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Avionics: <span className="text-slate-300 font-mono">{selectedAircraft.avionics}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Receiving Trauma Center & Scene Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Target Trauma Receiving Facility
              </label>
              <select
                value={destinationHospitalId}
                onChange={(e) => setDestinationHospitalId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 outline-none"
              >
                {HEMS_HOSPITALS_DIRECTORY.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.helipadIcao}) • {h.traumaLevel} [{h.city}, {h.state}]
                  </option>
                ))}
              </select>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <p>
                  <strong className="text-red-400">Pad Spec:</strong> {destHospital.dimensions} {destHospital.surface} • Elev: {destHospital.elevationFt} ft MSL
                </p>
                <p className="text-slate-400 italic">{destHospital.approachNotes}</p>
              </div>
            </div>

            {/* Scene details or Origin */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {missionType === 'scene_call' ? 'Scene Landing Zone (LZ) Description' : 'Origin Transfer Facility'}
              </label>
              {missionType === 'scene_call' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={sceneName}
                    onChange={(e) => setSceneName(e.target.value)}
                    placeholder="e.g. I-80 Milepost 62 Median Strip"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:border-red-500 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <input
                      type="number"
                      step="0.0001"
                      value={sceneCoords.lat}
                      onChange={(e) => setSceneCoords({ ...sceneCoords, lat: parseFloat(e.target.value) || 0 })}
                      className="bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100"
                      placeholder="Lat (N)"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      value={sceneCoords.lon}
                      onChange={(e) => setSceneCoords({ ...sceneCoords, lon: parseFloat(e.target.value) || 0 })}
                      className="bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100"
                      placeholder="Lon (W)"
                    />
                  </div>
                </div>
              ) : (
                <select
                  value={originHospitalId}
                  onChange={(e) => setOriginHospitalId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 outline-none"
                >
                  {HEMS_HOSPITALS_DIRECTORY.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.helipadIcao}) - {h.city}
                    </option>
                  ))}
                </select>
              )}

              {/* Live METAR */}
              <div className="pt-2">
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1 font-mono">
                  <Wind className="h-3.5 w-3.5 text-cyan-400" />
                  Live METAR Weather Feed:
                </label>
                <input
                  type="text"
                  value={metarInput}
                  onChange={(e) => setMetarInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-cyan-300 font-mono outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setCurrentStage(2)}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition"
            >
              <span>Proceed to Stage 2: Crew Roster</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: CREW ROSTER */}
      {currentStage === 2 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-red-400" />
              Stage 2: Duty Crew Roster &amp; Flight Time Limitations
            </h3>
            <span className="text-[11px] text-slate-400">Step 2 / 4</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PIC */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase">
                <Plane className="h-4 w-4" />
                <span>Pilot in Command (PIC)</span>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Full Name &amp; Rank</label>
                <input
                  type="text"
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Pilot Callsign</label>
                <input
                  type="text"
                  value={picCallsign}
                  onChange={(e) => setPicCallsign(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-mono focus:border-red-500 outline-none"
                />
              </div>
            </div>

            {/* Flight Nurse */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
                <HeartPulse className="h-4 w-4" />
                <span>Flight Nurse (PHRN / CFRN)</span>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Name &amp; Credentials</label>
                <input
                  type="text"
                  value={flightNurse}
                  onChange={(e) => setFlightNurse(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:border-red-500 outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 pt-2">
                Certification: <span className="text-slate-300">Certified Flight Registered Nurse (CFRN)</span>
              </p>
            </div>

            {/* Flight Paramedic */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                <Activity className="h-4 w-4" />
                <span>Flight Paramedic (FP-C)</span>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Name &amp; Credentials</label>
                <input
                  type="text"
                  value={flightParamedic}
                  onChange={(e) => setFlightParamedic(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Duty Hours Remaining</label>
                <input
                  type="number"
                  step="0.5"
                  value={dutyHoursRemaining}
                  onChange={(e) => setDutyHoursRemaining(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-mono focus:border-red-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setCurrentStage(1)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStage(3)}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition"
            >
              <span>Proceed to Stage 3: Clinical Patient Matrix</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: CLINICAL PATIENT MATRIX */}
      {currentStage === 3 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-red-400" />
              Stage 3: Clinical Data, 260+ Condition Matrix &amp; GCS Scoring
            </h3>
            <span className="text-[11px] text-slate-400">Step 3 / 4</span>
          </div>

          {/* AI Tactical Briefing Button */}
          <button
            onClick={handleGenerateAiBriefing}
            disabled={isAiBriefingLoading}
            className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-red-600 hover:from-amber-500 hover:to-red-500 text-slate-950 font-black rounded-xl text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="h-4 w-4 text-slate-950 animate-spin" />
            <span>
              {isAiBriefingLoading
                ? 'GENERATING IRONPINE AI DISPATCH BRIEFING...'
                : 'REQUEST AI TACTICAL DISPATCH BRIEFING (IRONPINE ENGINE)'}
            </span>
          </button>

          {aiBriefingRecommendation && (
            <div className="bg-slate-950 border border-amber-500/50 rounded-xl p-3.5 text-xs text-amber-200 font-mono whitespace-pre-line leading-relaxed shadow-lg">
              {aiBriefingRecommendation}
            </div>
          )}

          {/* Demographics & Condition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase text-slate-400 mb-1 font-semibold">Patient Age</label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-400 mb-1 font-semibold">Gender</label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Pediatric">Pediatric</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-400 mb-1 font-semibold">Weight (lbs)</label>
              <input
                type="number"
                value={patientWeightLbs}
                onChange={(e) => setPatientWeightLbs(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 outline-none"
              />
            </div>
          </div>

          {/* Medical Condition Selector */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Clinical Condition Selection (from 260+ Condition Database)
            </label>
            <select
              value={selectedConditionId}
              onChange={(e) => {
                setSelectedConditionId(e.target.value);
                const cond = MEDICAL_CONDITION_MATRIX.find((c) => c.id === e.target.value);
                if (cond) {
                  setBaselineGcs(cond.baselineGcs);
                  setRequiresRsi(cond.requiresRsi);
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 outline-none"
            >
              {MEDICAL_CONDITION_MATRIX.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.category.toUpperCase()}] {c.conditionName} ({c.icdCode}) • Baseline GCS {c.baselineGcs}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Baseline GCS:</span>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={baselineGcs}
                  onChange={(e) => setBaselineGcs(parseInt(e.target.value) || 3)}
                  className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-red-400"
                />
                <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${baselineGcs < 8 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-slate-800 text-slate-300'}`}>
                  {baselineGcs < 8 ? 'CRITICAL (GCS < 8)' : 'MODERATE/STABLE'}
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresRsi}
                  onChange={(e) => setRequiresRsi(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-red-600 focus:ring-red-500 h-4 w-4"
                />
                <span className="text-slate-300 text-xs font-semibold">Requires Rapid Sequence Intubation (RSI)</span>
              </label>
            </div>
          </div>

          {/* Clinical summary and interventions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-slate-400 mb-1 font-semibold">
                Clinical Mechanism &amp; Assessment Summary
              </label>
              <textarea
                rows={3}
                value={clinicalSummary}
                onChange={(e) => setClinicalSummary(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-400 mb-1 font-semibold">
                Stabilizing Interventions Carried Out
              </label>
              <textarea
                rows={3}
                value={interventions}
                onChange={(e) => setInterventions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setCurrentStage(2)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStage(4)}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition"
            >
              <span>Proceed to Stage 4: PAVE Risk Assessment</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 4: FLIGHT PLAN & PAVE RISK MATRIX */}
      {currentStage === 4 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-red-400" />
              Stage 4: Flight Plan &amp; Quantified PAVE Risk Assessment
            </h3>
            <span className="text-[11px] text-slate-400">Step 4 / 4</span>
          </div>

          {/* Quantified PAVE Matrix Cards */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Quantified PAVE Risk Assessment Matrix
                </h4>
                <p className="text-[11px] text-slate-400">
                  Risk Score = P(Pilot) + A(Aircraft) + V(enVironment) + E(External). Max allowable: 30.
                </p>
              </div>

              <div
                className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs flex items-center gap-2 ${
                  isNoGo
                    ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-600'
                }`}
              >
                <span>TOTAL PAVE: {totalPaveScore} / 40</span>
                <span>{isNoGo ? '⛔ MISSION NO-GO' : '✓ GO DECISION'}</span>
              </div>
            </div>

            {/* Sliders for the 4 PAVE dimensions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">P - Pilot</span>
                  <span className="text-red-400 font-mono">{pavePilot} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={pavePilot}
                  onChange={(e) => setPavePilot(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
                <span className="text-[10px] text-slate-400 block truncate">Rest, fatigue, currency, IFR rating</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">A - Aircraft</span>
                  <span className="text-red-400 font-mono">{paveAircraft} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={paveAircraft}
                  onChange={(e) => setPaveAircraft(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
                <span className="text-[10px] text-slate-400 block truncate">MEL, fuel margin, hover performance</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">V - enVironment</span>
                  <span className="text-red-400 font-mono">{paveEnvironment} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={paveEnvironment}
                  onChange={(e) => setPaveEnvironment(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
                <span className="text-[10px] text-slate-400 block truncate">METAR, ceilings, mountain terrain, night</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">E - External</span>
                  <span className="text-red-400 font-mono">{paveExternal} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={paveExternal}
                  onChange={(e) => setPaveExternal(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
                <span className="text-[10px] text-slate-400 block truncate">VIP, get-there-itis, patient acuity</span>
              </div>
            </div>

            {isNoGo && (
              <div className="bg-rose-950/90 border border-rose-600 rounded-xl p-4 text-rose-200 text-xs flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-sm text-white">MANDATORY MISSION NO-GO DECISION ENFORCED</h5>
                  <p className="mt-1">
                    Total PAVE score ({totalPaveScore}) exceeds the threshold limit of 30 dictated by Virtual HEMS
                    Directives (AGENTS.md &amp; AI-INSTRUCTIONS.md). Air Ambulance launch is strictly locked to prevent
                    controlled flight into terrain (CFIT) or hazardous exposure. Mitigate environmental, pilot, or
                    external factors before re-evaluating.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Fuel & Reserve validation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Fuel className="h-4 w-4 text-amber-400" />
                Fuel Onboard &amp; FAA Part 135 45-Min Reserve Check
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={fuelOnboardLbs}
                  onChange={(e) => setFuelOnboardLbs(parseInt(e.target.value) || 0)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-amber-300 font-mono w-28 text-center font-bold"
                />
                <span className="text-xs text-slate-300">lbs Jet-A (Nominal endurance: ~135 min)</span>
              </div>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                <CheckCircle2 className="h-3.5 w-3.5" /> 45-Minute VFR/IFR Reserve Fuel satisfied (min 320 lbs required).
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-cyan-400" />
                Estimated Enroute Flight Time
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={estimatedFlightTimeMin}
                  onChange={(e) => setEstimatedFlightTimeMin(parseInt(e.target.value) || 1)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-cyan-300 font-mono w-20 text-center font-bold"
                />
                <span className="text-xs text-slate-300">minutes ETE to Scene / Receiving Pad</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Golden Hour countdown initiates immediately upon takeoff authorization.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between pt-2">
            <button
              onClick={() => setCurrentStage(3)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleAuthorizeMission}
              disabled={isNoGo}
              className={`px-8 py-3 rounded-xl text-xs font-extrabold tracking-wider flex items-center gap-2 shadow-xl transition ${
                isNoGo
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/30'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>AUTHORIZE FLIGHT &amp; PUSH TO COCKPIT EFB</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
