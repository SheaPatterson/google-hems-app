import React, { useState } from 'react';
import {
  Hospital,
  MapPin,
  Radio,
  Compass,
  AlertTriangle,
  Search,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { HemsHospital } from '../types/hems';
import { HEMS_HOSPITALS_DIRECTORY } from '../data/sampleHemsData';

interface HospitalHelipadDirectoryProps {
  hospitals?: HemsHospital[];
  onSelectDestination?: (hospital: HemsHospital) => void;
}

export const HospitalHelipadDirectory: React.FC<HospitalHelipadDirectoryProps> = ({
  hospitals = HEMS_HOSPITALS_DIRECTORY,
  onSelectDestination,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.helipadIcao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <Hospital className="h-5 w-5 text-red-500" />
            Trauma Center &amp; Helipad Directory
          </h2>
          <p className="text-xs text-slate-400">
            Designated hospital rooftop &amp; ground helipads, approach frequencies, and flight hazards
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hospital, city, or ICAO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((hospital) => (
          <div
            key={hospital.id}
            className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-3 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{hospital.name}</h3>
                  <p className="text-xs text-slate-400">{hospital.city}, {hospital.state}</p>
                </div>
                <span className="text-xs font-mono font-bold text-red-400 bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded">
                  {hospital.helipadIcao}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Trauma Level</span>
                  <span className="font-bold text-slate-200">{hospital.traumaLevel}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Pad Elevation</span>
                  <span className="font-bold text-slate-200">{hospital.elevationFt} FT MSL</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Placement</span>
                  <span className="font-bold text-cyan-300">{hospital.placement || 'Rooftop'}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Dimensions</span>
                  <span className="font-bold text-slate-200">{hospital.dimensions || '65 x 65 FT'}</span>
                </div>
              </div>

              <div className="mt-2 text-xs space-y-1 text-slate-300">
                <div className="flex items-center gap-1.5 text-cyan-400 font-mono">
                  <Radio className="h-3.5 w-3.5 shrink-0" />
                  <span>{hospital.commsFreq}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  <span className="text-slate-300 font-semibold">Surface:</span> {hospital.surface || 'Concrete'} • <span className="text-slate-300 font-semibold">Approach:</span> {hospital.approachNotes}
                </p>
              </div>
            </div>

            {onSelectDestination && (
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onSelectDestination(hospital)}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                >
                  Set as Receiving Hospital
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
