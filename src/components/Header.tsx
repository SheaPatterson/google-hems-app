import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Siren,
  FolderSync,
  ExternalLink,
  LogOut,
  RefreshCw,
  Plane,
  ShieldCheck,
  ChevronDown,
  Database,
  Radio,
} from 'lucide-react';
import { DriveFolder, FlightSimPlatform, HemsAircraft } from '../types/hems';

interface HeaderProps {
  user: User | null;
  activeFolder: DriveFolder | null;
  availableFolders: DriveFolder[];
  onSelectFolder: (folder: DriveFolder) => void;
  onRefreshDrive: () => void;
  isSyncing: boolean;
  onSignOut: () => void;
  simPlatform: FlightSimPlatform;
  selectedAircraft: HemsAircraft;
  isFirestoreConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeFolder,
  availableFolders,
  onSelectFolder,
  onRefreshDrive,
  isSyncing,
  onSignOut,
  simPlatform,
  selectedAircraft,
  isFirestoreConnected = true,
}) => {
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Siren className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
                HEMS SimCompanion
              </span>
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-300 bg-red-950/80 border border-red-800/60 px-2 py-0.5 rounded-full">
                {simPlatform.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Helicopter Emergency Medical Services • MSFS &amp; X-Plane
            </p>
          </div>
        </div>

        {/* Center: Drive Folder Connected Badge */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs transition">
            <FolderSync className={`h-4 w-4 ${isSyncing ? 'text-amber-400 animate-spin' : 'text-cyan-400'}`} />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Drive HENS:</span>
              {activeFolder ? (
                <button
                  type="button"
                  onClick={() => setFolderMenuOpen(!folderMenuOpen)}
                  className="font-medium text-cyan-300 flex items-center gap-1 hover:underline focus:outline-none"
                >
                  📁 {activeFolder.name}
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>
              ) : (
                <span className="text-amber-300 font-medium">Scanning Drive for 'HENS'...</span>
              )}
            </div>

            <button
              type="button"
              onClick={onRefreshDrive}
              disabled={isSyncing}
              title="Refresh Drive files"
              className="ml-1 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>

          {/* Folder switch dropdown */}
          {folderMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 z-50 text-xs">
              <div className="font-semibold text-slate-300 px-2 py-1 mb-1 border-b border-slate-800 flex justify-between items-center">
                <span>Select HENS Drive Folder</span>
                <span className="text-[10px] text-slate-400">{availableFolders.length} found</span>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1">
                {availableFolders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelectFolder(f);
                      setFolderMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition ${
                      activeFolder?.id === f.id
                        ? 'bg-red-950/60 text-red-300 font-semibold border border-red-800/40'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">📁 {f.name}</span>
                    {f.name.toUpperCase().includes('HEN') && (
                      <span className="text-[9px] bg-red-500/20 text-red-400 px-1 rounded font-mono">MATCH</span>
                    )}
                  </button>
                ))}
              </div>
              {activeFolder?.webViewLink && (
                <a
                  href={activeFolder.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-center text-slate-400 hover:text-cyan-400 text-[11px] pt-1.5 border-t border-slate-800 flex items-center justify-center gap-1"
                >
                  Open in Google Drive <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right: Callsign & User Auth */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-red-400 font-bold">{selectedAircraft.callsign}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">{selectedAircraft.name.split(' ')[1] || 'H145'}</span>
          </div>

          {/* User profile & Sign Out */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-red-500/50 transition focus:outline-none"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Pilot'}
                    className="h-8 w-8 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-red-400">
                    {user.email?.slice(0, 2).toUpperCase() || 'PL'}
                  </div>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-semibold text-slate-200 truncate">
                      {user.displayName || 'HEMS Pilot'}
                    </p>
                    <p className="text-slate-400 truncate text-[11px]">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-cyan-400">
                      <ShieldCheck className="h-3 w-3" /> Drive HENS Folder Synced
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400">
                      <Database className="h-3 w-3" /> Firestore Pilot Logs Active
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left mt-1 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
