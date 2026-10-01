import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import { db, auth } from './firebaseAuth';
import { FlightSimPlatform, FlightLogEntry, HemsMission } from '../types/hems';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserSettingsDoc {
  userId: string;
  email?: string;
  selectedFolderId?: string;
  selectedFolderName?: string;
  activeSim: FlightSimPlatform;
  selectedAircraftId: string;
  callsign?: string;
  homeBase?: string;
  updatedAt: string;
}

export interface FlightLogDoc {
  id: string;
  userId: string;
  missionCode: string;
  callsign?: string;
  aircraftModel?: string;
  departureLocation?: string;
  destinationLocation?: string;
  flightDurationMin: number;
  patientOutcome?: string;
  completedAt: string;
}

export interface CustomMissionDoc {
  id: string;
  userId: string;
  title: string;
  type: HemsMission['type'];
  priority: HemsMission['priority'];
  destinationHelipad?: string;
  createdAt: string;
}

/**
 * Loads pilot settings from Firestore
 */
export async function fetchUserSettings(userId: string): Promise<UserSettingsDoc | null> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserSettingsDoc;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Saves pilot settings to Firestore
 */
export async function saveUserSettings(settings: UserSettingsDoc): Promise<void> {
  const path = `users/${settings.userId}`;
  try {
    const userDocRef = doc(db, 'users', settings.userId);
    await setDoc(userDocRef, settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Saves completed HEMS flight log into Firestore
 */
export async function saveFlightLog(
  userId: string,
  log: Omit<FlightLogDoc, 'userId'>
): Promise<void> {
  const path = `users/${userId}/flightLogs/${log.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'flightLogs', log.id);
    const payload: FlightLogDoc = {
      ...log,
      userId,
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches recent flight logs
 */
export async function fetchFlightLogs(userId: string): Promise<FlightLogDoc[]> {
  const path = `users/${userId}/flightLogs`;
  try {
    const colRef = collection(db, 'users', userId, 'flightLogs');
    const q = query(colRef, limit(50));
    const snap = await getDocs(q);
    const results: FlightLogDoc[] = [];
    snap.forEach((d) => results.push(d.data() as FlightLogDoc));
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
