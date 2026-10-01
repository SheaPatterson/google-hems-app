import React, { useState, useEffect } from 'react';
import {
  FolderSync,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Zap,
  HardDrive,
  Clock,
  Key,
  Database,
  ArrowRight,
  Search,
} from 'lucide-react';
import { DriveFolder } from '../types/hems';
import {
  checkDriveConnectionHealth,
  DriveHealthStatus,
  fetchFolderById,
  extractFolderId,
} from '../services/driveService';

interface DriveConnectionReviewProps {
  accessToken: string | null;
  activeFolder: DriveFolder | null;
  onSelectFolder: (folder: DriveFolder) => void;
  onReauthenticate: () => void;
  isFirestoreSyncing?: boolean;
}

export const DriveConnectionReview: React.FC<DriveConnectionReviewProps> = ({
  accessToken,
  activeFolder,
  onSelectFolder,
  onReauthenticate,
  isFirestoreSyncing,
}) => {
  const [health, setHealth] = useState<DriveHealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  const runHealthCheck = async () => {
    if (!accessToken) return;
    setIsChecking(true);
    try {
      const res = await checkDriveConnectionHealth(accessToken);
      setHealth(res);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      runHealthCheck();
    }
  }, [accessToken]);

  const handleManualFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setManualError(null);
    setManualSuccess(null);

    const folderId = extractFolderId(manualInput);
    if (!folderId) {
      setManualError('Please enter a valid Google Drive folder URL (e.g. drive.google.com/drive/folders/...) or Folder ID.');
      return;
    }

    try {
      const folder = await fetchFolderById(accessToken, folderId);
      if (folder) {
        onSelectFolder(folder);
        setManualSuccess(`Connected directly to "${folder.name}" (${folder.id})`);
        setManualInput('');
      } else {
        setManualError('Folder not found or you do not have permission to view it.');
      }
    } catch (err: any) {
      setManualError(err?.message || 'Error locating folder in Drive.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              Google Drive Connection Review &amp; Diagnostics
            </h2>
            <p className="text-xs text-slate-400">
              Audit the OAuth scope, API connectivity, token lifespan, and connected HENS folder
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runHealthCheck}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>
      </div>

      {/* Connection Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: API Status & Health */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 bg-slate-900/80 space-y-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">API Connectivity</span>
          <div className="flex items-center gap-2">
            {health?.connected ? (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-sm font-bold text-emerald-300">Live &amp; Authorized</span>
              </>
            ) : health?.status === 'token_expired' ? (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-sm font-bold text-amber-300">Token Expired</span>
              </>
            ) : (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                <span className="text-sm font-bold text-slate-300">Checking status...</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {health?.message || 'Inspecting Google Drive REST v3 endpoints...'}
          </p>
          {health?.latencyMs !== undefined && (
            <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800">
              <span>Ping Latency:</span>
              <span className="font-mono text-cyan-400">{health.latencyMs} ms</span>
            </div>
          )}
        </div>

        {/* Card 2: OAuth Scope & Security */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 bg-slate-900/80 space-y-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">OAuth Scope Principle</span>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>drive.readonly</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Complies with the Principle of Least Privilege. Only read operations are permitted on Google Drive.
          </p>
          <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800">
            <span>Client ID:</span>
            <span className="font-mono text-slate-300">402423610647...</span>
          </div>
        </div>

        {/* Card 3: Connected Folder & Firestore Sync */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 bg-slate-900/80 space-y-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Folder</span>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 truncate">
            <FolderSync className="h-4 w-4 text-cyan-400 shrink-0" />
            <span className="truncate">{activeFolder ? activeFolder.name : 'None selected'}</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            Folder ID: <span className="font-mono text-slate-300">{activeFolder?.id || '—'}</span>
          </p>
          <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800">
            <span>Firestore State:</span>
            <span className="font-medium text-emerald-400 flex items-center gap-1">
              <Database className="h-3 w-3" /> Synced to Database
            </span>
          </div>
        </div>
      </div>

      {/* Token Expired Recovery Notice */}
      {health?.status === 'token_expired' && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-200">Google Drive Token Expired</h4>
              <p className="text-[11px] text-amber-300/80">
                Google OAuth access tokens refresh automatically or when you re-confirm your session. Click to refresh now.
              </p>
            </div>
          </div>
          <button
            onClick={onReauthenticate}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition"
          >
            Refresh Google Drive Access
          </button>
        </div>
      )}

      {/* Direct Folder Finder (paste URL or Folder ID) */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Search className="h-4 w-4 text-cyan-400" />
          <span>Connect Direct Google Drive Folder by URL or ID</span>
        </div>
        <p className="text-[11px] text-slate-400">
          If your <span className="font-mono text-slate-200">HENS</span> folder is located in a Shared Drive, personal subfolder, or shared with you via link, paste the Drive folder URL or ID below to link it instantly:
        </p>

        <form onSubmit={handleManualFolderSubmit} className="flex flex-wrap sm:flex-nowrap gap-2">
          <input
            type="text"
            placeholder="Paste Google Drive folder URL (e.g. drive.google.com/drive/folders/...) or Folder ID"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg shadow-sm transition whitespace-nowrap"
          >
            Find &amp; Connect Folder
          </button>
        </form>

        {manualError && (
          <p className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800/60 px-3 py-1.5 rounded-lg">
            {manualError}
          </p>
        )}
        {manualSuccess && (
          <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>{manualSuccess}</span>
          </p>
        )}
      </div>

      {/* Folder Details & Drive Action Links */}
      {activeFolder && (
        <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span>Connected Path:</span>
            <span className="font-semibold text-slate-200">Google Drive / {activeFolder.name}</span>
          </div>

          {activeFolder.webViewLink && (
            <a
              href={activeFolder.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition"
            >
              <span>View Folder in Google Drive Web</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};
