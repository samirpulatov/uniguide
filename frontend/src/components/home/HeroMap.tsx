import { CITIES, formatEnumLabel } from '../../constants/enumOptions';
import type { City } from '../../types';

// Rough positions of the NRW university cities in the map's own coordinates
// (longitude/latitude projected onto a 560×460 box), plus where each label sits.
const POS: Record<City, { x: number; y: number; lx: number; ly: number }> = {
  MUNSTER: { x: 294, y: 42, lx: 306, ly: 46 },
  PADERBORN: { x: 485, y: 114, lx: 430, ly: 100 },
  DORTMUND: { x: 267, y: 177, lx: 279, ly: 181 },
  BOCHUM: { x: 224, y: 186, lx: 160, ly: 180 },
  DUSSELDORF: { x: 148, y: 261, lx: 62, ly: 265 },
  COLOGNE: { x: 180, y: 348, lx: 192, ly: 340 },
  BONN: { x: 204, y: 411, lx: 216, ly: 415 },
  AACHEN: { x: 31, y: 396, lx: 10, ly: 424 },
  SIEGEN: { x: 360, y: 369, lx: 376, ly: 374 },
};

// the railway-like network drawn between the cities
const ROUTES: [City, City][] = [
  ['COLOGNE', 'DUSSELDORF'],
  ['DUSSELDORF', 'BOCHUM'],
  ['BOCHUM', 'DORTMUND'],
  ['DORTMUND', 'MUNSTER'],
  ['DORTMUND', 'PADERBORN'],
  ['COLOGNE', 'AACHEN'],
  ['COLOGNE', 'BONN'],
  ['SIEGEN', 'COLOGNE'],
];

// a gentle curve between two cities
function curve(a: City, b: City): string {
  const p = POS[a];
  const q = POS[b];
  const mx = (p.x + q.x) / 2 + (q.y - p.y) * 0.18;
  const my = (p.y + q.y) / 2 - (q.x - p.x) * 0.18;
  return `M${p.x} ${p.y} Q ${mx.toFixed(0)} ${my.toFixed(0)} ${q.x} ${q.y}`;
}

// the dot travels from the user's city to Cologne, then up the Rhine to the Ruhr
function travelPath(home: City): string {
  const tail = ['COLOGNE', 'DUSSELDORF', 'BOCHUM', 'DORTMUND'] as City[];
  const stops = home === 'COLOGNE' ? tail : [home, ...tail.filter((c) => c !== home)];
  return stops
    .slice(1)
    .map((city, i) => {
      const seg = curve(stops[i], city);
      return i === 0 ? seg : seg.replace(/^M\S+ \S+ /, '');
    })
    .join(' ');
}

export function HeroMap({ home }: { home: City | null }) {
  const start = home ?? 'SIEGEN';

  return (
    <svg className="hero-map-svg" viewBox="-20 0 560 460">
      <path
        className="map-land"
        d="M40 120 C 90 40, 220 0, 320 18 C 420 30, 520 60, 530 140 C 540 220, 470 260, 430 330 C 390 420, 260 455, 170 440 C 70 425, 0 400, 10 330 C 18 260, 0 180, 40 120 Z"
      />
      {ROUTES.map(([a, b]) => (
        <path
          key={`${a}-${b}`}
          className={`map-route${a === start || b === start ? ' map-route--hot' : ''}`}
          d={curve(a, b)}
        />
      ))}
      <circle className="map-traveler" r="7">
        <animateMotion dur="7s" repeatCount="indefinite" path={travelPath(start)} />
      </circle>
      {CITIES.filter((c) => c !== start).map((city) => (
        <g key={city}>
          <circle className="map-city" cx={POS[city].x} cy={POS[city].y} r="6" />
          <text className="map-label" x={POS[city].lx} y={POS[city].ly}>
            {city === 'COLOGNE' ? 'Köln' : city === 'DUSSELDORF' ? 'Düsseldorf' : city === 'MUNSTER' ? 'Münster' : formatEnumLabel(city)}
          </text>
        </g>
      ))}
      <circle className="map-home-pulse" cx={POS[start].x} cy={POS[start].y} r="14" />
      <circle className="map-home" cx={POS[start].x} cy={POS[start].y} r="8" />
      <text className="map-home-label" x={POS[start].lx} y={POS[start].ly}>
        {formatEnumLabel(start)}
        {home ? ' · you' : ''}
      </text>
    </svg>
  );
}
