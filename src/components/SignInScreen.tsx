import React from 'react';
import {
  Siren,
  FolderSync,
  ShieldCheck,
  Plane,
  HeartPulse,
  Compass,
  HardDrive,
} from 'lucide-react';

interface SignInScreenProps {
  onSignIn: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSignIn,
  isLoading,
  error,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient red/amber lighting for HEMS emergency services */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-red-600/15 via-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Navigation header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Siren className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
              HEMS
            </span>
            <span className="text-xs uppercase tracking-widest font-semibold text-slate-400 ml-2">
              Flight Sim Companion
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Google Drive 'HENS' Read-Only Scope</span>
        </div>
      </header>

      {/* Main hero & sign in section */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium mb-6">
          <Plane className="h-3.5 w-3.5" />
          <span>Microsoft Flight Simulator &bull; X-Plane 11/12 &bull; 'HENS' Drive Sync</span>
        </div>

        {/* Hero headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 max-w-2xl leading-tight">
          Air Ambulance &amp; Rescue Companion Powered by Your{' '}
          <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
            Drive HENS Folder
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-xl">
          Connect your Google Drive to automatically load emergency medical dispatch scenarios, landing zone (LZ) cards, hospital helipad directories, and flight logs directly from your <span className="text-slate-200 font-semibold font-mono">HENS</span> folder into your MSFS or X-Plane cockpit companion.
        </p>

        {/* Official Google Sign-In Button */}
        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={onSignIn}
            disabled={isLoading}
            className="gsi-material-button group relative overflow-hidden bg-white hover:bg-slate-100 text-slate-800 font-semibold px-6 py-3 rounded-xl shadow-xl transition-all duration-200 flex items-center gap-3 border border-slate-200 disabled:opacity-60 cursor-pointer"
          >
            <div className="gsi-material-button-icon shrink-0">
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="w-5 h-5 block"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
            </div>
            <span className="gsi-material-button-contents text-sm tracking-wide text-slate-800">
              {isLoading ? 'Connecting to Google Drive...' : 'Sign in with Google'}
            </span>
          </button>

          {error && (
            <p className="mt-3 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 px-3 py-1.5 rounded-lg max-w-md">
              {error}
            </p>
          )}

          <p className="mt-3 text-[11px] text-slate-500">
            Uses read-only Google Drive permission to locate your HENS checklists and mission files.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="h-9 w-9 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
              <Plane className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-200">Cockpit HUD Telemetry</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Live Radar Altimeter (RADALT), Rotor RPM (NR), dual turbine torque, and winch hoist controls.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <HeartPulse className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-200">Trauma Dispatch &amp; Patient Vitals</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Scene responses, mountain rescues, pediatric transfers, and real-time patient clinical monitoring.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <FolderSync className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-200">Drive 'HENS' Folder Sync</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Read flight plans, dispatch docs, hospital helipad registries, and SOPs from Google Drive.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>HEMS Flight Sim Companion &bull; For Microsoft Flight Simulator &amp; X-Plane &bull; Powered by Google Drive</p>
      </footer>
    </div>
  );
};
