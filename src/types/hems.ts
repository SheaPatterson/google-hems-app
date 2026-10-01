export type FlightSimPlatform = 'msfs' | 'xplane' | 'simulated';

export interface FlightPathPoint {
  lat: number;
  lon: number;
  altitudeAgl: number;
  altitudeMsl: number;
  groundspeedKts: number;
  headingDeg: number;
  timestamp: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  description?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface ParsedCsvData {
  fileName: string;
  headers: string[];
  rows: Record<string, string | number>[];
  timePoints: {
    time: string;
    solarKw: number;
    consumptionKw: number;
    batteryKw: number;
    gridKw: number;
    batterySoc?: number;
  }[];
}

export interface HemsAircraft {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  callsign: string;
  maxCruiseKts: number;
  fuelCapacityKg: number;
  mtowKg: number;
  hoistEquipped: boolean;
  avionics: string;
  image?: string;
}

export interface PatientVitals {
  age: number;
  gender: 'Male' | 'Female' | 'Pediatric';
  chiefComplaint: string;
  triage: 'Red (Critical)' | 'Yellow (Urgent)' | 'Green (Stable)';
  heartRate: number; // bpm
  bloodPressure: string; // e.g. "118/76"
  spo2: number; // %
  respRate: number; // rpm
  tempC: number;
  gcs: number; // Glasgow Coma Scale 3-15
  intubated: boolean;
  ventilatorMode?: string;
  ivAccess: string;
  painScale: number; // 0-10
}

export interface LandingZoneInfo {
  name: string;
  type: 'Rooftop Helipad' | 'Ground Pad' | 'Highway Intercept' | 'Confined Clearing' | 'Mountain Ridge' | 'Offshore Vessel';
  elevationFt: number;
  lat: number;
  lon: number;
  dimensions: string; // e.g. "50x50 ft / 15x15 m"
  surface: 'Concrete' | 'Asphalt' | 'Grass' | 'Gravel' | 'Snow / Ice';
  obstacles: string;
  hazards: string;
  recommendedIngress: string; // e.g. "Ingress 240°, avoid cranes east"
  nightLighting: 'Full Perimeter LED' | 'Beacon Only' | 'Vehicular Lights' | 'NVG Required';
}

export interface PaveRiskAssessment {
  pilotScore: number;       // 1-10
  aircraftScore: number;    // 1-10
  environmentScore: number; // 1-10 (METAR, ceilings, terrain)
  externalScore: number;    // 1-10 (pressures, night, trauma severity)
  totalScore: number;       // Sum of all 4
  isNoGo: boolean;          // Mandatory NO-GO if totalScore > 30 per AGENTS.md / REQ-DSP-001
  mitigationNotes?: string;
}

export interface CrewRoster {
  picName: string;
  picCallsign: string;
  flightNurse: string;
  flightParamedic: string;
  dutyHoursRemaining: number;
}

export interface MedicalCondition {
  id: string;
  icdCode: string;
  conditionName: string;
  category: 'Trauma' | 'Cardiac' | 'Neurological' | 'Pediatric' | 'Burn / Specialty';
  baselineGcs: number;
  requiresRsi: boolean;
  deteriorationRatePerMin: number; // lambda decay factor
  recommendedFacilityType: string;
}

export interface HemsBase {
  id: string;
  baseId: string; // e.g. "STAT MedEvac 6" or "LifeFlight 2"
  faaId: string;  // e.g. "KAXQ", "PA67", "KAGC"
  providerName: 'STAT MedEvac' | 'AHN LifeFlight' | 'Regional SAR';
  locationName: string; // e.g. "Clarion County Airport"
  elevationFt: number;
  lat: number;
  lon: number;
  primaryAircraftType: string; // "EC135", "EC145", "H135", "Bell 407"
  tailNumber: string;
}

export interface HemsMission {
  id: string;
  code: string;
  type: 'scene_response' | 'hospital_transfer' | 'alpine_rescue' | 'highway_trauma' | 'pediatric_icu';
  priority: 'Alpha' | 'Bravo' | 'Charlie' | 'Echo';
  title: string;
  description: string;
  departureBase: string;
  destinationHospital: string;
  lz: LandingZoneInfo;
  patient: PatientVitals;
  weatherMetar: string;
  distanceNm: number;
  estEnrouteMin: number;
  hoistRequired: boolean;
  status: 'dispatched' | 'enroute_scene' | 'on_scene' | 'enroute_hospital' | 'cleared';
  createdAt: string;
  paveRisk?: PaveRiskAssessment;
  crew?: CrewRoster;
  conditionId?: string;
  goldenHourElapsedMin?: number;
  decayLambda?: number;
}

export interface HemsHospital {
  id: string;
  name: string;
  city: string;
  state: string;
  helipadIcao: string;
  elevationFt: number;
  traumaLevel: 'Level I Adult/Peds' | 'Level II Trauma' | 'Level III' | 'Burn / Hyperbaric Center' | 'Specialty Pediatric';
  lighting: string;
  lat: number;
  lon: number;
  commsFreq: string;
  approachNotes: string;
  surface?: string;
  placement?: 'Rooftop' | 'Ground' | 'Elevated';
  dimensions?: string;
}

export interface HemsSimTelemetry {
  connected: boolean;
  simPlatform: FlightSimPlatform;
  simBridgeStatus: 'connected' | 'polling' | 'disconnected';
  pitchDeg: number;
  rollDeg: number;
  headingDeg: number;
  altitudeMsl: number;
  altitudeAgl: number; // Radar Altimeter (RADALT)
  airspeedKts: number;
  groundspeedKts: number;
  verticalSpeedFpm: number;
  rotorRpmPct: number; // NR (100% nominal)
  engine1TorquePct: number;
  engine2TorquePct: number;
  tgtDegC: number;
  fuelRemainingKg: number;
  fuelFlowKgHr: number;
  fuelEnduranceMin: number;
  hoistCableFt: number;
  hoistLoadLbs: number;
  hoistState: 'retracted' | 'lowering' | 'attached' | 'reeling_in';
  lat: number;
  lon: number;
  flightPhase: 'preflight' | 'takeoff' | 'enroute' | 'holding' | 'approach' | 'lz_hover' | 'hoisting' | 'landed' | 'shut_down';
  // First Limit Indicator (FLI) parameters per AGENTS.md & ARCHITECTURE.md
  fliValue?: number; // max(%N1, %TOT, %TRQ)
  n1Pct?: number;
  totCelsius?: number;
  gForce?: number;
}

export interface FlightLogEntry {
  id: string;
  missionCode: string;
  callsign: string;
  aircraftModel: string;
  departureLocation: string;
  destinationLocation: string;
  flightDurationMin: number;
  patientOutcome: string;
  completedAt: string;
  maxGForce?: number;
  touchdownVsFpm?: number;
  maxTorquePct?: number;
}

export interface VirsIncidentReport {
  id: string;
  incidentCategory: 'Flight Envelope Exceedance' | 'Inadvertent IMC / WX' | 'Landing Zone Hazard' | 'Near Midair / Drone' | 'Avionics / Mechanical Anomaly';
  date: string;
  missionCode: string;
  aircraftCallsign: string;
  reporterRole: 'Pilot in Command (PIC)' | 'Flight Nurse (PHRN)' | 'Flight Paramedic' | 'Communications Specialist';
  severity: 'Minor Deviation' | 'Moderate Concern' | 'Severe Hazard';
  description: string;
  mitigationOrAction: string;
  submittedAt: string;
}
