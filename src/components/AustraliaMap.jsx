import React, { useState, useEffect } from 'react';

// Pemetaan Nama State dari GeoJSON ke Key Data
const nameToKey = {
    'New South Wales':    'NSW',
    'Victoria':           'VIC',
    'Queensland':         'QLD',
    'South Australia':    'SA',
    'Western Australia':  'WA',
    'Tasmania':           'TAS',
    'Northern Territory': 'NT',
    'Australian Capital Territory': 'ACT',
};

function makeProjection(features, width, height, padding = 15) {
    let minLon = Infinity, maxLon = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    const eachCoord = (coords) => {
        if (typeof coords[0] === 'number') {
            const [lon, lat] = coords;
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
        } else {
            coords.forEach(eachCoord);
        }
    };

    features.forEach(f => {
        const geom = f.geometry;
        if (geom.type === 'Polygon') eachCoord(geom.coordinates);
        else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(p => eachCoord(p));
    });

    const scaleX = (width  - padding * 2) / (maxLon - minLon);
    const scaleY = (height - padding * 2) / (maxLat - minLat);
    const scale  = Math.min(scaleX, scaleY);

    return ([lon, lat]) => [
        padding + (lon - minLon) * scale + (width - padding * 2 - (maxLon - minLon) * scale) / 2,
        height - padding - (lat - minLat) * scale - (height - padding * 2 - (maxLat - minLat) * scale) / 2,
    ];
}

function ringToPath(ring, project) {
    return ring.map((coord, i) => {
        const [x, y] = project(coord);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ') + ' Z';
}

function featureToPath(feature, project) {
    const geom = feature.geometry;
    const parts = [];
    if (geom.type === 'Polygon') {
        geom.coordinates.forEach(ring => parts.push(ringToPath(ring, project)));
    } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach(polygon => polygon.forEach(ring => parts.push(ringToPath(ring, project))));
    }
    return parts.join(' ');
}

function ringCentroid(ring, project) {
    let area = 0, cx = 0, cy = 0;
    const pts = ring.map(project);
    for (let i = 0, n = pts.length; i < n; i++) {
        const j = (i + 1) % n;
        const cross = pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
        area += cross;
        cx += (pts[i][0] + pts[j][0]) * cross;
        cy += (pts[i][1] + pts[j][1]) * cross;
    }
    area /= 2;
    return area === 0 ? [0, 0] : [cx / (6 * area), cy / (6 * area)];
}

function getCentroid(feature, project) {
    const geom = feature.geometry;
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    let best = [0, 0], maxArea = -1;
    polys.forEach(p => {
        const center = ringCentroid(p[0], project);
        if (p[0].length > maxArea) { best = center; maxArea = p[0].length; }
    });
    return best;
}

const W = 600, H = 500;

export default function AustraliaMap({ data, colorScale, unit = '', title }) {
    const [geo, setGeo] = useState(null);
    const [hovered, setHovered] = useState(null);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });

    useEffect(() => {
        fetch('/australian-states.min.geojson').then(r => r.json()).then(setGeo);
    }, []);

    if (!geo) return <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Memuat peta…</div>;

    const project = makeProjection(geo.features, W, H);

    return (
        <div style={{ width: '100%', maxWidth: '550px', margin: '0 auto', position: 'relative' }}>
            {title && (
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: '#3d2b2b', marginBottom: 12, textAlign: 'center' }}>
                    {title}
                </h3>
            )}

            <svg 
                viewBox={`0 0 ${W} ${H}`} 
                style={{ width: '100%', height: 'auto', overflow: 'visible' }} 
                onMouseLeave={() => setHovered(null)}
            >
                {geo.features.map((feature) => {
                    const stateFullName = feature.properties.STATE_NAME;
                    const key = nameToKey[stateFullName];
                    const val = data[key];
                    const fill = val !== undefined ? colorScale(val) : '#f0f0f0';
                    const isHov = hovered === key;
                    const [cx, cy] = getCentroid(feature, project);

                    return (
                        <g 
                            key={feature.id} 
                            onMouseMove={e => {
                                const rect = e.currentTarget.closest('svg').getBoundingClientRect();
                                setMouse({ 
                                    x: (e.clientX - rect.left) / rect.width * W, 
                                    y: (e.clientY - rect.top) / rect.height * H 
                                });
                                setHovered(key);
                            }}
                        >
                            <path
                                d={featureToPath(feature, project)}
                                fill={fill}
                                stroke="white"
                                strokeWidth={isHov ? 1.5 : 0.5}
                                style={{ transition: 'all 0.2s', cursor: 'pointer', filter: isHov ? 'brightness(0.9) drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none' }}
                            />
                            {key && val !== undefined && (
                                <g style={{ pointerEvents: 'none' }}>
                                    <text x={cx} y={cy - 4} textAnchor="middle" 
                                        style={{ 
                                            fontSize: '12px', fontWeight: 800, fill: 'white', 
                                            paintOrder: 'stroke', stroke: 'black', strokeWidth: 2.5 
                                        }}>
                                        {key}
                                    </text>
                                    <text x={cx} y={cy + 10} textAnchor="middle" 
                                        style={{ 
                                            fontSize: '10px', fontWeight: 700, fill: 'white', 
                                            paintOrder: 'stroke', stroke: 'black', strokeWidth: 2 
                                        }}>
                                        {val.toLocaleString()}{unit}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Tooltip Dinamis saat Hover */}
                {hovered && data[hovered] !== undefined && (
                    <g style={{ pointerEvents: 'none' }}>
                        <rect 
                            x={mouse.x + 12} y={mouse.y - 45} 
                            width={140} height={40} rx={8} 
                            fill="rgba(61,43,43,0.92)" 
                        />
                        <text x={mouse.x + 82} y={mouse.y - 20} textAnchor="middle" 
                            style={{ fontSize: '11px', fill: 'white', fontWeight: 600 }}>
                            {hovered}: {data[hovered].toLocaleString()}{unit}
                        </text>
                    </g>
                )}
            </svg>
        </div>
    );
}