import React, { useMemo, useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { Marker, Polygon, CircleMarker, Tooltip } from 'react-leaflet';
import MahallaMap from './ui/MahallaMap';
import Card, { CardHeader } from './ui/Card';
import { MapIcon, SearchIcon, CloseIcon, EyeIcon } from './Icons';
import { useSettings } from '../settingsContext';
import { MATERIAL_TYPES } from '../materialTaxonomy';
import { OLMAZOR_MAHALLAS } from '../data/olmazorMahallas';
import {
  useVoronoiCells,
  severityStyle,
  shortName,
  getMahallaZone,
  RISK_ZONES,
  hexToRgb,
} from '../mahallaVoronoi';

function CrimeMapPanel({ materials, lang, onOpenMaterialsList }) {
  const { isDark } = useSettings();
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [zoneFilter, setZoneFilter] = useState('all'); // 'all' | 'red' | 'yellow' | 'green'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'e_material' | 'murojaat'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'warning' | 'overdue' | 'closed'
  const [mapType, setMapType] = useState('carto'); // 'carto' | 'streets' | 'satellite'
  const [viewMode, setViewMode] = useState('zones'); // 'zones' | 'bubbles'
  const [labelMode, setLabelMode] = useState('badges'); // 'badges' | 'simple' | 'none'
  const [focusLocation, setFocusLocation] = useState(null);
  const [resetCounter, setResetCounter] = useState(0);

  const cells = useVoronoiCells();
  const detailsRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bring details card into view on selection if on smaller screens
  useEffect(() => {
    if (selectedId && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId]);

  // Materials indexed by Mahalla ID with active type and status filters applied
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      if (typeFilter !== 'all' && (m.material_type || 'e_material') !== typeFilter) {
        return false;
      }
      if (statusFilter === 'active' && m.status === 'закрыт_в_срок') return false;
      if (statusFilter === 'overdue' && m.status !== 'срок_нарушен') return false;
      if (statusFilter === 'warning' && m.status !== 'срок_приближается') return false;
      if (statusFilter === 'closed' && m.status !== 'закрыт_в_срок') return false;
      return true;
    });
  }, [materials, typeFilter, statusFilter]);

  const byMahalla = useMemo(() => {
    const map = {};
    for (const m of filteredMaterials) {
      if (!m.mahalla) continue;
      (map[m.mahalla] = map[m.mahalla] || []).push(m);
    }
    return map;
  }, [filteredMaterials]);

  // Overall materials per mahalla (unfiltered) for consistent ranking & baseline
  const totalByMahalla = useMemo(() => {
    const map = {};
    for (const m of materials) {
      if (!m.mahalla) continue;
      (map[m.mahalla] = map[m.mahalla] || []).push(m);
    }
    return map;
  }, [materials]);

  const maxCount = useMemo(
    () => Math.max(1, ...OLMAZOR_MAHALLAS.map(m => (byMahalla[m.id] || []).length)),
    [byMahalla]
  );

  // Mahalla analytics & classification
  const mahallaStats = useMemo(() => {
    return OLMAZOR_MAHALLAS.map(m => {
      const list = byMahalla[m.id] || [];
      const totalList = totalByMahalla[m.id] || [];
      const count = list.length;
      const zone = getMahallaZone(count, maxCount);
      return {
        mahalla: m,
        count,
        totalCount: totalList.length,
        materials: list,
        zone,
      };
    }).sort((a, b) => b.count - a.count);
  }, [byMahalla, totalByMahalla, maxCount]);

  // District-wide summary metrics
  const districtMetrics = useMemo(() => {
    const redCount = mahallaStats.filter(s => s.zone.key === 'red').length;
    const yellowCount = mahallaStats.filter(s => s.zone.key === 'yellow').length;
    const greenCount = mahallaStats.filter(s => s.zone.key === 'green').length;
    const hotspot = mahallaStats[0];

    const totalTagged = mahallaStats.reduce((acc, s) => acc + s.count, 0);
    const untagged = filteredMaterials.length - totalTagged;

    return {
      totalMaterials: filteredMaterials.length,
      redCount,
      yellowCount,
      greenCount,
      hotspot,
      untagged,
    };
  }, [mahallaStats, filteredMaterials.length]);

  const selectedStats = useMemo(() => {
    if (!selectedId) return null;
    const stat = mahallaStats.find(s => s.mahalla.id === selectedId);
    if (!stat) return null;
    const rank = mahallaStats.findIndex(s => s.mahalla.id === selectedId) + 1;
    return { ...stat, rank };
  }, [selectedId, mahallaStats]);

  // Autocomplete search suggestions
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return mahallaStats
      .filter(s => {
        const uz = s.mahalla.name_uz.toLowerCase();
        const ru = s.mahalla.name_ru.toLowerCase();
        return uz.includes(q) || ru.includes(q);
      })
      .slice(0, 7);
  }, [searchQuery, mahallaStats]);

  const handleSelectMahalla = (mahallaId) => {
    const found = OLMAZOR_MAHALLAS.find(m => m.id === mahallaId);
    if (!found) return;
    setSelectedId(mahallaId);
    setSearchQuery('');
    setSearchFocused(false);
    setFocusLocation({ lat: found.lat, lon: found.lon, zoom: 15 });
  };

  const handleResetView = () => {
    setSelectedId(null);
    setSearchQuery('');
    setZoneFilter('all');
    setResetCounter(prev => prev + 1);
  };

  const breakdownFor = (list) => MATERIAL_TYPES
    .map(t => ({ ...t, count: list.filter(m => (m.material_type || 'e_material') === t.value).length }))
    .filter(t => t.count > 0);

  // Hover tooltip: modern card with zone indicator, total count, and type breakdown
  const buildTooltip = (mahalla, count, list, zone) => {
    const name = lang === 'ru' ? mahalla.name_ru : mahalla.name_uz;
    const breakdown = breakdownFor(list);
    const activeCount = list.filter(m => m.status !== 'закрыт_в_срок').length;
    const overdueCount = list.filter(m => m.status === 'срок_нарушен').length;

    return (
      <div className="text-xs p-1 min-w-[12rem] font-sans">
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/15">
          <p className="font-bold text-[13px] text-white tracking-wide truncate">{name}</p>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0"
            style={{ backgroundColor: `${zone.color}25`, color: zone.color, border: `1px solid ${zone.color}60` }}
          >
            {lang === 'ru' ? zone.ru : zone.uz}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 my-2 py-1 px-2 rounded-lg bg-white/5 border border-white/10">
          <div>
            <span className="text-[10px] text-slate-400 block">{lang === 'ru' ? 'Всего' : 'Jami'}</span>
            <span className="text-sm font-extrabold text-white">{count}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">{lang === 'ru' ? 'В работе' : 'Ijroda'}</span>
            <span className="text-sm font-bold text-sky-400">{activeCount}</span>
          </div>
        </div>

        {overdueCount > 0 && (
          <div className="mb-2 px-2 py-1 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold flex items-center justify-between">
            <span>{lang === 'ru' ? 'Просрочено:' : 'Muddati o\'tgan:'}</span>
            <span className="font-bold">{overdueCount}</span>
          </div>
        )}

        {breakdown.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-white/10">
            {breakdown.map(b => (
              <div key={b.value} className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="truncate pr-2">{lang === 'ru' ? b.ru : b.uz}</span>
                <span className="font-semibold text-white px-1.5 py-0.2 rounded bg-white/10">{b.count}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 pt-1 text-[10px] text-slate-400 text-center italic border-t border-white/10">
          {lang === 'ru' ? 'Нажмите для подробностей' : 'Batafsil ko\'rish uchun bosing'}
        </div>
      </div>
    );
  };

  const emptyFill = isDark ? [30, 41, 59] : [226, 232, 240];
  const emptyBorder = isDark ? 'rgba(71,85,105,0.7)' : 'rgba(148,163,184,0.7)';
  const highlightBorder = isDark ? '#38bdf8' : '#1d4ed8';

  // Stable Leaflet event handlers
  const cellHandlers = useMemo(() => {
    const map = {};
    cells.forEach(({ mahalla }) => {
      if (map[mahalla.id]) return;
      map[mahalla.id] = {
        mouseover: (e) => {
          setHoveredId(mahalla.id);
          e.target.bringToFront();
        },
        mouseout: () => setHoveredId(null),
        click: () => {
          setSelectedId(prev => (prev === mahalla.id ? null : mahalla.id));
        },
      };
    });
    return map;
  }, [cells]);

  // Leaflet overlay layers (Voronoi polygons, Hotspot bubbles, and labels)
  const overlayLayers = useMemo(() => {
    return (
      <>
        {/* Mode A: Voronoi Polygons */}
        {viewMode === 'zones' && cells.map(({ mahalla, positions, key }) => {
          const list = byMahalla[mahalla.id] || [];
          const count = list.length;
          const isSelected = mahalla.id === selectedId;
          const isHovered = mahalla.id === hoveredId;
          const emphasized = isSelected || isHovered;

          const zone = getMahallaZone(count, maxCount);
          const matchesZoneFilter = zoneFilter === 'all' || zone.key === zoneFilter;
          const matchesSearch = !searchQuery || mahalla.name_uz.toLowerCase().includes(searchQuery.toLowerCase()) || mahalla.name_ru.toLowerCase().includes(searchQuery.toLowerCase());
          const isDimmed = !matchesZoneFilter || (!matchesSearch && searchQuery.length > 0);

          const { fillRgb, baseFillOpacity } = severityStyle(count, maxCount, emptyFill);
          const [r, g, b] = fillRgb;

          const opacity = isDimmed
            ? 0.12
            : (emphasized ? Math.min(0.95, baseFillOpacity + 0.28) : baseFillOpacity);

          const strokeColor = emphasized
            ? highlightBorder
            : (isDimmed ? 'rgba(100,116,139,0.2)' : (count > 0 ? `rgba(${r},${g},${b},0.85)` : emptyBorder));

          return (
            <Polygon
              key={key}
              positions={positions}
              pathOptions={{
                color: strokeColor,
                weight: emphasized ? 3.5 : (count > 0 ? 1.5 : 1),
                fillColor: `rgb(${r},${g},${b})`,
                fillOpacity: opacity,
                opacity: isDimmed ? 0.2 : 1,
              }}
              eventHandlers={cellHandlers[mahalla.id]}
            >
              <Tooltip sticky opacity={1} className="leaflet-tooltip-crime">
                {buildTooltip(mahalla, count, list, zone)}
              </Tooltip>
            </Polygon>
          );
        })}

        {/* Mode B: Hotspot Bubbles with pulsing radial glow */}
        {viewMode === 'bubbles' && OLMAZOR_MAHALLAS.map(mahalla => {
          const list = byMahalla[mahalla.id] || [];
          const count = list.length;
          const isSelected = mahalla.id === selectedId;
          const isHovered = mahalla.id === hoveredId;
          const emphasized = isSelected || isHovered;

          const zone = getMahallaZone(count, maxCount);
          const matchesZoneFilter = zoneFilter === 'all' || zone.key === zoneFilter;
          const isDimmed = !matchesZoneFilter;

          const radius = count === 0
            ? 5
            : Math.max(8, Math.min(32, 8 + Math.round((count / maxCount) * 24)));

          return (
            <React.Fragment key={`bubble_${mahalla.id}`}>
              {/* Outer pulsing ring for high crime hotspots */}
              {zone.key === 'red' && count > 0 && !isDimmed && (
                <CircleMarker
                  center={[mahalla.lat, mahalla.lon]}
                  radius={radius + 8}
                  interactive={false}
                  pathOptions={{
                    color: zone.color,
                    weight: 1.5,
                    fillColor: zone.color,
                    fillOpacity: 0.15,
                    opacity: 0.5,
                  }}
                />
              )}
              <CircleMarker
                center={[mahalla.lat, mahalla.lon]}
                radius={emphasized ? radius + 4 : radius}
                pathOptions={{
                  color: emphasized ? highlightBorder : zone.color,
                  weight: emphasized ? 3 : 2,
                  fillColor: zone.color,
                  fillOpacity: isDimmed ? 0.15 : (count === 0 ? 0.35 : 0.75),
                  opacity: isDimmed ? 0.2 : 1,
                }}
                eventHandlers={{
                  mouseover: () => setHoveredId(mahalla.id),
                  mouseout: () => setHoveredId(null),
                  click: () => setSelectedId(prev => (prev === mahalla.id ? null : mahalla.id)),
                }}
              >
                <Tooltip direction="top" offset={[0, -radius]} opacity={1} className="leaflet-tooltip-crime">
                  {buildTooltip(mahalla, count, list, zone)}
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* Labels & Count Badges */}
        {labelMode !== 'none' && OLMAZOR_MAHALLAS.map(mahalla => {
          const list = byMahalla[mahalla.id] || [];
          const count = list.length;
          const isSelected = mahalla.id === selectedId;
          const zone = getMahallaZone(count, maxCount);
          const label = shortName(lang === 'ru' ? mahalla.name_ru : mahalla.name_uz);

          const matchesZoneFilter = zoneFilter === 'all' || zone.key === zoneFilter;
          if (!matchesZoneFilter && !isSelected) return null;

          let html = '';
          if (labelMode === 'badges') {
            const selectedClass = isSelected ? 'is-selected' : '';
            const zoneClass = `is-${zone.key}`;
            const countClass = `count-${zone.key}`;
            html = `
              <div class="mahalla-badge-pill ${zoneClass} ${selectedClass}">
                <span class="mahalla-badge-count ${countClass}">${count}</span>
                <span class="mahalla-badge-name">${label}</span>
              </div>
            `;
          } else {
            html = `<span class="mahalla-label-text">${label}</span>`;
          }

          const icon = L.divIcon({
            className: 'mahalla-label-marker',
            html,
            iconSize: [0, 0],
          });

          return (
            <Marker
              key={`lbl_${mahalla.id}_${labelMode}_${count}_${isSelected}`}
              position={[mahalla.lat, mahalla.lon]}
              icon={icon}
              interactive={false}
              keyboard={false}
            />
          );
        })}
      </>
    );
  }, [
    cells,
    byMahalla,
    selectedId,
    hoveredId,
    viewMode,
    labelMode,
    zoneFilter,
    searchQuery,
    maxCount,
    lang,
    isDark,
    highlightBorder,
    emptyBorder,
    emptyFill,
    cellHandlers,
  ]);

  return (
    <div className="space-y-4">
      {/* 1. Executive KPI Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* District Total */}
        <div className="bg-gov-surface border border-gov-border rounded-xl p-2.5 sm:p-3 shadow-sm flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gov-primary/10 text-gov-primary flex items-center justify-center shrink-0">
              <MapIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className="text-xs sm:text-[11px] font-semibold sm:font-medium text-gov-muted whitespace-nowrap">
              {lang === 'ru' ? 'Всего материалов' : 'Jami materiallar'}
            </span>
          </div>
          <span className="text-lg sm:text-xl font-extrabold text-gov-text tracking-tight shrink-0 sm:ml-auto">
            {districtMetrics.totalMaterials}
          </span>
        </div>

        {/* Qizil Hududlar (Red Zones) */}
        <button
          type="button"
          onClick={() => setZoneFilter(prev => (prev === 'red' ? 'all' : 'red'))}
          className={`text-left border rounded-xl p-2.5 sm:p-3 shadow-sm transition-all duration-200 flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 min-w-0 ${
            zoneFilter === 'red'
              ? 'bg-red-500/15 border-red-500 ring-2 ring-red-500/30'
              : 'bg-gov-surface border-gov-border hover:border-red-400'
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-red-500 animate-pulse" />
            </div>
            <span className="text-xs sm:text-[11px] font-semibold sm:font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
              {lang === 'ru' ? 'Красная зона' : 'Qizil hudud'}
            </span>
          </div>
          <div className="flex items-baseline gap-1 shrink-0 sm:ml-auto">
            <span className="text-lg sm:text-xl font-extrabold text-gov-text">{districtMetrics.redCount}</span>
            <span className="text-[10px] text-gov-muted whitespace-nowrap">{lang === 'ru' ? 'махалля' : 'mahalla'}</span>
          </div>
        </button>

        {/* Sariq Hududlar (Yellow Zones) */}
        <button
          type="button"
          onClick={() => setZoneFilter(prev => (prev === 'yellow' ? 'all' : 'yellow'))}
          className={`text-left border rounded-xl p-2.5 sm:p-3 shadow-sm transition-all duration-200 flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 min-w-0 ${
            zoneFilter === 'yellow'
              ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-gov-surface border-gov-border hover:border-amber-400'
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-amber-500" />
            </div>
            <span className="text-xs sm:text-[11px] font-semibold sm:font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
              {lang === 'ru' ? 'Жёлтая зона' : 'Sariq hudud'}
            </span>
          </div>
          <div className="flex items-baseline gap-1 shrink-0 sm:ml-auto">
            <span className="text-lg sm:text-xl font-extrabold text-gov-text">{districtMetrics.yellowCount}</span>
            <span className="text-[10px] text-gov-muted whitespace-nowrap">{lang === 'ru' ? 'махалля' : 'mahalla'}</span>
          </div>
        </button>

        {/* Yashil Hududlar (Green Zones) */}
        <button
          type="button"
          onClick={() => setZoneFilter(prev => (prev === 'green' ? 'all' : 'green'))}
          className={`text-left border rounded-xl p-2.5 sm:p-3 shadow-sm transition-all duration-200 flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 min-w-0 ${
            zoneFilter === 'green'
              ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-gov-surface border-gov-border hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-xs sm:text-[11px] font-semibold sm:font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              {lang === 'ru' ? 'Зелёная зона' : 'Yashil hudud'}
            </span>
          </div>
          <div className="flex items-baseline gap-1 shrink-0 sm:ml-auto">
            <span className="text-lg sm:text-xl font-extrabold text-gov-text">{districtMetrics.greenCount}</span>
            <span className="text-[10px] text-gov-muted whitespace-nowrap">{lang === 'ru' ? 'xavfsiz' : 'tinch'}</span>
          </div>
        </button>

        {/* Leading Hotspot */}
        {districtMetrics.hotspot && (
          <button
            type="button"
            onClick={() => handleSelectMahalla(districtMetrics.hotspot.mahalla.id)}
            className="sm:col-span-2 md:col-span-1 bg-gov-surface border border-gov-border hover:border-gov-primary rounded-xl p-2.5 sm:p-3 shadow-sm transition-all duration-200 text-left flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 group min-w-0"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span className="text-xs font-black">#1</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-medium text-gov-muted block whitespace-nowrap">
                  {lang === 'ru' ? 'Главный очаг' : 'Asosiy o\'choq'}
                </span>
                <span className="text-xs font-bold text-gov-text block whitespace-nowrap truncate group-hover:text-gov-primary">
                  {shortName(lang === 'ru' ? districtMetrics.hotspot.mahalla.name_ru : districtMetrics.hotspot.mahalla.name_uz)}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-rose-500 whitespace-nowrap shrink-0 sm:ml-auto">
              {districtMetrics.hotspot.count} {lang === 'ru' ? 'дел' : 'ta ish'}
            </span>
          </button>
        )}
      </div>

      {/* 2. Interactive Search & Multi-Filters Toolbar */}
      <div className="bg-gov-surface border border-gov-border rounded-xl p-3 shadow-sm space-y-2.5">
        {/* Full-width Search Input */}
        <div className="relative w-full" ref={searchContainerRef}>
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gov-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchFocused(true);
              }}
              onFocus={() => setSearchFocused(true)}
              placeholder={lang === 'ru' ? 'Поиск махалли...' : 'Mahalla qidirish...'}
              className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl bg-gov-light border border-gov-border text-gov-text placeholder-gov-muted focus:outline-none focus:ring-2 focus:ring-gov-primary/40 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gov-muted hover:text-gov-text p-1 rounded-full hover:bg-gov-border/40 transition-colors"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-gov-surface border border-gov-border rounded-xl shadow-xl overflow-hidden py-1 max-h-64 overflow-y-auto">
              {searchResults.map(({ mahalla, count, zone }) => (
                <button
                  key={mahalla.id}
                  type="button"
                  onClick={() => handleSelectMahalla(mahalla.id)}
                  className="w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between hover:bg-gov-light transition-colors border-b border-gov-border/40 last:border-0"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${zone.dotClass}`} />
                    <span className="font-semibold text-gov-text truncate">
                      {lang === 'ru' ? mahalla.name_ru : mahalla.name_uz}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-gov-muted font-medium">
                      {count} {lang === 'ru' ? 'дел' : 'ta'}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${zone.bgClass}`}>
                      {lang === 'ru' ? zone.ru : zone.uz}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Multi-Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gov-border/50">
          <div className="flex flex-wrap items-center gap-2">
            {/* Document Type Filter */}
            <div className="flex items-center bg-gov-light p-0.5 rounded-lg border border-gov-border text-xs">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  typeFilter === 'all' ? 'bg-gov-surface text-gov-text shadow-sm' : 'text-gov-muted hover:text-gov-text'
                }`}
              >
                {lang === 'ru' ? 'Все типы' : 'Barchasi'}
              </button>
              {MATERIAL_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTypeFilter(t.value)}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    typeFilter === t.value ? 'bg-gov-surface text-gov-primary font-bold shadow-sm' : 'text-gov-muted hover:text-gov-text'
                  }`}
                >
                  {lang === 'ru' ? t.ru : t.uz}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-gov-light border border-gov-border text-gov-text focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">{lang === 'ru' ? 'Все статусы' : 'Barcha holatlar'}</option>
              <option value="active">{lang === 'ru' ? 'В работе' : 'Ijroda'}</option>
              <option value="overdue">{lang === 'ru' ? 'Просроченные' : 'Muddati o\'tgan'}</option>
              <option value="warning">{lang === 'ru' ? 'Срок приближается' : 'Muddati yaqin'}</option>
              <option value="closed">{lang === 'ru' ? 'Исполнено' : 'Yopilgan'}</option>
            </select>
          </div>

          {/* Reset Filters / Clear Selection */}
          {(zoneFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || selectedId || searchQuery) && (
            <button
              type="button"
              onClick={handleResetView}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gov-light text-gov-danger hover:bg-gov-dangerLight border border-gov-border transition-colors flex items-center gap-1.5 ml-auto"
            >
              <CloseIcon className="h-3 w-3" />
              <span>{lang === 'ru' ? 'Сбросить фильтры' : 'Filtrlarni tozalash'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Map & Analytics Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
        {/* Map Container Column */}
        <div className="lg:col-span-7 xl:col-span-8 w-full min-w-0">
          {/* Integrated Map Controls Header Bar (non-floating, responsive, never overlaps modals) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 mb-2.5 rounded-xl bg-gov-surface border border-gov-border shadow-sm">
            {/* Left: View Mode & Basemap Switchers */}
            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode: Zones vs Bubbles */}
              <div className="flex items-center bg-gov-light p-0.5 rounded-lg border border-gov-border text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('zones')}
                  title={lang === 'ru' ? 'Зонирование (полигоны)' : 'Hududlar (poligonlar)'}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    viewMode === 'zones'
                      ? 'bg-gov-primary text-white shadow-sm'
                      : 'text-gov-muted hover:text-gov-text'
                  }`}
                >
                  {lang === 'ru' ? 'Зоны' : 'Zonalar'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('bubbles')}
                  title={lang === 'ru' ? 'Очаги преступлений (круги)' : 'O\'choqlar (doiralar)'}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    viewMode === 'bubbles'
                      ? 'bg-gov-primary text-white shadow-sm'
                      : 'text-gov-muted hover:text-gov-text'
                  }`}
                >
                  {lang === 'ru' ? 'Очаги' : 'O\'choqlar'}
                </button>
              </div>

              {/* Basemap Switcher */}
              <div className="flex items-center bg-gov-light p-0.5 rounded-lg border border-gov-border text-xs">
                <button
                  type="button"
                  onClick={() => setMapType('carto')}
                  title={lang === 'ru' ? 'Минималистичная карта' : 'Oddiy xarita'}
                  className={`px-2 py-1 rounded-md font-medium transition-all ${
                    mapType === 'carto'
                      ? 'bg-gov-surface text-gov-text font-bold shadow-sm'
                      : 'text-gov-muted hover:text-gov-text'
                  }`}
                >
                  {lang === 'ru' ? 'Карта' : 'Oddiy'}
                </button>
                <button
                  type="button"
                  onClick={() => setMapType('streets')}
                  title={lang === 'ru' ? 'Улицы и дома' : 'Ko\'chalar va binolar'}
                  className={`px-2 py-1 rounded-md font-medium transition-all ${
                    mapType === 'streets'
                      ? 'bg-gov-surface text-gov-text font-bold shadow-sm'
                      : 'text-gov-muted hover:text-gov-text'
                  }`}
                >
                  {lang === 'ru' ? 'Улицы' : 'Ko\'chalar'}
                </button>
                <button
                  type="button"
                  onClick={() => setMapType('satellite')}
                  title={lang === 'ru' ? 'Спутниковые снимки' : 'Sun\'iy yo\'ldosh tasviri'}
                  className={`px-2 py-1 rounded-md font-medium transition-all ${
                    mapType === 'satellite'
                      ? 'bg-gov-surface text-gov-text font-bold shadow-sm'
                      : 'text-gov-muted hover:text-gov-text'
                  }`}
                >
                  {lang === 'ru' ? 'Спутник' : 'Sputnik'}
                </button>
              </div>
            </div>

            {/* Right: Labels Toggle & Reset */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLabelMode(prev => (prev === 'badges' ? 'simple' : (prev === 'simple' ? 'none' : 'badges')))}
                title={lang === 'ru' ? 'Переключить подписи махаллей' : 'Yozuvlarni almashtirish'}
                className="px-2.5 py-1 text-xs font-semibold text-gov-text bg-gov-light hover:bg-gov-border/60 border border-gov-border rounded-lg transition-colors flex items-center gap-1.5"
              >
                <EyeIcon className="h-3.5 w-3.5 text-gov-primary" />
                <span>
                  {labelMode === 'badges'
                    ? (lang === 'ru' ? 'Бейджи' : 'Nishon')
                    : (labelMode === 'simple' ? (lang === 'ru' ? 'Имена' : 'Nomlar') : (lang === 'ru' ? 'Скрыто' : 'Yopiq'))}
                </span>
              </button>

              <button
                type="button"
                onClick={handleResetView}
                title={lang === 'ru' ? 'Вернуть весь район' : 'Butun tumanni ko\'rsatish'}
                className="p-1.5 text-gov-muted hover:text-gov-text bg-gov-light hover:bg-gov-border/60 border border-gov-border rounded-lg transition-colors"
              >
                <MapIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Leaflet Map */}
          <MahallaMap
            height="580px"
            mapType={mapType}
            focusLocation={focusLocation}
            resetTrigger={resetCounter}
            overlayLayers={overlayLayers}
          />

          {/* Bottom Bar: Legend & Untagged note */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 px-1 text-xs text-gov-muted">
            {/* Interactive Zone Legend */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-semibold text-gov-text text-[11px]">
                {lang === 'ru' ? 'Классификация ИИВ:' : 'IIV toifalari:'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[11px]">{lang === 'ru' ? 'Зелёная (0-1 дел)' : 'Yashil (0-1 ish)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-[11px]">{lang === 'ru' ? 'Жёлтая (2-4 дел)' : 'Sariq (2-4 ish)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                  {lang === 'ru' ? 'Красная (5+ дел / очаг)' : 'Qizil (5+ ish / o\'choq)'}
                </span>
              </div>
            </div>

            {districtMetrics.untagged > 0 && (
              <p className="text-[11px] text-gov-muted">
                {lang === 'ru'
                  ? `Без привязки к махалле: ${districtMetrics.untagged}`
                  : `Mahallaga biriktirilmagan: ${districtMetrics.untagged}`}
              </p>
            )}
          </div>
        </div>

        {/* Analytical Side Panel Column */}
        <div className="lg:col-span-5 xl:col-span-4 w-full" ref={detailsRef}>
          <Card className="h-full">
            {/* State A: When No Mahalla is Selected -> District Overview & Hotspots Leaderboard */}
            {!selectedStats ? (
              <div className="space-y-4">
                <div className="border-b border-gov-border pb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-gov-text flex items-center gap-2">
                      <MapIcon className="h-4 w-4 text-gov-primary" />
                      {lang === 'ru' ? 'Рейтинг очагов района' : 'Hududiy o\'choqlar reytingi'}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gov-light text-gov-muted">
                      64 {lang === 'ru' ? 'махалли' : 'mahalla'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gov-muted mt-1">
                    {lang === 'ru'
                      ? 'Топ-махалли по числу зарегистрированных материалов'
                      : 'Ro\'yxatga olingan ishlar bo\'yicha yetakchi mahallalar'}
                  </p>
                </div>

                {/* Top 7 Hotspots Leaderboard */}
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {mahallaStats.slice(0, 7).map(({ mahalla, count, zone }, idx) => {
                    const ratio = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <button
                        key={mahalla.id}
                        type="button"
                        onClick={() => handleSelectMahalla(mahalla.id)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-gov-light transition-all duration-150 border border-transparent hover:border-gov-border group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold ${
                              idx === 0 ? 'bg-rose-500 text-white shadow-sm' : (idx === 1 ? 'bg-amber-500 text-white' : 'bg-gov-light text-gov-muted')
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-xs text-gov-text truncate group-hover:text-gov-primary">
                              {lang === 'ru' ? mahalla.name_ru : mahalla.name_uz}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-gov-text shrink-0">
                            {count} <span className="text-[10px] font-normal text-gov-muted">{lang === 'ru' ? 'дел' : 'ta'}</span>
                          </span>
                        </div>
                        {/* Mini progress ratio bar */}
                        <div className="w-full bg-gov-light h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(6, ratio)}%`,
                              backgroundColor: zone.color,
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Safe Model Mahallas (Zero crimes) */}
                <div className="pt-3 border-t border-gov-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {lang === 'ru' ? 'Спокойные махалли (0 дел)' : 'Namunali tinch mahallalar (0 ta ish)'}
                    </span>
                    <span className="text-[10px] font-bold text-gov-muted">
                      {mahallaStats.filter(s => s.count === 0).length} {lang === 'ru' ? 'махалли' : 'ta'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {mahallaStats.filter(s => s.count === 0).slice(0, 10).map(({ mahalla }) => (
                      <button
                        key={mahalla.id}
                        type="button"
                        onClick={() => handleSelectMahalla(mahalla.id)}
                        className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                      >
                        {shortName(lang === 'ru' ? mahalla.name_ru : mahalla.name_uz)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gov-light/60 border border-gov-border/60 text-center">
                  <p className="text-[11px] text-gov-muted">
                    {lang === 'ru'
                      ? 'Нажмите на любую махаллю на карте или в списке выше для открытия полного досье'
                      : 'Batafsil dosye va ishlarni ko\'rish uchun xaritadagi mahallani tanlang'}
                  </p>
                </div>
              </div>
            ) : (
              /* State B: When a Mahalla IS Selected -> Detailed Analytical Card */
              <div className="space-y-4">
                {/* Header with Back button and Zone Badge */}
                <div className="border-b border-gov-border pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${selectedStats.zone.bgClass}`}>
                      {lang === 'ru' ? selectedStats.zone.ru : selectedStats.zone.uz}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="text-xs font-semibold text-gov-muted hover:text-gov-text transition-colors flex items-center gap-1"
                    >
                      <CloseIcon className="h-3 w-3" />
                      <span>{lang === 'ru' ? 'Закрыть' : 'Yopish'}</span>
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-gov-text tracking-tight">
                    {lang === 'ru' ? selectedStats.mahalla.name_ru : selectedStats.mahalla.name_uz}
                  </h3>
                  <p className="text-[11px] text-gov-muted mt-0.5">
                    {lang === 'ru'
                      ? `Рейтинг в районе: ${selectedStats.rank}-е место из 64`
                      : `Tuman bo'yicha o'rni: 64 tadan ${selectedStats.rank}-o'rinda`}
                  </p>
                </div>

                {/* 4-Stat Metric Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-gov-light/80 border border-gov-border">
                    <span className="text-[10px] font-medium text-gov-muted block">
                      {lang === 'ru' ? 'Всего дел' : 'Jami material'}
                    </span>
                    <span className="text-lg font-extrabold text-gov-text">
                      {selectedStats.count}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                    <span className="text-[10px] font-medium text-sky-600 dark:text-sky-400 block">
                      {lang === 'ru' ? 'В работе' : 'Ijroda'}
                    </span>
                    <span className="text-lg font-extrabold text-sky-600 dark:text-sky-400">
                      {selectedStats.materials.filter(m => m.status !== 'закрыт_в_срок').length}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 block">
                      {lang === 'ru' ? 'Просрочено' : 'Muddati o\'tgan'}
                    </span>
                    <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                      {selectedStats.materials.filter(m => m.status === 'срок_нарушен').length}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 block">
                      {lang === 'ru' ? 'Исполнено' : 'Yopilgan'}
                    </span>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {selectedStats.materials.filter(m => m.status === 'закрыт_в_срок').length}
                    </span>
                  </div>
                </div>

                {/* Breakdown by Material Type */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-gov-text">
                    {lang === 'ru' ? 'По категориям документов' : 'Hujjat turlari bo\'yicha'}:
                  </h5>
                  <div className="space-y-1.5">
                    {MATERIAL_TYPES.map(t => {
                      const typeMaterials = selectedStats.materials.filter(
                        m => (m.material_type || 'e_material') === t.value
                      );
                      return (
                        <button
                          key={t.value}
                          disabled={typeMaterials.length === 0}
                          onClick={() => onOpenMaterialsList(
                            `${lang === 'ru' ? selectedStats.mahalla.name_ru : selectedStats.mahalla.name_uz} — ${lang === 'ru' ? t.ru : t.uz}`,
                            typeMaterials
                          )}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gov-text bg-gov-light hover:bg-gov-light/80 border border-gov-border transition-all disabled:opacity-40 disabled:cursor-default"
                        >
                          <span className="font-semibold">{lang === 'ru' ? t.ru : t.uz}</span>
                          <span className="min-w-[1.5rem] h-5 px-2 rounded-full bg-gov-primary text-white text-[10px] font-extrabold inline-flex items-center justify-center">
                            {typeMaterials.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Cases in this Mahalla */}
                {selectedStats.materials.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gov-border">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-gov-text">
                        {lang === 'ru' ? 'Последние материалы' : 'Oxirgi materiallar'}:
                      </h5>
                      <span className="text-[10px] text-gov-muted">
                        {selectedStats.materials.length} {lang === 'ru' ? 'всего' : 'ta'}
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {selectedStats.materials.slice(0, 4).map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onOpenMaterialsList(
                            `${lang === 'ru' ? selectedStats.mahalla.name_ru : selectedStats.mahalla.name_uz}`,
                            [m]
                          )}
                          className="w-full text-left p-2 rounded-lg bg-gov-light hover:bg-gov-primary/10 transition-colors border border-gov-border/60 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-bold text-gov-primary font-mono text-[11px] truncate">
                              #{m.id}
                            </span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                              m.status === 'закрыт_в_срок' ? 'bg-emerald-500/20 text-emerald-600' : (m.status === 'срок_нарушен' ? 'bg-rose-500/20 text-rose-600' : 'bg-sky-500/20 text-sky-600')
                            }`}>
                              {m.status === 'закрыт_в_срок' ? (lang === 'ru' ? 'Закрыт' : 'Yopilgan') : (m.status === 'срок_нарушен' ? (lang === 'ru' ? 'Просрочен' : 'Muddati o\'tgan') : (lang === 'ru' ? 'В работе' : 'Ijroda'))}
                            </span>
                          </div>
                          <p className="text-gov-text font-medium truncate text-[11px]">{m.citizen_name}</p>
                          {m.preliminary_article && (
                            <p className="text-gov-muted text-[10px] truncate mt-0.5">
                              {m.preliminary_article}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Action Button: Open All Cases for this Mahalla */}
                <button
                  type="button"
                  disabled={selectedStats.materials.length === 0}
                  onClick={() => onOpenMaterialsList(
                    lang === 'ru' ? selectedStats.mahalla.name_ru : selectedStats.mahalla.name_uz,
                    selectedStats.materials
                  )}
                  className="w-full py-2.5 px-3 rounded-xl bg-gov-primary text-white font-bold text-xs shadow-md hover:bg-gov-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <MapIcon className="h-4 w-4" />
                  <span>
                    {lang === 'ru'
                      ? `Открыть все материалы (${selectedStats.materials.length})`
                      : `Barcha materiallarni ochish (${selectedStats.materials.length})`}
                  </span>
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CrimeMapPanel;

