import { DriveFile, DriveFolder, ParsedCsvData } from '../types/hems';

export interface DriveHealthStatus {
  connected: boolean;
  status: 'active' | 'token_expired' | 'error';
  userEmail?: string;
  userName?: string;
  latencyMs?: number;
  message: string;
}

/**
 * Extracts a Google Drive Folder ID from a URL or raw ID string.
 */
export function extractFolderId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Match /folders/<folderId> or ?id=<folderId>
  const urlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch && urlMatch[1]) return urlMatch[1];

  const paramMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (paramMatch && paramMatch[1]) return paramMatch[1];

  // If looks like an ID directly (alphanumeric, underscores, hyphens, 15+ chars)
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Validates Google Drive connection health, token freshness, and latency.
 */
export async function checkDriveConnectionHealth(accessToken: string): Promise<DriveHealthStatus> {
  const start = performance.now();
  try {
    const url = 'https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)';
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const latencyMs = Math.round(performance.now() - start);

    if (res.status === 401) {
      return {
        connected: false,
        status: 'token_expired',
        latencyMs,
        message: 'Google Drive authorization token has expired. Please re-authenticate.',
      };
    }

    if (!res.ok) {
      const errText = await res.text();
      return {
        connected: false,
        status: 'error',
        latencyMs,
        message: `Drive API returned status ${res.status}: ${errText.slice(0, 100)}`,
      };
    }

    const data = await res.json();
    return {
      connected: true,
      status: 'active',
      userEmail: data.user?.emailAddress,
      userName: data.user?.displayName,
      latencyMs,
      message: 'Google Drive API connection verified and active.',
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 'error',
      message: err?.message || 'Network error connecting to Google Drive API',
    };
  }
}

/**
 * Fetches a single folder by its exact Google Drive ID.
 */
