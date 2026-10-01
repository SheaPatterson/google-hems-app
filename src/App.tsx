/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  Siren,
  Plane,
  HeartPulse,
  Hospital,
  BookOpen,
  FolderSync,
  HardDrive,
  Database,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Radio,
  Cpu,
  PlusCircle,
  FileText,
} from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  logout,
} from './services/firebaseAuth';
import {
  searchTargetFolders,
  listAllUserFolders,
  listFilesInFolder,
  fetchFolderById,
} from './services/driveService';
import {
  fetchUserSettings,
  saveUserSettings,
  saveFlightLog,
  fetchFlightLogs,
} from './services/firestoreService';
import {
  DriveFile,
  DriveFolder,
  HemsAircraft,
  HemsSimTelemetry,
  HemsMission,
  HemsHospital,
  FlightSimPlatform,
  FlightLogEntry,
  ParsedCsvData,
  FlightPathPoint,
} from './types/hems';
import {
  HEMS_AIRCRAFT_FLEET,
  INITIAL_SIM_TELEMETRY,
  ACTIVE_HEMS_MISSIONS,
  INITIAL_FLIGHT_LOGS,
  HEMS_HOSPITALS_DIRECTORY,
} from './data/sampleHemsData';
import { Header } from './components/Header';
import { CockpitTelemetryHUD } from './components/CockpitTelemetryHUD';
import { CockpitMovingMap } from './components/CockpitMovingMap';
import { MissionDispatchBoard } from './components/MissionDispatchBoard';
import { HospitalHelipadDirectory } from './components/HospitalHelipadDirectory';
import { PilotLogbook } from './components/PilotLogbook';
import { DriveFolderInspector } from './components/DriveFolderInspector';
import { DriveConnectionReview } from './components/DriveConnectionReview';
import { SignInScreen } from './components/SignInScreen';
import { MissionSummaryReportModal } from './components/MissionSummaryReportModal';
import { FourStageDispatcher } from './components/FourStageDispatcher';
import { InCockpitEFB } from './components/InCockpitEFB';
import { SafetyVirsPortal } from './components/SafetyVirsPortal';
import { SimBridgePortal } from './components/SimBridgePortal';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive state
  const [activeFolder, setActiveFolder] = useState<DriveFolder | null>(null);
  const [availableFolders, setAvailableFolders] = useState<DriveFolder[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // HEMS Flight Sim Core State
  const [selectedAircraft, setSelectedAircraft] = useState<HemsAircraft>(HEMS_AIRCRAFT_FLEET[0]);
  const [simPlatform, setSimPlatform] = useState<FlightSimPlatform>('msfs');
  const [telemetry, setTelemetry] = useState<HemsSimTelemetry>(INITIAL_SIM_TELEMETRY);
  const [missions, setMissions] = useState<HemsMission[]>(ACTIVE_HEMS_MISSIONS);
  const [activeMission, setActiveMission] = useState<HemsMission>(ACTIVE_HEMS_MISSIONS[0]);
  const [flightLogs, setFlightLogs] = useState<FlightLogEntry[]>(INITIAL_FLIGHT_LOGS);

  // Track continuous flight path history for moving map breadcrumbs
  const [flightPathHistory, setFlightPathHistory] = useState<FlightPathPoint[]>(() => {
    const curLat = INITIAL_SIM_TELEMETRY.lat;
    const curLon = INITIAL_SIM_TELEMETRY.lon;
    const lzLat = ACTIVE_HEMS_MISSIONS[0].lz.lat;
    const lzLon = ACTIVE_HEMS_MISSIONS[0].lz.lon;

    // Projected departure origin vector from base to current position
    const startLat = curLat - (lzLat - curLat) * 0.45;
    const startLon = curLon - (lzLon - curLon) * 0.45;

    const initialPoints: FlightPathPoint[] = [];
    const count = 16;
    for (let i = 0; i <= count; i++) {
      const frac = i / count;
      initialPoints.push({
        lat: startLat + (curLat - startLat) * frac,
        lon: startLon + (curLon - startLon) * frac,
        altitudeAgl: Math.round(180 + frac * 240),
        altitudeMsl: Math.round(1350 + frac * 500),
        groundspeedKts: Math.round(85 + frac * 35),
        headingDeg: INITIAL_SIM_TELEMETRY.headingDeg,
        timestamp: new Date(Date.now() - (count - i) * 30000).toISOString(),
      });
    }
    return initialPoints;
  });

  // Active Mission Summary Report modal state
  const [activeReport, setActiveReport] = useState<{
    mission: HemsMission;
    flightLog?: FlightLogEntry;
  } | null>(null);

  // Firestore sync indicator
  const [firestoreToast, setFirestoreToast] = useState<string | null>(null);

  // Active navigation tab
  type ActiveTab = 'hud' | 'dispatch' | 'efb' | 'helipads' | 'sms' | 'bridge' | 'logbook' | 'drive' | 'review';
  const [activeTab, setActiveTab] = useState<ActiveTab>('hud');
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);

  // Commit newly created mission from 4-Stage Dispatcher
  const handleCommitNewMission = (newMission: HemsMission) => {
    setMissions((prev) => [newMission, ...prev]);
    setActiveMission(newMission);
    setIsPlannerOpen(false);
    setActiveTab('hud');
    setFirestoreToast(`Mission ${newMission.code} Authorized & Pushed to EFB`);
    setTimeout(() => setFirestoreToast(null), 4000);
  };

  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Google Sign In
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setAuthError(err?.message || 'Failed to authenticate with Google Drive');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setActiveFolder(null);
      setDriveFiles([]);
      setNeedsAuth(true);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Load Firestore settings on sign in
  const loadFirestorePilotData = useCallback(async (currentUid: string, authToken: string) => {
    try {
      const saved = await fetchUserSettings(currentUid);
      if (saved) {
        if (saved.activeSim) setSimPlatform(saved.activeSim);
        if (saved.selectedAircraftId) {
          const matchedAc = HEMS_AIRCRAFT_FLEET.find((a) => a.id === saved.selectedAircraftId);
          if (matchedAc) setSelectedAircraft(matchedAc);
        }
        if (saved.selectedFolderId) {
          const folder = await fetchFolderById(authToken, saved.selectedFolderId);
          if (folder) {
            setActiveFolder(folder);
            const files = await listFilesInFolder(authToken, folder.id);
            setDriveFiles(files);
            return;
          }
        }
      }

      // Load historic flight logs
      const savedLogs = await fetchFlightLogs(currentUid);
      if (savedLogs.length > 0) {
        setFlightLogs(
          savedLogs.map((sl) => ({
            id: sl.id,
            missionCode: sl.missionCode,
            callsign: sl.callsign || 'MEDEVAC 1',
            aircraftModel: sl.aircraftModel || 'Airbus H145',
            departureLocation: sl.departureLocation || 'Base Helipad',
            destinationLocation: sl.destinationLocation || 'Trauma Center',
            flightDurationMin: sl.flightDurationMin,
            patientOutcome: sl.patientOutcome || 'Transferred to Trauma ICU',
            completedAt: sl.completedAt,
          }))
        );
      }
    } catch (err) {
      console.warn('Could not restore pilot data from Firestore:', err);
    }
  }, []);

  // Search Drive for HENS folder
  const loadDriveFolders = useCallback(async (authToken: string) => {
    setIsLoadingFiles(true);
    try {
      const matched = await searchTargetFolders(authToken);
      const allFolders = await listAllUserFolders(authToken);
      setAvailableFolders(allFolders.length > 0 ? allFolders : matched);

      setActiveFolder((current) => {
        if (current && current.id !== 'hens-drive-placeholder') return current;

        let target = matched.find((f) => f.name.toUpperCase() === 'HENS');
        if (!target) {
          target = matched.find((f) => f.name.toUpperCase().includes('HEN') || f.name.toUpperCase().includes('HEM'));
        }
        if (!target && matched.length > 0) target = matched[0];
        if (!target && allFolders.length > 0) target = allFolders[0];

        if (target) {
          listFilesInFolder(authToken, target.id)
            .then((files) => setDriveFiles(files))
            .catch(console.error);
          return target;
        }

        return { id: 'hens-drive-placeholder', name: 'HENS' };
      });
    } catch (err) {
      console.error('Error querying Drive folders:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  // Sync when token/user ready
  useEffect(() => {
    if (token && user) {
      loadFirestorePilotData(user.uid, token).then(() => {
        loadDriveFolders(token);
      });
    }
  }, [token, user, loadFirestorePilotData, loadDriveFolders]);

  const refreshFolderFiles = useCallback(async () => {
    if (!token || !activeFolder || activeFolder.id === 'hens-drive-placeholder') return;
    setIsLoadingFiles(true);
    try {
      const files = await listFilesInFolder(token, activeFolder.id);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Failed to refresh folder files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [token, activeFolder]);

  // Persist pilot settings to Firestore
  const persistPilotSettings = useCallback(
    async (sim?: FlightSimPlatform, aircraft?: HemsAircraft, folder?: DriveFolder) => {
      if (!user) return;
      const targetFolder = folder || activeFolder;
      const targetAircraft = aircraft || selectedAircraft;
      const targetSim = sim || simPlatform;

      try {
        await saveUserSettings({
          userId: user.uid,
          email: user.email || undefined,
          activeSim: targetSim,
          selectedAircraftId: targetAircraft.id,
          callsign: targetAircraft.callsign,
          selectedFolderId: targetFolder?.id || undefined,
          selectedFolderName: targetFolder?.name || undefined,
          updatedAt: new Date().toISOString(),
        });
        setFirestoreToast('Pilot config saved to Firestore');
        setTimeout(() => setFirestoreToast(null), 3000);
      } catch (err) {
        console.error('Failed to persist pilot settings:', err);
      }
    },
    [user, activeFolder, selectedAircraft, simPlatform]
  );

  const handleSelectFolder = async (folder: DriveFolder) => {
    setActiveFolder(folder);
    persistPilotSettings(undefined, undefined, folder);
    if (!token) return;
    setIsLoadingFiles(true);
    try {
      const files = await listFilesInFolder(token, folder.id);
      setDriveFiles(files);
    } catch (err) {
      console.error('Error loading files for selected folder:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSelectAircraft = (ac: HemsAircraft) => {
    setSelectedAircraft(ac);
    persistPilotSettings(undefined, ac);
  };

  const handleSimPlatformChange = (p: FlightSimPlatform) => {
    setSimPlatform(p);
    setTelemetry((prev) => ({ ...prev, simPlatform: p }));
    persistPilotSettings(p);
  };

  // Toggle Rescue Hoist Cable
  const handleToggleHoist = () => {
    setTelemetry((prev) => {
      const nextPayout = prev.hoistCableFt > 0 ? 0 : 85;
      const nextWeight = nextPayout > 0 ? 185 : 0;
      return {
        ...prev,
        hoistCableFt: nextPayout,
        hoistLoadLbs: nextWeight,
        hoistState: nextPayout > 0 ? 'attached' : 'retracted',
        flightPhase: nextPayout > 0 ? 'hoisting' : 'enroute',
      };
    });
  };

  // Mission progression
  const handleUpdateMissionStatus = (missionId: string, nextStatus: HemsMission['status']) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, status: nextStatus } : m))
    );
    if (activeMission.id === missionId) {
      setActiveMission((prev) => ({ ...prev, status: nextStatus }));
    }
  };

  // Complete mission & log to Firestore & trigger PDF summary report
  const handleCompleteMission = async (mission: HemsMission) => {
    const flightTime = Math.round(mission.estEnrouteMin * 1.15 * 10) / 10;
    const newLog: FlightLogEntry = {
      id: `flog-${Date.now()}`,
      missionCode: mission.code,
      callsign: selectedAircraft.callsign,
      aircraftModel: selectedAircraft.name,
      departureLocation: mission.departureBase,
      destinationLocation: mission.destinationHospital,
      flightDurationMin: flightTime,
      patientOutcome: 'Handover Completed at Trauma Center',
      completedAt: new Date().toISOString(),
    };

    setFlightLogs((prev) => [newLog, ...prev]);
    handleUpdateMissionStatus(mission.id, 'cleared');

    // Automatically prompt and open the printable PDF-style Mission Summary Report!
    setActiveReport({
      mission: { ...mission, status: 'cleared' },
      flightLog: newLog,
    });

    if (user) {
      try {
        await saveFlightLog(user.uid, newLog);
        setFirestoreToast(`Mission ${mission.code} completed & logged to Firestore!`);
        setTimeout(() => setFirestoreToast(null), 4000);
      } catch (err) {
        console.error('Failed to log flight to Firestore:', err);
      }
    }
  };

  // Open Mission Summary Report from historical flight log
  const handleViewReportFromLog = (log: FlightLogEntry) => {
    const matched = missions.find((m) => m.code === log.missionCode);
    const reportMission: HemsMission = matched || {
      id: log.id,
      code: log.missionCode,
      title: `Emergency Sortie ${log.missionCode}: ${log.departureLocation} → ${log.destinationLocation}`,
      type: 'scene_response',
      priority: 'Echo',
      description: `Simulated aeromedical transport from ${log.departureLocation} to ${log.destinationLocation}. Direct patient handover completed by ${log.callsign}.`,
      departureBase: log.departureLocation,
      destinationHospital: log.destinationLocation,
      lz: {
        name: `${log.departureLocation} Incident Scene LZ`,
        type: 'Ground Pad',
        elevationFt: 450,
        lat: telemetry.lat,
        lon: telemetry.lon,
        dimensions: '80x80 FT',
        surface: 'Asphalt',
        obstacles: 'Overhead utility wires 200m north',
        hazards: 'Active air traffic and surface vehicle operations',
        recommendedIngress: 'Standard visual approach corridor',
        nightLighting: 'Full Perimeter LED',
      },
      patient: {
        age: 42,
        gender: 'Male',
        chiefComplaint: 'Acute polytrauma requiring rapid transport to Level 1 Trauma Center',
        triage: 'Red (Critical)',
        heartRate: 118,
        bloodPressure: '110/68',
        spo2: 95,
        respRate: 22,
        tempC: 36.4,
        gcs: 12,
        intubated: false,
        ivAccess: 'Dual 18G peripheral lines, normal saline bolus infusing',
        painScale: 8,
      },
      weatherMetar: 'KBFI 302353Z 26008KT 10SM SCT045 OVC075 14/08 A3002',
      distanceNm: Math.round(log.flightDurationMin * 2.2),
      estEnrouteMin: log.flightDurationMin,
      hoistRequired: false,
      status: 'cleared',
      createdAt: log.completedAt,
    };

    setActiveReport({
      mission: reportMission,
      flightLog: log,
    });
  };

  // Import telemetry from Drive CSV into Cockpit HUD
  const handleApplyParsedCsv = (parsed: ParsedCsvData) => {
    if (parsed.timePoints.length > 0) {
      const latest = parsed.timePoints[parsed.timePoints.length - 1];
      setTelemetry((prev) => ({
        ...prev,
        airspeedKts: latest.solarKw ? Math.min(145, Math.round(latest.solarKw * 18)) : prev.airspeedKts,
        altitudeAgl: latest.consumptionKw ? Math.round(latest.consumptionKw * 150) : prev.altitudeAgl,
      }));
    }
  };

  // Destination trauma hospital lookup
  const targetHospital = HEMS_HOSPITALS_DIRECTORY.find((h) =>
    activeMission.destinationHospital.toLowerCase().includes(h.helipadIcao.toLowerCase()) ||
    activeMission.destinationHospital.toLowerCase().includes(h.name.toLowerCase())
  ) || HEMS_HOSPITALS_DIRECTORY[0];

  const handleSelectHospital = (h: HemsHospital) => {
    setActiveMission((prev) => ({
      ...prev,
      destinationHospital: `${h.name} (${h.helipadIcao})`,
    }));
  };

  // Simulated flight telemetry heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const altJitter = (Math.random() - 0.5) * 8;
        const spdJitter = (Math.random() - 0.5) * 2;
        const hdgJitter = (Math.random() - 0.5) * 0.8;
        const trqJitter = (Math.random() - 0.5) * 1.2;

        let nextLat = prev.lat;
        let nextLon = prev.lon;
        let nextHeading = prev.headingDeg;

        // If in simulated platform, progress aircraft towards the mission LZ
        if (prev.simPlatform === 'simulated' && activeMission?.lz) {
          const dLat = activeMission.lz.lat - prev.lat;
          const dLon = activeMission.lz.lon - prev.lon;
          const dist = Math.sqrt(dLat * dLat + dLon * dLon);
          if (dist > 0.003) {
            const step = 0.0003;
            nextLat = prev.lat + (dLat / dist) * step;
            nextLon = prev.lon + (dLon / dist) * step;
            const targetHdg = ((Math.atan2(dLon, dLat) * 180) / Math.PI + 360) % 360;
            nextHeading = targetHdg;
          }
        }

        const nextAgl = Math.max(0, Math.round(prev.altitudeAgl + altJitter));
        const nextMsl = Math.max(100, Math.round(prev.altitudeMsl + altJitter));
        const nextSpd = Math.max(0, Math.round(prev.airspeedKts + spdJitter));
        const computedHdg = Math.round((nextHeading + hdgJitter + 360) % 360);

        // Record breadcrumb point in flight path history
        setFlightPathHistory((history) => {
          const last = history[history.length - 1];
          if (last) {
            const dist = Math.hypot(nextLat - last.lat, nextLon - last.lon);
            if (dist < 0.00003) return history;
          }
          const newPt: FlightPathPoint = {
            lat: nextLat,
            lon: nextLon,
            altitudeAgl: nextAgl,
            altitudeMsl: nextMsl,
            groundspeedKts: nextSpd,
            headingDeg: computedHdg,
            timestamp: new Date().toISOString(),
          };
          const updated = [...history, newPt];
          return updated.length > 500 ? updated.slice(updated.length - 500) : updated;
        });

        return {
          ...prev,
          lat: nextLat,
          lon: nextLon,
          altitudeMsl: nextMsl,
          altitudeAgl: nextAgl,
          airspeedKts: nextSpd,
          headingDeg: computedHdg,
          engine1TorquePct: Math.min(98, Math.max(20, Number((prev.engine1TorquePct + trqJitter).toFixed(1)))),
          engine2TorquePct: Math.min(98, Math.max(20, Number((prev.engine2TorquePct + trqJitter).toFixed(1)))),
          fuelRemainingKg: Math.max(50, prev.fuelRemainingKg - 0.15),
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [activeMission]);

  if (needsAuth) {
    return (
      <SignInScreen
        onSignIn={handleSignIn}
        isLoading={isSigningIn}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* App Header */}
      <Header
        user={user}
        activeFolder={activeFolder}
        availableFolders={availableFolders}
        onSelectFolder={handleSelectFolder}
        onRefreshDrive={refreshFolderFiles}
        isSyncing={isLoadingFiles}
        onSignOut={handleSignOut}
        simPlatform={simPlatform}
        selectedAircraft={selectedAircraft}
        isFirestoreConnected={true}
      />

      {/* Navigation Sub-bar */}
      <nav className="border-b border-slate-800 bg-slate-900/60 sticky top-[61px] z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('hud')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'hud'
                  ? 'bg-slate-800 text-red-400 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Plane className="h-3.5 w-3.5" />
              <span>Cockpit HUD &amp; Moving Map</span>
            </button>

            <button
              onClick={() => setActiveTab('dispatch')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'dispatch'
                  ? 'bg-slate-800 text-red-400 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Siren className="h-3.5 w-3.5 text-red-500" />
              <span>4-Stage Dispatcher</span>
            </button>

            <button
              onClick={() => setActiveTab('efb')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'efb'
                  ? 'bg-slate-800 text-rose-400 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
              <span>Cockpit EFB &amp; Vitals</span>
            </button>

            <button
              onClick={() => setActiveTab('helipads')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'helipads'
                  ? 'bg-slate-800 text-red-400 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Hospital className="h-3.5 w-3.5" />
              <span>Trauma Helipads &amp; LZs</span>
            </button>

            <button
              onClick={() => setActiveTab('sms')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'sms'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>SMS &amp; VIRS Safety</span>
            </button>

            <button
              onClick={() => setActiveTab('bridge')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'bridge'
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <span>Sim Bridge (Port 8080)</span>
            </button>

            <button
              onClick={() => setActiveTab('logbook')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'logbook'
                  ? 'bg-slate-800 text-red-400 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Pilot Logbook ({flightLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('drive')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition relative ${
                activeTab === 'drive'
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FolderSync className="h-3.5 w-3.5" />
              <span>Drive 'HENS' Files ({driveFiles.length})</span>
              {driveFiles.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
            </button>

            <button
              onClick={() => setActiveTab('review')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'review'
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span>Drive Health &amp; Review</span>
            </button>
          </div>

          {firestoreToast && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full animate-pulse">
              <Database className="h-3 w-3" />
              <span>{firestoreToast}</span>
            </div>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        {activeTab === 'hud' && (
          <div className="space-y-6">
            <CockpitTelemetryHUD
              telemetry={telemetry}
              selectedAircraft={selectedAircraft}
              onSelectAircraft={handleSelectAircraft}
              onSimPlatformChange={handleSimPlatformChange}
              onToggleHoist={handleToggleHoist}
            />

            {/* Tactical Moving Map Display */}
            <CockpitMovingMap
              telemetry={telemetry}
              selectedAircraft={selectedAircraft}
              activeMission={activeMission}
              destinationHospital={targetHospital}
              onSelectHospital={handleSelectHospital}
              flightPathHistory={flightPathHistory}
            />

            {/* Quick dispatch callout */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Siren className="h-5 w-5 text-red-500 animate-pulse shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    <span>Active Incident:</span>
                    <span className="text-red-400 font-mono">{activeMission.code}</span>
                    <span>• {activeMission.title}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Patient: {activeMission.patient.age} y/o {activeMission.patient.gender} • Triage: {activeMission.patient.triage} • Enroute: {activeMission.estEnrouteMin} min
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCompleteMission(activeMission)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  title="Handover patient and generate PDF Mission Summary Report"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Complete Flight &amp; PDF Report</span>
                </button>

                <button
                  onClick={() => setActiveTab('dispatch')}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1"
                >
                  <span>Dispatch Board</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dispatch' && (
          <div className="space-y-6">
            {/* 4-Stage Dispatch Planner Toggle Banner */}
            <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border border-red-700/60 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Siren className="h-4 w-4 text-red-500" />
                    Interactive 4-Stage Mission Dispatch Planner
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Step 1 (Details &amp; WX) ➔ Step 2 (Crew Roster) ➔ Step 3 (260+ Condition Matrix) ➔ Step 4 (PAVE Risk &amp; EFB Push)
                </p>
              </div>

              <button
                onClick={() => setIsPlannerOpen(!isPlannerOpen)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{isPlannerOpen ? 'Close 4-Stage Planner' : 'Launch 4-Stage Dispatch Planner'}</span>
              </button>
            </div>

            {isPlannerOpen && (
              <FourStageDispatcher
                onCommitMission={handleCommitNewMission}
                onCancel={() => setIsPlannerOpen(false)}
              />
            )}

            <MissionDispatchBoard
              missions={missions}
              activeMission={activeMission}
              onSelectMission={setActiveMission}
              onUpdateMissionStatus={handleUpdateMissionStatus}
              onCompleteMission={handleCompleteMission}
              onBrowseDriveMissions={() => setActiveTab('drive')}
              onPreviewReport={(m) => setActiveReport({ mission: m })}
            />
          </div>
        )}

        {activeTab === 'efb' && (
          <InCockpitEFB
            activeMission={activeMission}
            telemetry={telemetry}
            onUpdateMissionStatus={(s) => handleUpdateMissionStatus(activeMission.id, s)}
          />
        )}

        {activeTab === 'sms' && (
          <SafetyVirsPortal selectedAircraft={selectedAircraft} />
        )}

        {activeTab === 'bridge' && (
          <SimBridgePortal
            telemetry={telemetry}
            simPlatform={simPlatform}
            onSelectPlatform={handleSimPlatformChange}
          />
        )}

        {activeTab === 'helipads' && (
          <HospitalHelipadDirectory
            onSelectDestination={(h) => {
              setActiveMission((prev) => ({
                ...prev,
                destinationHospital: `${h.name} (${h.helipadIcao})`,
              }));
              setActiveTab('dispatch');
            }}
          />
        )}

        {activeTab === 'logbook' && (
          <PilotLogbook
            logs={flightLogs}
            callsign={selectedAircraft.callsign}
            onViewReport={handleViewReportFromLog}
          />
        )}

        {activeTab === 'drive' && (
          <DriveFolderInspector
            accessToken={token}
            activeFolder={activeFolder}
            files={driveFiles}
            isLoadingFiles={isLoadingFiles}
            onRefresh={refreshFolderFiles}
            onApplyParsedCsv={handleApplyParsedCsv}
            onFolderChangeRequested={() => setActiveTab('review')}
          />
        )}

        {activeTab === 'review' && (
          <DriveConnectionReview
            accessToken={token}
            activeFolder={activeFolder}
            onSelectFolder={handleSelectFolder}
            onReauthenticate={handleSignIn}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>HEMS Flight Sim Companion &bull; Microsoft Flight Simulator &amp; X-Plane &bull; Connected to Drive 'HENS'</p>
      </footer>

      {/* Printable PDF-Style Mission Summary Report Modal */}
      {activeReport && (
        <MissionSummaryReportModal
          mission={activeReport.mission}
          flightLog={activeReport.flightLog}
          aircraft={selectedAircraft}
          telemetry={telemetry}
          onClose={() => setActiveReport(null)}
        />
      )}
    </div>
  );
}
