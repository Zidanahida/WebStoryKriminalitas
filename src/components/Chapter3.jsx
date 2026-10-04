import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Section, Divider, ChapterLabel, ChartCard, FadeIn, colors } from './shared';

/* ─────────────────────────────────────────────────────────────────
   Background
───────────────────────────────────────────────────────────────── */
function BgDecor() {
    const particles = Array.from({ length: 18 }, (_, i) => ({
        size: 2 + (i % 3),
        top: `${8 + (i * 5.1) % 84}%`,
        left: `${3 + (i * 5.8) % 93}%`,
        dur: `${10 + (i % 7) * 2.5}s`,
        delay: `${(i * 0.8) % 6}s`,
    }));

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <style>{`
                @keyframes floatUp3  { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-22px) rotate(4deg)} }
                @keyframes pulse3    { 0%,100%{opacity:0.09; transform:scale(1)} 50%{opacity:0.22; transform:scale(1.05)} }
                @keyframes drift3    { 0%,100%{transform:translateY(0) translateX(0)} 33%{transform:translateY(-16px) translateX(8px)} 66%{transform:translateY(9px) translateX(-5px)} }
                @keyframes scanPink  { 0%{transform:translateY(-100%); opacity:0} 10%{opacity:0.35} 90%{opacity:0.35} 100%{transform:translateY(200vh); opacity:0} }
                @keyframes morphPink { 0%,100%{border-radius:55% 45% 60% 40%/45% 60% 40% 55%} 50%{border-radius:40% 60% 45% 55%/60% 40% 55% 45%} }
            `}</style>

            {/* Gradient mesh */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `
                    radial-gradient(ellipse 72% 52% at 14% 20%, rgba(192,57,43,0.14) 0%, transparent 58%),
                    radial-gradient(ellipse 55% 72% at 86% 80%, rgba(26,58,92,0.18) 0%, transparent 58%),
                    radial-gradient(ellipse 44% 44% at 55% 50%, rgba(192,57,43,0.07) 0%, transparent 52%)
                `,
            }} />

            {/* Dot matrix */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle, rgba(192,57,43,0.12) 1.5px, transparent 1.5px)',
                backgroundSize: '38px 38px',
            }} />

            {/* Coarse line grid */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `
                    linear-gradient(rgba(26,58,92,0.06) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(26,58,92,0.06) 1px, transparent 1px)
                `,
                backgroundSize: '100px 100px',
            }} />

            {/* Scan line */}
            <div style={{
                position: 'absolute', left: 0, right: 0, height: 2, top: 0,
                background: 'linear-gradient(90deg, transparent, rgba(192,57,43,0.25), transparent)',
                animation: 'scanPink 14s linear infinite',
            }} />

            {/* Floating particles */}
            {particles.map((p, i) => (
                <div key={`p${i}`} style={{
                    position: 'absolute',
                    width: p.size, height: p.size,
                    top: p.top, left: p.left,
                    background: i % 2 === 0 ? 'rgba(192,57,43,0.5)' : 'rgba(26,58,92,0.5)',
                    borderRadius: '50%',
                    animation: `drift3 ${p.dur} ease-in-out infinite`,
                    animationDelay: p.delay,
                }} />
            ))}

            {/* Corner brackets */}
            <div style={{ position: 'absolute', top: 36, left: 36 }}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path d="M2 62 L2 2 L62 2" stroke="rgba(192,57,43,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="2" cy="2" r="3.5" fill="rgba(192,57,43,0.7)" />
                    <circle cx="62" cy="2" r="2" fill="rgba(192,57,43,0.3)" />
                </svg>
            </div>
            <div style={{ position: 'absolute', bottom: 36, right: 36, transform: 'rotate(180deg)' }}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path d="M2 62 L2 2 L62 2" stroke="rgba(26,58,92,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="2" cy="2" r="3.5" fill="rgba(26,58,92,0.7)" />
                </svg>
            </div>
            <div style={{ position: 'absolute', top: 36, right: 36 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M30 2 L30 30 L2 30" stroke="rgba(192,57,43,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            </div>

            {/* Atmospheric orbs */}
            <div style={{ position: 'absolute', width: 520, height: 520, top: '-12%', left: '-10%', background: 'radial-gradient(circle, rgba(192,57,43,0.12) 0%, transparent 70%)', borderRadius: '50%', animation: 'pulse3 9s infinite' }} />
            <div style={{ position: 'absolute', width: 420, height: 420, bottom: '-8%', right: '-7%', background: 'radial-gradient(circle, rgba(26,58,92,0.15) 0%, transparent 70%)', borderRadius: '50%', animation: 'pulse3 12s infinite reverse' }} />
            <div style={{ position: 'absolute', width: 280, height: 280, top: '30%', left: '55%', background: 'radial-gradient(circle, rgba(192,57,43,0.07) 0%, transparent 70%)', borderRadius: '50%', animation: 'drift3 15s ease-in-out infinite' }} />

            {/* Morphing blob */}
            <div style={{
                position: 'absolute', width: 150, height: 150,
                top: '40%', right: '4%',
                background: 'rgba(192,57,43,0.07)',
                animation: 'morphPink 13s ease-in-out infinite, drift3 18s ease-in-out infinite',
            }} />

            {/* Floating ring outlines */}
            {[
                { size: 240, top: '16%', right: '9%' },
                { size: 160, top: '64%', left: '5%' },
                { size: 100, top: '44%', left: '44%' },
            ].map((r, i) => (
                <div key={`r${i}`} style={{
                    position: 'absolute', width: r.size, height: r.size,
                    top: r.top, left: r.left, right: r.right,
                    border: `1px solid rgba(${i % 2 === 0 ? '192,57,43' : '26,58,92'},0.22)`,
                    borderRadius: '50%',
                    animation: `floatUp3 ${7 + i * 2.5}s ease-in-out infinite`,
                    animationDelay: `${i * 1.6}s`,
                }} />
            ))}

            {/* Diamond accents */}
            {[
                { top: '20%', left: '6%', size: 8 },
                { top: '75%', right: '5%', size: 7 },
                { top: '50%', left: '48%', size: 5 },
                { top: '8%', right: '20%', size: 5 },
            ].map((d, i) => (
                <div key={`d${i}`} style={{
                    position: 'absolute', top: d.top, left: d.left, right: d.right,
                    width: d.size, height: d.size,
                    background: i % 2 === 0 ? 'rgba(192,57,43,0.4)' : 'rgba(26,58,92,0.4)',
                    transform: 'rotate(45deg)',
                    animation: `drift3 ${8 + i * 2.5}s ease-in-out infinite`,
                    animationDelay: `${i * 1}s`,
                }} />
            ))}
        </div>
    );
}

function useDataHier() {
    const [state, setState] = useState({ rows: null, error: null });
    useEffect(() => {
        fetch('/DataBerjejaringHierarki.xlsx')
            .then(r => {
                if (!r.ok) throw new Error(`File tidak ditemukan (HTTP ${r.status}). Pastikan DataBerjejaringHierarki.xlsx ada di folder public/.`);
                return r.arrayBuffer();
            })
            .then(buf => {
                const wb = XLSX.read(buf, { type: 'array' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
                if (!rows.some(r => (r || []).some(c => String(c).trim() === 'Narkotika dan Psikotropika'))) {
                    throw new Error('Kolom "Narkotika dan Psikotropika" tidak ditemukan. Cek isi file di folder public/.');
                }
                setState({ rows, error: null });
            })
            .catch(e => { console.error(e); setState({ rows: null, error: e.message }); });
    }, []);
    return state;
}

// Gugus pulau (level 2) — sama dengan pulau_map pada kode R
const pulauOf = n => /Aceh|Sumatera (Utara|Barat|Selatan)|^Riau$|Jambi|Bengkulu|Lampung|Bangka|Kepulauan Riau/.test(n) ? 'Sumatera'
    : /Jakarta|Metro Jaya|Jawa|Yogyakarta|Banten/.test(n) ? 'Jawa'
    : /^Bali$|Nusa Tenggara/.test(n) ? 'Bali & Nusa Tenggara'
    : /Kalimantan/.test(n) ? 'Kalimantan'
    : /Sulawesi|Gorontalo/.test(n) ? 'Sulawesi' : 'Maluku & Papua';

// Indonesia (level 1) → Pulau (level 2) → Provinsi (level 3); ukuran = total kejahatan, warna = % narkotika
function buildTree(rows) {
    const h = rows.findIndex(r => (r || []).some(c => String(c).trim() === 'Narkotika dan Psikotropika'));
    const iN = rows[h].findIndex(c => String(c).trim() === 'Narkotika dan Psikotropika');
    const prov = rows.slice(h + 1).filter(r => r && r[0] && !/^(indonesia|jumlah|total)/i.test(String(r[0]).trim())).map(r => ({
        name: String(r[0]).trim(),
        v: r.slice(1).reduce((s, x) => s + (Number(x) || 0), 0),
        nar: Number(r[iN]) || 0,
    }));
    const by = {};
    prov.forEach(p => { (by[pulauOf(p.name)] = by[pulauOf(p.name)] || []).push(p); });
    const sum = ch => ({ v: ch.reduce((s, c) => s + c.v, 0), nar: ch.reduce((s, c) => s + c.nar, 0) });
    const kids = Object.entries(by).map(([name, ch]) => ({ name, ...sum(ch), children: ch.sort((a, b) => b.v - a.v) })).sort((a, b) => b.v - a.v);
    return { name: 'Indonesia', ...sum(kids), children: kids, prov };
}

const STOPS = ['#fde725', '#5ec962', '#21918c', '#3b528b', '#440154'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
const ramp = t => {
    const x = Math.max(0, Math.min(1, t)) * (STOPS.length - 1), i = Math.min(Math.floor(x), STOPS.length - 2), f = x - i;
    return `rgb(${STOPS[i].map((c, k) => Math.round(c + (STOPS[i + 1][k] - c) * f)).join(',')})`;
};
const share = n => (n.v ? n.nar / n.v : 0);
const fmt = v => Math.round(v).toLocaleString('id-ID');

// Tata letak treemap (squarified)
function squarify(items, x, y, w, h) {
    const out = [], total = items.reduce((s, i) => s + i.v, 0);
    let rest = items.map(i => ({ ...i, a: (i.v / total) * w * h }));
    while (rest.length) {
        const side = Math.min(w, h);
        const worst = (r, s) => { const mx = Math.max(...r.map(i => i.a)), mn = Math.min(...r.map(i => i.a)); return Math.max(side * side * mx / (s * s), s * s / (side * side * mn)); };
        let row = [rest[0]], s = rest[0].a, k = 1;
        while (k < rest.length) { const nr = [...row, rest[k]], ns = s + rest[k].a; if (worst(nr, ns) <= worst(row, s)) { row = nr; s = ns; k++; } else break; }
        const t = s / side; let off = 0;
        row.forEach(i => { const len = i.a / t; out.push(w >= h ? { ...i, x, y: y + off, w: t, h: len } : { ...i, x: x + off, y, w: len, h: t }); off += len; });
        if (w >= h) { x += t; w -= t; } else { y += t; h -= t; }
        rest = rest.slice(row.length);
    }
    return out;
}

const tipLines = (n, par) => [
    ['Total kejahatan', `${fmt(n.v)} kasus`],
    ...(par ? [[`Porsi dari ${par.name}`, `${(n.v / par.v * 100).toFixed(1)}%`]] : []),
    ['Kasus narkotika', `${fmt(n.nar)} kasus (${(share(n) * 100).toFixed(1)}% dari total ${n.name})`],
];

function Treemap({ node, tOf, hover, onZoom, setHover }) {
    const W = 680, H = 440;
    const rects = squarify(node.children.filter(c => c.v > 0).map(c => ({ c, v: c.v })), 0, 0, W, H)
        .sort((a, b) => (hover === a.c) - (hover === b.c));
    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
            {rects.map(r => {
                const t = tOf(r.c), dark = t > 0.4, on = hover === r.c;
                return (
                    <g key={r.c.name} style={{ cursor: r.c.children ? 'zoom-in' : 'default', opacity: hover && !on ? 0.55 : 1 }}
                        onClick={() => r.c.children && onZoom(r.c)} onMouseEnter={() => setHover(r.c)} onMouseLeave={() => setHover(null)}>
                        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={ramp(t)} stroke={on ? '#fff' : '#0b1020'} strokeWidth={on ? 3 : 2} />
                        {r.w > 62 && r.h > 28 && <text x={r.x + 8} y={r.y + 19} style={{ fontSize: 12, fontWeight: 700, fill: dark ? '#fff' : '#1a1a1a', pointerEvents: 'none' }}>{r.c.name.length > r.w / 7 ? r.c.name.slice(0, Math.floor(r.w / 7)) + '…' : r.c.name}</text>}
                        {r.w > 62 && r.h > 46 && <text x={r.x + 8} y={r.y + 35} style={{ fontSize: 11, fill: dark ? '#eee' : '#333', pointerEvents: 'none' }}>{fmt(r.c.v)}{r.w > 95 ? ' kasus' : ''}</text>}
                    </g>
                );
            })}
        </svg>
    );
}

function Sunburst({ node, tOf, hover, onZoom, onUp, canUp, setHover }) {
    const S = 500, c = S / 2, R = [72, 168, 238], TAU = Math.PI * 2;
    const Px = (r, a) => c + r * Math.sin(a);
    const Py = (r, a) => c - r * Math.cos(a);
    const arc = (a0, a1, r0, r1) => {
        a1 = Math.min(a1, a0 + TAU - 0.002);
        const L = a1 - a0 > Math.PI ? 1 : 0;
        return `M${Px(r1,a0)} ${Py(r1,a0)} A${r1} ${r1} 0 ${L} 1 ${Px(r1,a1)} ${Py(r1,a1)} L${Px(r0,a1)} ${Py(r0,a1)} A${r0} ${r0} 0 ${L} 0 ${Px(r0,a0)} ${Py(r0,a0)} Z`;
    };
    // Path untuk textPath — busur tengah ring
    const arcTextPath = (id, a0, a1, r) => {
        // Selalu gambar searah jarum jam agar teks tidak terbalik
        const mid = (a0 + a1) / 2;
        const flip = mid > Math.PI; // bagian bawah: gambar berlawanan agar teks tidak terbalik
        const [ta0, ta1] = flip ? [a1, a0] : [a0, a1];
        const span = Math.min(a1 - a0, TAU - 0.002);
        const L = span > Math.PI ? 1 : 0;
        return `M${Px(r,ta0)} ${Py(r,ta0)} A${r} ${r} 0 ${L} ${flip ? 0 : 1} ${Px(r,ta1)} ${Py(r,ta1)}`;
    };

    const arcs = []; let cum = 0;
    node.children.filter(k => k.v > 0).forEach(k => {
        const a0 = (cum / node.v) * TAU; cum += k.v; const a1 = (cum / node.v) * TAU;
        arcs.push({ n: k, a0, a1, ring: 1, parent: k });
        let cc = (a0 / TAU) * node.v;
        (k.children || []).filter(g => g.v > 0).forEach(g => {
            const b0 = (cc / node.v) * TAU; cc += g.v;
            arcs.push({ n: g, a0: b0, a1: (cc / node.v) * TAU, ring: 2, parent: k });
        });
    });
    arcs.sort((a, b) => (hover === a.n) - (hover === b.n));

    // Hitung panjang busur dalam piksel untuk menentukan ukuran font
    const arcLen = (a0, a1, r) => (a1 - a0) * r;

    return (
        <svg viewBox={`0 0 ${S} ${S}`} style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0 auto' }}>
            <defs>
                {arcs.map(a => {
                    const rMid = (R[a.ring - 1] + R[a.ring]) / 2;
                    return <path key={`tp-${a.ring}-${a.n.name}`} id={`tp-${a.ring}-${a.n.name}`} d={arcTextPath(`tp-${a.ring}-${a.n.name}`, a.a0, a.a1, rMid)} fill="none" />;
                })}
            </defs>
            {arcs.map(a => {
                const on = hover === a.n;
                const dark = tOf(a.n) > 0.45;
                const rMid = (R[a.ring - 1] + R[a.ring]) / 2;
                const ringW = R[a.ring] - R[a.ring - 1];
                const span = arcLen(a.a0, a.a1, rMid);
                // Font size: muat dalam lebar ring, max 11
                const fs = Math.min(11, Math.max(6, ringW * 0.38));
                // Label: potong nama agar muat dalam busur
                const charsAvail = Math.max(1, Math.floor(span / (fs * 0.62)));
                const label = a.n.name.length <= charsAvail
                    ? a.n.name
                    : a.n.name.slice(0, Math.max(1, charsAvail - 1)) + '…';
                const showLabel = span > fs * 1.2; // tampilkan selama ada ruang minimal 1 karakter
                return (
                    <g key={a.ring + a.n.name}
                        style={{ cursor: a.parent.children ? 'zoom-in' : 'default', opacity: hover && !on ? 0.5 : 1 }}
                        onClick={() => a.parent.children && onZoom(a.parent)}
                        onMouseEnter={() => setHover(a.n)}
                        onMouseLeave={() => setHover(null)}>
                        <path d={arc(a.a0, a.a1, R[a.ring - 1], R[a.ring])}
                            fill={ramp(tOf(a.n))}
                            stroke={on ? '#fff' : '#0b1020'}
                            strokeWidth={on ? 2.5 : 1} />
                        {showLabel && (
                            <text style={{ fontSize: fs, fontWeight: a.ring === 1 ? 700 : 500, pointerEvents: 'none', fill: dark ? '#fff' : '#111' }}>
                                <textPath href={`#tp-${a.ring}-${a.n.name}`} startOffset="50%" textAnchor="middle">
                                    {label}
                                </textPath>
                            </text>
                        )}
                    </g>
                );
            })}
            <g style={{ cursor: canUp ? 'zoom-out' : 'default' }} onClick={onUp}>
                <circle cx={c} cy={c} r={R[0] - 4} fill="#111827" stroke="#334" />
                <text x={c} y={c - 6} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: '#f0e6d3' }}>{node.name.length > 12 ? node.name.slice(0, 11) + '…' : node.name}</text>
                <text x={c} y={c + 8} textAnchor="middle" style={{ fontSize: 10, fill: '#ccc' }}>{fmt(node.v)} kasus</text>
                <text x={c} y={c + 22} textAnchor="middle" style={{ fontSize: 9.5, fill: '#9ab' }}>{canUp ? '↑ klik untuk naik' : 'pusat'}</text>
            </g>
        </svg>
    );
}

// Satu panel = satu representasi, dengan drill-down, breadcrumb, dan tooltip sendiri (tidak berbagi status dengan panel lain)
function Panel({ tree, kind, tOf, lo, hi, title, hint, card }) {
    const [path, setPath] = useState([]);
    const [hover, setHover] = useState(null);
    const [pos, setPos] = useState([0, 0, 600]);
    const box = useRef(null);
    const trail = [tree]; path.forEach(n => trail.push(trail[trail.length - 1].children.find(c => c.name === n)));
    const node = trail[trail.length - 1];
    const par = hover && (node.children.includes(hover) ? node : node.children.find(c => (c.children || []).includes(hover)));
    const move = e => { const b = box.current.getBoundingClientRect(); setPos([e.clientX - b.left, e.clientY - b.top, b.width]); };
    const zoom = n => { setHover(null); setPath([...path, n.name]); };
    const up = () => { if (path.length) { setHover(null); setPath(path.slice(0, -1)); } };
    const Chart = kind === 'treemap' ? Treemap : Sunburst;
    return (
        <ChartCard title={title} style={card}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: '0.9rem', color: '#f0e6d3' }}>
                <span style={{ opacity: 0.6 }}>Posisi:</span>
                {trail.map((n, i) => (
                    <React.Fragment key={n.name}>
                        {i > 0 && <span style={{ opacity: 0.5 }}>›</span>}
                        <button onClick={() => { setHover(null); setPath(path.slice(0, i)); }} disabled={i === trail.length - 1}
                            style={{ background: i === trail.length - 1 ? colors.rose : 'transparent', border: `1px solid ${colors.rose}`, color: '#fff', borderRadius: 14, padding: '3px 12px', cursor: i === trail.length - 1 ? 'default' : 'pointer', fontSize: '0.82rem' }}>{n.name}</button>
                    </React.Fragment>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', opacity: 0.7 }}>{hint}</span>
            </div>
            <div ref={box} onMouseMove={move} style={{ position: 'relative' }}>
                <Chart node={node} tOf={tOf} hover={hover} onZoom={zoom} onUp={up} canUp={path.length > 0} setHover={setHover} />
                {hover && (
                    <div style={{ position: 'absolute', left: pos[0] > pos[2] * 0.6 ? pos[0] - 236 : pos[0] + 14, top: pos[1] + 14, width: 222, pointerEvents: 'none', zIndex: 5,
                        background: 'rgba(10,14,26,0.96)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#f0e6d3', lineHeight: 1.5 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{hover.name}</div>
                        {tipLines(hover, par).map(([k, v]) => <div key={k}><span style={{ opacity: 0.7 }}>{k}: </span>{v}</div>)}
                        {hover.children && <div style={{ marginTop: 3, color: colors.gold }}>Klik untuk memperbesar</div>}
                    </div>
                )}
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', fontSize: '0.78rem', color: '#d8cdbd' }}>
                <div style={{ flex: '1 1 260px' }}>Angka = <b>jumlah kasus kejahatan tercatat (2023)</b>. Ukuran = total kasus. Warna = persentase kasus narkotika dari total kasus wilayah itu.</div>
                <div style={{ flex: '0 1 240px' }}>
                    <div style={{ height: 12, borderRadius: 6, background: `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1].map(ramp).join(',')})` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.85 }}><span>{(lo * 100).toFixed(1)}%</span><span>% narkotika</span><span>{(hi * 100).toFixed(1)}%</span></div>
                </div>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#9aa', marginTop: 8 }}>Hierarki: Indonesia → Pulau → Provinsi (Kepolisian Daerah). Sumber: BPS, Statistik Kriminal 2024/2025, Lampiran 10.</p>
        </ChartCard>
    );
}

export default function Chapter3({ index }) {
    const { rows, error } = useDataHier();
    const tree = useMemo(() => (rows ? buildTree(rows) : null), [rows]);
    const bg = 'linear-gradient(135deg, #0a0e1a 0%, #111827 40%, #1a0a0f 100%)';
    if (error) return (<Section index={index} bg={bg}><div style={{ color: '#f0a0a0', textAlign: 'center', maxWidth: 560 }}>Gagal memuat data: {error}</div></Section>);
    if (!tree) return (<Section index={index} bg={bg}><div style={{ color: '#aaa', textAlign: 'center' }}>Memuat data...</div></Section>);

    const storyTitleStyle = {
        fontFamily: "'Caveat', cursive",
        fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)',
        color: '#f0e6d3',
        lineHeight: 1.15,
    };
    const storyTextStyle = {
        fontSize: '1rem',
        color: 'rgba(210,195,180,0.85)',
        lineHeight: 1.85,
        marginBottom: 16
    };
    const highlightText = { color: colors.rose, fontWeight: 600 };

    /* ── Glassmorphism styles ── */
    const glassCard = {
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        boxShadow: '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)',
    };
    const sh = tree.prov.map(share), lo = Math.min(...sh), hi = Math.max(...sh);
    const tOf = n => (hi > lo ? (share(n) - lo) / (hi - lo) : 0);
    const top = tree.prov.reduce((b, p) => (p.v > b.v ? p : b)), topN = tree.prov.reduce((b, p) => (share(p) > share(b) ? p : b));
    const jawa = tree.children.find(c => c.name === 'Jawa');
    const common = { tree, tOf, lo, hi, card: glassCard };

    return (
        <Section index={index} bg={bg} style={{ overflow: 'hidden' }}>
            <BgDecor />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1120, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 'clamp(40px, 6vw, 64px)' }}>
                <FadeIn>
                    <ChapterLabel num={3} title="Visualisasi Hierarki" />
                    <Divider style={{ margin: '0 0 24px 0' }} />
                    <h3 style={{ ...storyTitleStyle, marginBottom: 16 }}>Dari Indonesia hingga Provinsi</h3>
                    <p style={storyTextStyle}>
                        Total <span style={highlightText}>{fmt(tree.v)}</span> kasus kejahatan tercatat pada tahun 2023. {jawa && <>Pulau Jawa menyumbang <span style={highlightText}>{(jawa.v / tree.v * 100).toFixed(0)}%</span>. </>}
                        Provinsi dengan kasus terbanyak adalah <span style={highlightText}>{top.name}</span>, sedangkan porsi narkotika tertinggi ada di <span style={highlightText}>{topN.name}</span> ({(share(topN) * 100).toFixed(1)}% dari seluruh kasusnya).
                    </p>
                </FadeIn>
                <FadeIn delay={0.1}>
                    <Panel {...common} kind="treemap" title="Treemap: ukuran = total kasus kejahatan, warna = % narkotika" hint="Klik kotak untuk memperbesar" />
                </FadeIn>
                <FadeIn delay={0.1}>
                    <Panel {...common} kind="sunburst" title="Sunburst: ukuran = total kasus kejahatan, warna = % narkotika" hint="Klik busur untuk memperbesar, klik lingkaran tengah untuk naik" />
                </FadeIn>
            </div>
        </Section>
    );
}