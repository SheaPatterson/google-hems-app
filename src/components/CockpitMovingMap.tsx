import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  Crosshair,
  Compass,
  Maximize2,
  Minimize2,
  Hospital as HospitalIcon,
  Layers,
  ChevronDown,
  Info,
  Radio,
  Clock,
  Gauge,
  AlertTriangle,
  Plane,
  Route,
  RotateCcw,
} from 'lucide-react';
import { HemsAircraft, HemsMission, HemsSimTelemetry, HemsHospital, FlightPathPoint } from '../types/hems';
import { HEMS_HOSPITALS_DIRECTORY } from '../data/sampleHemsData';

interface CockpitMovingMapProps {
  telemetry: HemsSimTelemetry;
  selectedAircraft: HemsAircraft;
  activeMission: HemsMission;
  destinationHospital?: HemsHospital;
  onSelectHospital?: (hospital: HemsHospital) => void;
  flightPathHistory?: FlightPathPoint[];
}

type MapLayerType = 'dark' | 'osm' | 'terrain';

export const CockpitMovingMap: React.FC<CockpitMovingMapProps> = ({
  telemetry,
  selectedAircraft,
  activeMission,
  destinationHospital = HEMS_HOSPITALS_DIRECTORY[0],
  onSelectHospital,
  flightPathHistory,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Markers and layers references
  const heloMarkerRef = useRef<L.Marker | null>(null);
  const lzMarkerRef = useRef<L.Marker | null>(null);
  const lzCircleRef = useRef<L.Circle | null>(null);
  const hospitalMarkerRef = useRef<L.Marker | null>(null);
  const leg1LineRef = useRef<L.Polyline | null>(null);
  const leg2LineRef = useRef<L.Polyline | null>(null);

  // Flight path breadcrumb trail references
  const trailLineRef = useRef<L.Polyline | null>(null);
  const trailGlowLineRef = useRef<L.Polyline | null>(null);
  const breadcrumbDotsGroupRef = useRef<L.LayerGroup | null>(null);

  const [followAircraft, setFollowAircraft] = useState(true);
  const [showBreadcrumbTrail, setShowBreadcrumbTrail] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('dark');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showHospitalMenu, setShowHospitalMenu] = useState(false);

  // Initialize realistic flight path history leading up to the current position
  const [internalHistory, setInternalHistory] = useState<FlightPathPoint[]>(() => {
    const curLat = telemetry.lat;
    const curLon = telemetry.lon;
    const lzLat = activeMission.lz.lat;
    const lzLon = activeMission.lz.lon;

    // Projected departure origin vector
    const startLat = curLat - (lzLat - curLat) * 0.45;
    const startLon = curLon - (lzLon - curLon) * 0.45;

    const initialPoints: FlightPathPoint[] = [];
    const count = 14;
    for (let i = 0; i <= count; i++) {
      const frac = i / count;
      initialPoints.push({
        lat: startLat + (curLat - startLat) * frac,
        lon: startLon + (curLon - startLon) * frac,
        altitudeAgl: Math.round(180 + frac * 240),
        altitudeMsl: Math.round(1350 + frac * 500),
        groundspeedKts: Math.round(85 + frac * 35),
        headingDeg: telemetry.headingDeg,
        timestamp: new Date(Date.now() - (count - i) * 30000).toISOString(),
      });
    }
    return initialPoints;
  });

  // Track live flight path points as telemetry updates
  useEffect(() => {
    setInternalHistory((prev) => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const dist = Math.hypot(telemetry.lat - last.lat, telemetry.lon - last.lon);
        // Deduplicate if position hasn't changed meaningfully (< 5 meters)
        if (dist < 0.00004) return prev;
      }

      const newPoint: FlightPathPoint = {
        lat: telemetry.lat,
        lon: telemetry.lon,
        altitudeAgl: telemetry.altitudeAgl,
        altitudeMsl: telemetry.altitudeMsl,
        groundspeedKts: telemetry.groundspeedKts,
        headingDeg: telemetry.headingDeg,
        timestamp: new Date().toISOString(),
      };

      const updated = [...prev, newPoint];
      // Keep up to 600 breadcrumbs for high performance
      return updated.length > 600 ? updated.slice(updated.length - 600) : updated;
    });
  }, [telemetry.lat, telemetry.lon, telemetry.altitudeAgl, telemetry.groundspeedKts, telemetry.headingDeg]);

  const activeHistory = flightPathHistory && flightPathHistory.length > 0
    ? flightPathHistory
    : internalHistory;

  // Calculation helpers
  const calculateDistanceNm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3440.065; // Nautical miles radius of Earth
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  const calculateBearingDeg = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    return Math.round(((θ * 180) / Math.PI + 360) % 360);
  };

  // Coordinates
  const heloPos: [number, number] = useMemo(() => [telemetry.lat, telemetry.lon], [telemetry.lat, telemetry.lon]);
  const lzPos: [number, number] = useMemo(() => [activeMission.lz.lat, activeMission.lz.lon], [activeMission.lz.lat, activeMission.lz.lon]);
  const hospPos: [number, number] = useMemo(() => [destinationHospital.lat, destinationHospital.lon], [destinationHospital.lat, destinationHospital.lon]);

  const distanceToLzNm = calculateDistanceNm(heloPos[0], heloPos[1], lzPos[0], lzPos[1]);
  const bearingToLzDeg = calculateBearingDeg(heloPos[0], heloPos[1], lzPos[0], lzPos[1]);
  const speed = Math.max(telemetry.groundspeedKts, 40);
  const eteLzMin = Math.round((distanceToLzNm / speed) * 60);

  const distanceToHospNm = calculateDistanceNm(lzPos[0], lzPos[1], hospPos[0], hospPos[1]);
  const bearingToHospDeg = calculateBearingDeg(lzPos[0], lzPos[1], hospPos[0], hospPos[1]);
  const directHeloToHospNm = calculateDistanceNm(heloPos[0], heloPos[1], hospPos[0], hospPos[1]);
  const directHeloToHospDeg = calculateBearingDeg(heloPos[0], heloPos[1], hospPos[0], hospPos[1]);
  const eteHospMin = Math.round((directHeloToHospNm / speed) * 60);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: heloPos,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Tile Layer
    const tileLayer = L.tileLayer(
      activeLayer === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : activeLayer === 'terrain'
        ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        subdomains: activeLayer === 'dark' ? 'abcd' : 'abc',
      }
    ).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Update Tile Layer if activeLayer changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let subdomains = 'abcd';
    if (activeLayer === 'terrain') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      subdomains = 'abc';
    } else if (activeLayer === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      subdomains = 'abc';
    }

    const newTileLayer = L.tileLayer(url, {
      maxZoom: 18,
      subdomains,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
  }, [activeLayer]);

  // Update Markers, Route Polylines, and Follow View
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Custom DivIcons
    const heloIcon = L.divIcon({
      className: 'custom-helo-icon',
      html: `
        <div style="transform: rotate(${telemetry.headingDeg}deg); width: 36px; height: 36px;" class="flex items-center justify-center transition-transform duration-300">
          <div class="h-9 w-9 rounded-full bg-red-600 border-2 border-white shadow-2xl flex items-center justify-center text-white ring-4 ring-red-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L3 21h18L12 2z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const lzIcon = L.divIcon({
      className: 'custom-lz-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-1 rounded-xl bg-amber-400/40 animate-ping"></div>
          <div class="relative h-9 w-9 rounded-xl bg-amber-500 border-2 border-slate-950 shadow-2xl flex flex-col items-center justify-center text-slate-950 font-black leading-none">
            <span class="text-[9px] uppercase tracking-wider">LZ</span>
            <span class="text-[8px] font-mono">SCENE</span>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const hospitalIcon = L.divIcon({
      className: 'custom-hosp-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-1 rounded-full bg-rose-500/30 animate-pulse"></div>
          <div class="relative h-9 w-9 rounded-full bg-rose-600 border-2 border-white shadow-2xl flex flex-col items-center justify-center text-white font-black leading-none">
            <span class="text-xs">H</span>
            <span class="text-[7px] font-mono">${destinationHospital.helipadIcao}</span>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    // Update / Create Helicopter Marker
    if (!heloMarkerRef.current) {
      heloMarkerRef.current = L.marker(heloPos, { icon: heloIcon }).addTo(map);
    } else {
      heloMarkerRef.current.setLatLng(heloPos);
      heloMarkerRef.current.setIcon(heloIcon);
    }
    heloMarkerRef.current.bindTooltip(
      `<div class="p-1 font-mono text-xs">
        <div class="font-bold text-red-600">${selectedAircraft.callsign} (${selectedAircraft.name})</div>
        <div>AGL: <b>${Math.round(telemetry.altitudeAgl)} ft</b> • MSL: <b>${Math.round(telemetry.altitudeMsl)} ft</b></div>
        <div>GS: <b>${Math.round(telemetry.groundspeedKts)} kts</b> • HDG: <b>${Math.round(telemetry.headingDeg)}°</b></div>
      </div>`,
      { permanent: false, direction: 'top' }
    );

    // Update / Create Scene LZ Marker & Terminal Advisory Circle
    if (!lzMarkerRef.current) {
      lzMarkerRef.current = L.marker(lzPos, { icon: lzIcon }).addTo(map);
    } else {
      lzMarkerRef.current.setLatLng(lzPos);
      lzMarkerRef.current.setIcon(lzIcon);
    }
    lzMarkerRef.current.bindTooltip(
      `<div class="p-1 text-xs">
        <div class="font-bold text-amber-500">MISSION LZ: ${activeMission.lz.name}</div>
        <div class="font-mono text-[11px] text-slate-300">
          Coords: <b>${activeMission.lz.lat.toFixed(4)}°N, ${Math.abs(activeMission.lz.lon).toFixed(4)}°W</b>
        </div>
        <div class="text-[11px] text-slate-300">Elev: <b>${activeMission.lz.elevationFt} ft</b> • Type: <b>${activeMission.lz.type}</b></div>
        <div class="text-[10px] text-amber-300/90 mt-0.5">Ingress: ${activeMission.lz.recommendedIngress}</div>
      </div>`,
      { permanent: false, direction: 'bottom' }
    );

    if (!lzCircleRef.current) {
      lzCircleRef.current = L.circle(lzPos, {
        radius: 926, // 0.5 Nautical Miles
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.1,
        weight: 1.5,
        dashArray: '3, 6',
      }).addTo(map);
    } else {
      lzCircleRef.current.setLatLng(lzPos);
    }

    // Update / Create Hospital Helipad Marker
    if (!hospitalMarkerRef.current) {
      hospitalMarkerRef.current = L.marker(hospPos, { icon: hospitalIcon }).addTo(map);
    } else {
      hospitalMarkerRef.current.setLatLng(hospPos);
      hospitalMarkerRef.current.setIcon(hospitalIcon);
    }
    hospitalMarkerRef.current.bindTooltip(
      `<div class="p-1 text-xs">
        <div class="font-bold text-rose-500">${destinationHospital.name}</div>
        <div class="font-mono text-[11px] text-slate-300">
          Helipad: <b>${destinationHospital.helipadIcao}</b> • Coords: <b>${destinationHospital.lat.toFixed(4)}°N, ${Math.abs(destinationHospital.lon).toFixed(4)}°W</b>
        </div>
        <div class="text-[11px] text-slate-300">Trauma: <b>${destinationHospital.traumaLevel}</b> • Elev: <b>${destinationHospital.elevationFt} ft</b></div>
        <div class="text-[10px] text-cyan-300/90 font-mono mt-0.5">Freq: ${destinationHospital.commsFreq}</div>
      </div>`,
      { permanent: false, direction: 'top' }
    );

    // Update Polylines: Leg 1 (Helo -> LZ) and Leg 2 (LZ -> Hospital)
    if (!leg1LineRef.current) {
      leg1LineRef.current = L.polyline([heloPos, lzPos], {
        color: '#f59e0b',
        weight: 3,
        opacity: 0.85,
        dashArray: '4, 8',
      }).addTo(map);
    } else {
      leg1LineRef.current.setLatLngs([heloPos, lzPos]);
    }

    if (!leg2LineRef.current) {
      leg2LineRef.current = L.polyline([lzPos, hospPos], {
        color: '#06b6d4',
        weight: 3,
        opacity: 0.75,
        dashArray: '6, 6',
      }).addTo(map);
    } else {
      leg2LineRef.current.setLatLngs([lzPos, hospPos]);
    }

    // Draw / Update Flight Path Breadcrumb Trail
    const trailCoordinates: [number, number][] = activeHistory.map((p) => [p.lat, p.lon]);
    // Connect to current helicopter position
    if (
      trailCoordinates.length === 0 ||
      trailCoordinates[trailCoordinates.length - 1][0] !== heloPos[0] ||
      trailCoordinates[trailCoordinates.length - 1][1] !== heloPos[1]
    ) {
      trailCoordinates.push(heloPos);
    }

    if (showBreadcrumbTrail && trailCoordinates.length >= 2) {
      // Glow underlay polyline
      if (!trailGlowLineRef.current) {
        trailGlowLineRef.current = L.polyline(trailCoordinates, {
          color: '#10b981',
          weight: 7,
          opacity: 0.25,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      } else {
        trailGlowLineRef.current.setLatLngs(trailCoordinates);
        if (!map.hasLayer(trailGlowLineRef.current)) {
          trailGlowLineRef.current.addTo(map);
        }
      }

      // Crisp solid trail polyline
      if (!trailLineRef.current) {
        trailLineRef.current = L.polyline(trailCoordinates, {
          color: '#10b981',
          weight: 3.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      } else {
        trailLineRef.current.setLatLngs(trailCoordinates);
        if (!map.hasLayer(trailLineRef.current)) {
          trailLineRef.current.addTo(map);
        }
      }

      // Breadcrumb Waypoint Markers
      if (!breadcrumbDotsGroupRef.current) {
        breadcrumbDotsGroupRef.current = L.layerGroup().addTo(map);
      } else {
        breadcrumbDotsGroupRef.current.clearLayers();
        if (!map.hasLayer(breadcrumbDotsGroupRef.current)) {
          breadcrumbDotsGroupRef.current.addTo(map);
        }
      }

      const step = Math.max(1, Math.floor(activeHistory.length / 10));
      activeHistory.forEach((pt, idx) => {
        if (idx % step === 0 && idx < activeHistory.length - 1) {
          const dotIcon = L.divIcon({
            className: 'custom-breadcrumb-dot',
            html: `<div class="h-2 w-2 rounded-full bg-emerald-400 border border-slate-950 shadow-sm transition hover:scale-150"></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4],
          });
          const marker = L.marker([pt.lat, pt.lon], { icon: dotIcon });
          marker.bindTooltip(
            `<div class="p-1 font-mono text-[10px]">
              <div class="font-bold text-emerald-400">Breadcrumb #${idx + 1}</div>
              <div>AGL: <b>${Math.round(pt.altitudeAgl)} ft</b> • GS: <b>${Math.round(pt.groundspeedKts)} kts</b></div>
              <div>Pos: ${pt.lat.toFixed(4)}°N, ${Math.abs(pt.lon).toFixed(4)}°W</div>
            </div>`,
            { permanent: false, direction: 'top' }
          );
          breadcrumbDotsGroupRef.current?.addLayer(marker);
        }
      });
    } else {
      if (trailGlowLineRef.current && map.hasLayer(trailGlowLineRef.current)) {
        map.removeLayer(trailGlowLineRef.current);
      }
      if (trailLineRef.current && map.hasLayer(trailLineRef.current)) {
        map.removeLayer(trailLineRef.current);
      }
      if (breadcrumbDotsGroupRef.current && map.hasLayer(breadcrumbDotsGroupRef.current)) {
        map.removeLayer(breadcrumbDotsGroupRef.current);
      }
    }

    // Follow airframe if enabled
    if (followAircraft) {
      map.panTo(heloPos, { animate: true, duration: 0.5 });
    }
  }, [
    heloPos,
    lzPos,
    hospPos,
    telemetry.headingDeg,
    telemetry.altitudeAgl,
    telemetry.altitudeMsl,
    telemetry.groundspeedKts,
    selectedAircraft.callsign,
    selectedAircraft.name,
    activeMission.lz,
    destinationHospital,
    followAircraft,
    activeHistory,
    showBreadcrumbTrail,
  ]);

  // Invalidate map size on expand/collapse
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const fitAllWaypoints = () => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds([heloPos, lzPos, hospPos]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
    setFollowAircraft(false);
  };

  const centerOnAircraft = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(heloPos, 13, { animate: true });
    setFollowAircraft(true);
  };

  const centerOnMissionScene = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(lzPos, 14, { animate: true });
    setFollowAircraft(false);
  };

  const centerOnTargetHelipad = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(hospPos, 14, { animate: true });
    setFollowAircraft(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 relative overflow-hidden">
      {/* Map Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <Crosshair className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Cockpit Moving Map &amp; Tactical Nav</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded font-semibold">
                GPS FIX 3D
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Live route tracking: {selectedAircraft.callsign} → LZ ({activeMission.lz.name}) → Helipad ({destinationHospital.helipadIcao})
            </p>
          </div>
        </div>

        {/* Map Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Follow Aircraft Toggle */}
          <button
            onClick={centerOnAircraft}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              followAircraft
                ? 'bg-red-600 text-white border-red-500 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
            title="Recenter and follow aircraft"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>Follow Airframe</span>
          </button>

          {/* Quick Jumps */}
          <button
            onClick={centerOnMissionScene}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 text-xs font-semibold rounded-lg transition"
            title="Focus map on incident Scene LZ"
          >
            <MapPin className="h-3.5 w-3.5 text-amber-400" />
            <span>Focus LZ</span>
          </button>

          <button
            onClick={centerOnTargetHelipad}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-semibold rounded-lg transition"
            title="Focus map on destination hospital helipad"
          >
            <HospitalIcon className="h-3.5 w-3.5 text-rose-400" />
            <span>Focus Helipad</span>
          </button>

          {/* Fit Route */}
          <button
            onClick={fitAllWaypoints}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
            title="Fit helicopter, LZ, and receiving helipad in view"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Fit Route</span>
          </button>

          {/* Breadcrumb Trail Line Toggle */}
          <button
            onClick={() => setShowBreadcrumbTrail((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              showBreadcrumbTrail
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
            }`}
            title="Toggle recent flight path breadcrumb trail line"
          >
            <Route className="h-3.5 w-3.5" />
            <span>Flight Trail ({activeHistory.length})</span>
          </button>

          {/* Map Layer Menu */}
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="capitalize">{activeLayer}</span>
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </button>
            {showLayerMenu && (
              <div className="absolute right-0 mt-1.5 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs space-y-0.5">
                <button
                  onClick={() => {
                    setActiveLayer('dark');
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                    activeLayer === 'dark' ? 'bg-red-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Tactical Dark
                </button>
                <button
                  onClick={() => {
                    setActiveLayer('terrain');
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                    activeLayer === 'terrain' ? 'bg-red-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  VFR Topo Map
                </button>
                <button
                  onClick={() => {
                    setActiveLayer('osm');
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                    activeLayer === 'osm' ? 'bg-red-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  OpenStreetMap
                </button>
              </div>
            )}
          </div>

          {/* Expand / Minimize Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 transition"
            title={isExpanded ? 'Collapse Map' : 'Expand Navigation Map'}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Target Coordinates & Navigation Readout Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Airframe Current Position */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5 text-red-400">
              <Plane className="h-3.5 w-3.5" />
              <span>AIRFRAME GPS FIX</span>
            </span>
            <span className="font-mono text-slate-200">{selectedAircraft.callsign}</span>
          </div>
          <div className="font-mono font-bold text-slate-100 text-sm">
            {telemetry.lat.toFixed(4)}°N, {Math.abs(telemetry.lon).toFixed(4)}°W
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>AGL: {Math.round(telemetry.altitudeAgl)} ft</span>
            <span>GS: {Math.round(telemetry.groundspeedKts)} kts</span>
            <span>HDG: {Math.round(telemetry.headingDeg)}°</span>
          </div>
        </div>

        {/* Current Mission Scene Coordinates (LZ) */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-900/40 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-amber-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>MISSION SCENE LZ</span>
            </span>
            <span className="font-mono text-amber-300/80">{activeMission.code}</span>
          </div>
          <div className="font-mono font-bold text-amber-300 text-sm truncate" title={activeMission.lz.name}>
            {activeMission.lz.name}
          </div>
          <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
            <span>
              {activeMission.lz.lat.toFixed(4)}°N, {Math.abs(activeMission.lz.lon).toFixed(4)}°W
            </span>
            <span className="text-amber-400 font-bold">{distanceToLzNm} NM</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
            <span>BRG {bearingToLzDeg}°</span>
            <span>ETE: ~{eteLzMin} MIN</span>
            <span>Elev: {activeMission.lz.elevationFt} ft</span>
          </div>
        </div>

        {/* Target Helipad Coordinates & Hospital Selector */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-rose-900/40 space-y-1 relative">
          <div className="flex items-center justify-between text-[11px] text-rose-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <HospitalIcon className="h-3.5 w-3.5" />
              <span>TARGET HELIPAD</span>
            </span>
            {onSelectHospital && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowHospitalMenu(!showHospitalMenu)}
                  className="text-[10px] text-slate-300 hover:text-white flex items-center gap-0.5 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"
                >
                  <span>Divert / Change</span>
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
                {showHospitalMenu && (
                  <div className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                    <div className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 uppercase tracking-wider">
                      Select Receiving Trauma Helipad
                    </div>
                    {HEMS_HOSPITALS_DIRECTORY.map((hosp) => (
                      <button
                        key={hosp.id}
                        onClick={() => {
                          onSelectHospital(hosp);
                          setShowHospitalMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition ${
                          destinationHospital.id === hosp.id
                            ? 'bg-rose-950/60 border border-rose-700 text-white'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{hosp.name}</span>
                          <span className="text-[10px] font-mono text-rose-400 bg-rose-950 px-1 rounded">
                            {hosp.helipadIcao}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{hosp.city}, {hosp.state} • {hosp.traumaLevel}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="font-mono font-bold text-rose-300 text-sm truncate" title={destinationHospital.name}>
            {destinationHospital.name} ({destinationHospital.helipadIcao})
          </div>
          <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
            <span>
              {destinationHospital.lat.toFixed(4)}°N, {Math.abs(destinationHospital.lon).toFixed(4)}°W
            </span>
            <span className="text-cyan-300 font-bold">{directHeloToHospNm} NM</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
            <span>BRG {directHeloToHospDeg}°</span>
            <span>Freq: {destinationHospital.commsFreq.split(' ')[0]}</span>
            <span>Elev: {destinationHospital.elevationFt} ft</span>
          </div>
        </div>
      </div>

      {/* Leaflet Map Canvas Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800">
        <div
          ref={mapContainerRef}
          style={{ height: isExpanded ? '540px' : '360px' }}
          className="w-full bg-slate-950 transition-all duration-300 z-10"
        />

        {/* Tactical Legend & Ingress Notes Overlay */}
        <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur border border-slate-800/90 rounded-lg p-2.5 text-[11px] space-y-1.5 shadow-xl max-w-xs pointer-events-auto">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
            <span>Flight Nav Legend</span>
            <span className="text-[9px] font-mono text-emerald-400 font-semibold">{activeHistory.length} Trail Pts</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="h-3 w-3 rounded-full bg-red-600 border border-white shrink-0" />
            <span>Airframe ({selectedAircraft.callsign})</span>
          </div>
          {showBreadcrumbTrail && (
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="h-1.5 w-4 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 shrink-0" />
              <span>Flight Trail / Breadcrumbs</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-200">
            <span className="h-3 w-3 rounded bg-amber-500 shrink-0" />
            <span className="truncate">Scene LZ ({activeMission.lz.name.slice(0, 18)}...)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="h-3 w-3 rounded-full bg-rose-600 border border-white shrink-0" />
            <span className="truncate">Target Helipad ({destinationHospital.helipadIcao})</span>
          </div>
          <div className="text-[10px] text-amber-300/80 pt-1 border-t border-slate-800 leading-tight">
            <b>Ingress Advisory:</b> {activeMission.lz.recommendedIngress}
          </div>
        </div>
      </div>
    </div>
  );
};