export async function fetchFolderById(
  accessToken: string,
  folderId: string
): Promise<DriveFolder | null> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,modifiedTime,webViewLink&supportsAllDrives=true`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      modifiedTime: data.modifiedTime,
      webViewLink: data.webViewLink,
    };
  } catch (err) {
    console.error('Error fetching folder by ID:', err);
    return null;
  }
}

/**
 * Searches user's Google Drive for folders matching 'HENS' or 'HEMS'.
 * Supports shared drives and all parent drives.
 */
export async function searchTargetFolders(accessToken: string): Promise<DriveFolder[]> {
  try {
    const query = encodeURIComponent(
      "mimeType='application/vnd.google-apps.folder' and (name = 'HENS' or name = 'hens' or name = 'HEMS' or name = 'hems' or name contains 'HENS' or name contains 'HEMS' or name contains 'hen') and trashed = false"
    );
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Failed to query specific folder:', res.status, errText);
      return [];
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink,
    }));
  } catch (err) {
    console.error('Error searching folders in Drive:', err);
    return [];
  }
}

/**
 * Lists available folders in user's root or shared drive so the user can easily select one.
 */
export async function listAllUserFolders(accessToken: string): Promise<DriveFolder[]> {
  try {
    const query = encodeURIComponent(
      "mimeType='application/vnd.google-apps.folder' and trashed = false"
    );
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=name asc&pageSize=50&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink,
    }));
  } catch (err) {
    console.error('Error listing all folders:', err);
    return [];
  }
}

/**
 * Lists all files inside a specific Google Drive folder.
 */
export async function listFilesInFolder(
  accessToken: string,
  folderId: string
): Promise<DriveFile[]> {
  try {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,webContentLink,iconLink,description)&orderBy=modifiedTime desc&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 401) {
      throw new Error('TOKEN_EXPIRED: Your Google Drive access token has expired. Please re-authenticate.');
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Drive API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Error listing files in folder:', err);
    throw err;
  }
}

/**
 * Downloads or exports the content of a file from Google Drive.
 */
export async function fetchFileContent(
  accessToken: string,
  file: DriveFile
): Promise<{ text: string; isBinary: boolean; previewUrl?: string }> {
  const isGoogleDoc = file.mimeType === 'application/vnd.google-apps.document';
  const isGoogleSheet = file.mimeType === 'application/vnd.google-apps.spreadsheet';
  const isTextLike =
    file.mimeType.startsWith('text/') ||
    file.mimeType.includes('json') ||
    file.mimeType.includes('csv') ||
    file.mimeType.includes('javascript') ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.csv') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.log') ||
    file.name.endsWith('.yaml') ||
    file.name.endsWith('.yml');

  if (isGoogleDoc) {
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
    const res = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Could not export Google Doc (${res.status})`);
    const text = await res.text();
    return { text, isBinary: false };
  }

  if (isGoogleSheet) {
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
    const res = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Could not export Google Sheet as CSV (${res.status})`);
    const text = await res.text();
    return { text, isBinary: false };
  }

  if (isTextLike) {
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`;
    const res = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Could not fetch file content (${res.status})`);
    const text = await res.text();
    return { text, isBinary: false };
  }

  // Binary file (PDF, Image, etc.)
  return {
    text: `Binary file format [${file.mimeType}]. Click "Open in Google Drive" to view full document.`,
    isBinary: true,
    previewUrl: file.webViewLink,
  };
}

/**
 * Intelligent parser for energy data CSVs found in the HENS folder.
 */
export function parseEnergyCsvData(fileName: string, csvText: string): ParsedCsvData | null {
  try {
    const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return null;

    const rawHeaders = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
    const lowerHeaders = rawHeaders.map((h) => h.toLowerCase());

    // Map candidate columns
    const timeIdx = lowerHeaders.findIndex((h) =>
      h.includes('time') || h.includes('hour') || h.includes('timestamp') || h.includes('date')
    );
    const solarIdx = lowerHeaders.findIndex((h) =>
      h.includes('solar') || h.includes('pv') || h.includes('generation') || h.includes('gen_kw')
    );
    const consumptionIdx = lowerHeaders.findIndex((h) =>
      h.includes('load') || h.includes('consumption') || h.includes('home') || h.includes('demand') || h.includes('use')
    );
    const batteryIdx = lowerHeaders.findIndex((h) =>
      h.includes('battery') || h.includes('storage') || h.includes('batt_kw') || h.includes('bess')
    );
    const gridIdx = lowerHeaders.findIndex((h) =>
      h.includes('grid') || h.includes('import') || h.includes('meter')
    );
    const socIdx = lowerHeaders.findIndex((h) =>
      h.includes('soc') || (h.includes('battery') && h.includes('%')) || h.includes('state of charge')
    );

    const rows: Record<string, string | number>[] = [];
    const timePoints: ParsedCsvData['timePoints'] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.replace(/^["']|["']$/g, '').trim());
      if (parts.length === 0 || !parts[0]) continue;

      const rowObj: Record<string, string | number> = {};
      rawHeaders.forEach((header, idx) => {
        const val = parts[idx];
        const num = Number(val);
        rowObj[header] = !isNaN(num) && val !== '' ? num : val;
      });
      rows.push(rowObj);

      // Extract time series point
      const timeStr = timeIdx !== -1 && parts[timeIdx] ? parts[timeIdx] : `${i}:00`;
      const solarVal = solarIdx !== -1 ? Math.max(0, Number(parts[solarIdx]) || 0) : 0;
      const consVal = consumptionIdx !== -1 ? Math.max(0, Number(parts[consumptionIdx]) || 0) : 0;
      const battVal = batteryIdx !== -1 ? Number(parts[batteryIdx]) || 0 : 0;
      const gridVal = gridIdx !== -1 ? Number(parts[gridIdx]) || 0 : 0;
      const socVal = socIdx !== -1 ? Number(parts[socIdx]) || undefined : undefined;

      timePoints.push({
        time: timeStr.length > 16 ? timeStr.slice(11, 16) : timeStr,
        solarKw: Number(solarVal.toFixed(2)),
        consumptionKw: Number(consVal.toFixed(2)),
        batteryKw: Number(battVal.toFixed(2)),
        gridKw: Number(gridVal.toFixed(2)),
        batterySoc: socVal !== undefined ? Math.min(100, Math.max(0, Math.round(socVal))) : undefined,
      });
    }

    return {
      fileName,
      headers: rawHeaders,
      rows,
      timePoints,
    };
  } catch (err) {
    console.error('Failed to parse CSV:', err);
    return null;
  }
}
