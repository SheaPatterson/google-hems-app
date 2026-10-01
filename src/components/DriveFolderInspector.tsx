import React, { useState } from 'react';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  ExternalLink,
  Eye,
  RefreshCw,
  Download,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Database,
  ArrowUpRight,
  Plane,
  X,
} from 'lucide-react';
import { DriveFile, DriveFolder, ParsedCsvData } from '../types/hems';
import { fetchFileContent, parseEnergyCsvData } from '../services/driveService';
import { SAMPLE_HEMS_CSV_CONTENT, SAMPLE_HEMS_DOC_CONTENT } from '../data/sampleHemsData';

interface DriveFolderInspectorProps {
  accessToken: string | null;
  activeFolder: DriveFolder | null;
  files: DriveFile[];
  isLoadingFiles: boolean;
  onRefresh: () => void;
  onApplyParsedCsv?: (parsed: ParsedCsvData) => void;
  onFolderChangeRequested: () => void;
}

export const DriveFolderInspector: React.FC<DriveFolderInspectorProps> = ({
  accessToken,
  activeFolder,
  files,
  isLoadingFiles,
  onRefresh,
  onApplyParsedCsv,
  onFolderChangeRequested,
}) => {
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isReadingContent, setIsReadingContent] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [parsedCsv, setParsedCsv] = useState<ParsedCsvData | null>(null);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const handleInspectFile = async (file: DriveFile) => {
    if (!accessToken) return;
    setSelectedFile(file);
    setIsReadingContent(true);
    setReadError(null);
    setFileContent(null);
    setParsedCsv(null);

    try {
      const result = await fetchFileContent(accessToken, file);
      setFileContent(result.text);

      if (
        file.name.endsWith('.csv') ||
        file.mimeType.includes('spreadsheet') ||
        file.mimeType.includes('csv')
      ) {
        const parsed = parseEnergyCsvData(file.name, result.text);
        if (parsed && parsed.timePoints.length > 0) {
          setParsedCsv(parsed);
        }
      }
    } catch (err: any) {
      console.error('Error reading file content:', err);
      setReadError(err?.message || 'Failed to read file from Google Drive');
    } finally {
      setIsReadingContent(false);
    }
  };

  const handleApplyCsv = () => {
    if (parsedCsv && onApplyParsedCsv) {
      onApplyParsedCsv(parsedCsv);
      setAppliedNotification(`Loaded flight telemetry from "${parsedCsv.fileName}" into Cockpit HUD!`);
      setTimeout(() => setAppliedNotification(null), 4000);
    }
  };

  const downloadSampleFile = (type: 'csv' | 'spec') => {
    const filename = type === 'csv' ? 'HEMS_Flight_Telemetry_Log.csv' : 'HEMS_Air_Medical_SOP.md';
    const content = type === 'csv' ? SAMPLE_HEMS_CSV_CONTENT : SAMPLE_HEMS_DOC_CONTENT;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (file: DriveFile) => {
    if (file.name.endsWith('.pln') || file.name.endsWith('.fms') || file.name.endsWith('.gfp')) {
      return <Plane className="h-5 w-5 text-red-400" />;
    }
    if (file.mimeType.includes('spreadsheet') || file.name.endsWith('.csv')) {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
    }
    if (file.mimeType.includes('document') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      return <FileText className="h-5 w-5 text-cyan-400" />;
    }
    if (file.mimeType.includes('json') || file.name.endsWith('.json') || file.name.endsWith('.yaml')) {
      return <FileCode className="h-5 w-5 text-amber-400" />;
    }
    return <File className="h-5 w-5 text-slate-400" />;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-5">
      {/* Folder status banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <Folder className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">
                {activeFolder ? `Drive / ${activeFolder.name}` : "Scanning for 'HENS' Folder..."}
              </h2>
              {activeFolder && (
                <span className="text-[10px] bg-red-500/20 text-red-300 font-semibold px-2 py-0.5 rounded-full border border-red-500/30">
                  Target Matched
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {files.length} file{files.length !== 1 ? 's' : ''} available (Flight plans, dispatch cards, helipad registries)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFolder?.webViewLink && (
            <a
              href={activeFolder.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs rounded-lg border border-slate-700 transition"
            >
              <span>Open in Google Drive</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoadingFiles}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
            <span>Sync HENS Folder</span>
          </button>
        </div>
      </div>

      {/* Applied notification feedback */}
      {appliedNotification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600/60 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{appliedNotification}</span>
          </div>
          <button onClick={() => setAppliedNotification(null)} className="text-slate-400 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Files List */}
      <div>
        {isLoadingFiles ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-red-500" />
            <p className="text-sm">Querying Google Drive files inside '{activeFolder?.name || 'HENS'}'...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="py-8 px-4 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 my-2">
            <AlertCircle className="h-10 w-10 text-amber-400/80 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">No flight files found inside '{activeFolder?.name || 'HENS'}'</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
              Add your MSFS/X-Plane flight plans, HEMS mission cards, or helipad coordinates into this folder in Google Drive. You can also download our template starter files below:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => downloadSampleFile('csv')}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span>Download Sample Flight Log CSV</span>
              </button>
              <button
                onClick={() => downloadSampleFile('spec')}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>Download HEMS SOP / Helipad Template</span>
              </button>
              <button
                onClick={onFolderChangeRequested}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-lg border border-slate-700/60 transition"
              >
                <Folder className="h-3.5 w-3.5" />
                <span>Switch to another Drive folder</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map((file) => (
              <div
                key={file.id}
                className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                  selectedFile?.id === file.id
                    ? 'bg-slate-800/90 border-red-500 shadow-md ring-1 ring-red-500'
                    : 'bg-slate-850/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 bg-slate-900/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                    {getFileIcon(file)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-200 truncate" title={file.name}>
                      {file.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Drive File'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleInspectFile(file)}
                    className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Inspect Briefing</span>
                  </button>

                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-200 p-1"
                      title="Open in Google Drive"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Content Preview */}
      {selectedFile && (
        <div className="mt-4 border border-slate-700/80 bg-slate-950/80 rounded-xl p-4 sm:p-5 relative animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {getFileIcon(selectedFile)}
              <div>
                <h3 className="text-sm font-bold text-slate-200 truncate">{selectedFile.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedFile.mimeType}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {parsedCsv && (
                <button
                  onClick={handleApplyCsv}
                  className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <Plane className="h-3.5 w-3.5" />
                  <span>Load into Cockpit HUD</span>
                </button>
              )}
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            {isReadingContent ? (
              <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-red-500" />
                <span className="text-xs">Streaming file content from Google Drive API...</span>
              </div>
            ) : readError ? (
              <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{readError}</span>
              </div>
            ) : parsedCsv ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Detected Telemetry / Flight Intervals ({parsedCsv.timePoints.length} points)
                  </span>
                  <span>Showing preview rows</span>
                </div>

                <div className="max-h-60 overflow-x-auto overflow-y-auto border border-slate-800 rounded-lg text-xs font-mono">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 sticky top-0 text-slate-300 border-b border-slate-800">
                      <tr>
                        {parsedCsv.headers.map((h: string, i: number) => (
                          <th key={i} className="p-2 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {parsedCsv.rows.slice(0, 15).map((row: Record<string, string | number>, i: number) => (
                        <tr key={i} className="hover:bg-slate-900/50">
                          {parsedCsv.headers.map((h: string, j: number) => (
                            <td key={j} className="p-2 whitespace-nowrap">
                              {String(row[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <pre className="text-xs font-mono text-slate-300 bg-slate-900/90 p-4 rounded-lg border border-slate-800/80 max-h-72 overflow-y-auto whitespace-pre-wrap">
                {fileContent || 'Empty file content.'}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
