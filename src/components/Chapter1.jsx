import React from 'react';
import { Section, Divider, ChapterLabel, ChartCard, StatBox, FadeIn, colors } from './shared';
import { useExcelData } from '../hooks/useExcelData';

// ── Analisis: MDS non-metrik, biplot, klaster ───────────────────────────────
const VARS = [
    ['Crime_Rate', 'Crime Rate'], ['P0', 'P0 (%)'], ['TPT_Agustus', 'TPT (%)'], ['Gini_Ratio', 'Gini'],
    ['IPM', 'IPM'], ['RLS', 'RLS'], ['Pengeluaran_per_Kapita', 'Pengeluaran'], ['Kepadatan_Penduduk', 'Kepadatan']
];

// MDS non-metrik (Kruskal): inisialisasi MDS klasik + SMACOF dengan regresi isotonik
function analyze(rows) {
    const n = rows.length, p = VARS.length, R = n => Array.from({ length: n }, () => Array(n).fill(0));

    // 1. Parser Angka Super Aman (Menangani koma Indonesia, sel kosong, dan strip)
    const parseNum = (val) => {
        if (val === undefined || val === null || val === '-' || val === '') return 0;
        if (typeof val === 'string') return parseFloat(val.replace(/,/g, '.')); // Ubah koma jadi titik
        return Number(val) || 0;
    };

    const X = rows.map(r => VARS.map(([k]) => parseNum(r[k])));
    const Z = X.map(r => r.slice());

    for (let j = 0; j < p; j++) {
        const m = X.reduce((a, r) => a + r[j], 0) / n;
        let s = Math.sqrt(X.reduce((a, r) => a + (r[j] - m) ** 2, 0) / (n - 1));

        // 2. Cegah pembagian dengan 0 jika varians kolom = 0 atau NaN
        if (s === 0 || isNaN(s)) s = 1;

        Z.forEach((r, i) => { r[j] = (X[i][j] - m) / s; });
    }

    const D = Z.map(a => Z.map(b => Math.sqrt(a.reduce((s, v, j) => s + (v - b[j]) ** 2, 0))));
    const D2 = D.map(r => r.map(v => v * v)), rm = D2.map(r => r.reduce((a, b) => a + b) / n), g = rm.reduce((a, b) => a + b) / n;
    let M = D2.map((r, i) => r.map((v, j) => -0.5 * (v - rm[i] - rm[j] + g)));
    const V = [], L = [];
    for (let e = 0; e < 2; e++) {
        let v = Array.from({ length: n }, (_, i) => Math.sin(i + 1 + e));
        for (let it = 0; it < 300; it++) { const w = M.map(r => r.reduce((s, x, i) => s + x * v[i], 0)), nm = Math.hypot(...w); v = w.map(x => x / nm); }
        const lam = v.reduce((s, x, i) => s + x * M[i].reduce((a, b, j) => a + b * v[j], 0), 0);
        V.push(v); L.push(lam); M = M.map((r, i) => r.map((x, j) => x - lam * v[i] * v[j]));
    }
    let Y = Array.from({ length: n }, (_, i) => [V[0][i] * Math.sqrt(L[0]), V[1][i] * Math.sqrt(L[1])]);
    const pairs = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j, D[i][j]]);
    pairs.sort((a, b) => a[2] - b[2]);
    let stress = 0;
    for (let it = 0; it < 150; it++) {
        const d = pairs.map(([i, j]) => Math.hypot(Y[i][0] - Y[j][0], Y[i][1] - Y[j][1]));
        const bl = [];
        d.forEach(v => { bl.push({ s: v, c: 1 }); while (bl.length > 1) { const a = bl[bl.length - 2], b = bl[bl.length - 1]; if (a.s / a.c <= b.s / b.c) break; bl.splice(-2, 2, { s: a.s + b.s, c: a.c + b.c }); } });
        let dh = []; bl.forEach(b => { for (let k = 0; k < b.c; k++) dh.push(b.s / b.c); });
        const sd2 = d.reduce((s, v) => s + v * v, 0), sc = Math.sqrt(sd2 / dh.reduce((s, v) => s + v * v, 0));
        dh = dh.map(v => v * sc);
        stress = Math.sqrt(d.reduce((s, v, k) => s + (v - dh[k]) ** 2, 0) / sd2);
        const B = R(n);
        pairs.forEach(([i, j], k) => { if (d[k] > 1e-9) { const b = -dh[k] / d[k]; B[i][j] = b; B[j][i] = b; } });
        for (let i = 0; i < n; i++) B[i][i] = -B[i].reduce((a, b) => a + b, 0);
        Y = Y.map((_, i) => [0, 1].map(c => B[i].reduce((s, b, j) => s + b * Y[j][c], 0) / n));
    }
    const cm = [0, 1].map(c => Y.reduce((a, r) => a + r[c], 0) / n);
    Y = Y.map(r => r.map((v, c) => v - cm[c]));
    const corr = (a, b) => { const ma = a.reduce((x, y) => x + y) / n, mb = b.reduce((x, y) => x + y) / n; let sab = 0, saa = 0, sbb = 0; a.forEach((v, i) => { sab += (v - ma) * (b[i] - mb); saa += (v - ma) ** 2; sbb += (b[i] - mb) ** 2; }); return sab / Math.sqrt(saa * sbb); };
    const col = j => Z.map(r => r[j]);
    [[0, 4], [1, 0]].forEach(([c, j]) => { if (corr(Y.map(r => r[c]), col(j)) < 0) Y = Y.map(r => { r[c] = -r[c]; return r; }); });
    const mx = Math.max(...Y.flat().map(Math.abs)); Y = Y.map(r => r.map(v => v / mx));
    const arrows = VARS.map(([, lab], j) => ({ label: lab, x: corr(Y.map(r => r[0]), col(j)), y: corr(Y.map(r => r[1]), col(j)) }));
    // k-means (k=3), inisialisasi farthest-first
    const dz = (a, b) => a.reduce((s, v, j) => s + (v - b[j]) ** 2, 0);
    const c0 = Z.reduce((bi, r, i) => dz(r, Array(p).fill(0)) < dz(Z[bi], Array(p).fill(0)) ? i : bi, 0);
    let cen = [Z[c0].slice()];
    while (cen.length < 3) { let bi = 0, bd = -1; Z.forEach((r, i) => { const m = Math.min(...cen.map(c => dz(r, c))); if (m > bd) { bd = m; bi = i; } }); cen.push(Z[bi].slice()); }
    let cl = Array(n).fill(0);
    for (let it = 0; it < 50; it++) {
        cl = Z.map(r => cen.reduce((bi, c, k) => dz(r, c) < dz(r, cen[bi]) ? k : bi, 0));
        cen = cen.map((c, k) => { const m = Z.filter((_, i) => cl[i] === k); return m.length ? c.map((_, j) => m.reduce((a, r) => a + r[j], 0) / m.length) : c; });
    }
    const clInfo = cen.map((c, k) => {
        const idx = c.map((v, j) => [v, j]).sort((a, b) => b[0] - a[0]);
        return { k, n: cl.filter(x => x === k).length, high: idx.filter(([v]) => v >= 0.6).slice(0, 2).map(([, j]) => VARS[j][1]), low: idx.filter(([v]) => v <= -0.6).slice(-2).reverse().map(([, j]) => VARS[j][1]) };
    });
    const dist = Y.map(r => Math.hypot(r[0], r[1])), dm = dist.reduce((a, b) => a + b) / n, ds = Math.sqrt(dist.reduce((a, b) => a + (b - dm) ** 2, 0) / (n - 1));
    const outliers = dist.map((v, i) => [v, i]).filter(([v]) => v > dm + 1.5 * ds).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
    const pr = X.map(r => r.map((v, j) => X.filter(o => o[j] < v).length / (n - 1)));
    return { names: rows.map(r => r.Provinsi), X, Y, stress: stress * 100, arrows, cl, clInfo, outliers, pr, crime: X.map(r => r[0]) };
}

// ── Background decoration ───────────────────────────────────────────────────
const ch1Styles = `
    @keyframes ch1Float { 0%,100%{transform:translateY(0) translateX(0) rotate(0deg)} 33%{transform:translateY(-18px) translateX(7px) rotate(2deg)} 66%{transform:translateY(10px) translateX(-5px) rotate(-1.5deg)} }
    @keyframes ch1Pulse { 0%,100%{opacity:0.1; transform:scale(1)} 50%{opacity:0.24; transform:scale(1.06)} }
    @keyframes ch1Scan  { 0%{transform:translateY(-100%);opacity:0} 10%{opacity:0.3} 90%{opacity:0.3} 100%{transform:translateY(200vh);opacity:0} }
    @keyframes ch1Morph { 0%,100%{border-radius:58% 42% 54% 46%/48% 58% 42% 52%} 50%{border-radius:42% 58% 46% 54%/58% 42% 58% 42%} }
    @keyframes ch1Petal { 0%{transform:translateY(-60px) rotate(0deg) scale(1); opacity:0.55} 100%{transform:translateY(105vh) rotate(480deg) scale(0.4); opacity:0} }
`;

function BgDecor() {
    const particles = Array.from({ length: 20 }, (_, i) => ({
        size: 2 + (i % 3),
        top: `${5 + (i * 4.9) % 88}%`,
        left: `${2 + (i * 5.3) % 95}%`,
        dur: `${10 + (i % 7) * 2.5}s`,
        delay: `${(i * 0.75) % 6}s`,
    }));

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <style>{ch1Styles}</style>
            {/* Gradient mesh */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `
                    radial-gradient(ellipse 70% 50% at 10% 20%, rgba(192,57,43,0.15) 0%, transparent 58%),
                    radial-gradient(ellipse 55% 70% at 88% 80%, rgba(26,58,92,0.18) 0%, transparent 58%),
                    radial-gradient(ellipse 40% 40% at 55% 48%, rgba(192,57,43,0.08) 0%, transparent 52%)
                `,
            }} />
            {/* Dot matrix */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle, rgba(192,57,43,0.12) 1.5px, transparent 1.5px)',
                backgroundSize: '36px 36px',
            }} />
            {/* Line grid */}
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
                animation: 'ch1Scan 13s linear infinite',
            }} />
            {/* Floating particles */}
            {particles.map((p, i) => (
                <div key={`p${i}`} style={{
                    position: 'absolute', width: p.size, height: p.size,
                    top: p.top, left: p.left,
                    background: i % 2 === 0 ? 'rgba(192,57,43,0.5)' : 'rgba(26,58,92,0.5)',
                    borderRadius: '50%',
                    animation: `ch1Float ${p.dur} ease-in-out infinite`,
                    animationDelay: p.delay,
                }} />
            ))}
            {/* Corner brackets */}
            <div style={{ position: 'absolute', top: 36, left: 36 }}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path d="M2 62 L2 2 L62 2" stroke="rgba(192,57,43,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="2" cy="2" r="3.5" fill="rgba(192,57,43,0.7)" />
                    <circle cx="62" cy="2" r="2" fill="rgba(192,57,43,0.3)" />
                </svg>
            </div>
            <div style={{ position: 'absolute', bottom: 36, right: 36, transform: 'rotate(180deg)' }}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path d="M2 62 L2 2 L62 2" stroke="rgba(26,58,92,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="2" cy="2" r="3.5" fill="rgba(26,58,92,0.7)" />
                </svg>
            </div>
            <div style={{ position: 'absolute', top: 36, right: 36 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M30 2 L30 30 L2 30" stroke="rgba(192,57,43,0.25)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </div>
            <div style={{ position: 'absolute', bottom: 36, left: 36 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M2 30 L2 2 L30 2" stroke="rgba(26,58,92,0.25)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </div>
            {/* Atmospheric orbs */}
            {[
                { w: 520, h: 520, top: '-12%', left: '-10%', color: 'rgba(192,57,43,0.12)', dur: '18s' },
                { w: 400, h: 400, top: '55%', right: '-7%', color: 'rgba(26,58,92,0.15)', dur: '22s' },
                { w: 260, h: 260, top: '25%', left: '58%', color: 'rgba(192,57,43,0.08)', dur: '14s' },
                { w: 180, h: 180, top: '70%', left: '15%', color: 'rgba(26,58,92,0.1)', dur: '11s' },
            ].map((o, i) => (
                <div key={`o${i}`} style={{
                    position: 'absolute', width: o.w, height: o.h,
                    top: o.top, left: o.left, right: o.right,
                    background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
                    borderRadius: '50%',
                    animation: `ch1Float ${o.dur} ease-in-out infinite`,
                    animationDelay: `${i * 2.5}s`,
                }} />
            ))}
            {/* Morphing blob */}
            <div style={{
                position: 'absolute', width: 155, height: 155,
                top: '38%', left: '3%',
                background: 'rgba(192,57,43,0.07)',
                animation: 'ch1Morph 12s ease-in-out infinite, ch1Float 17s ease-in-out infinite',
            }} />
            {/* Pulsing rings */}
            {[
                { size: 250, top: '12%', right: '7%' },
                { size: 170, top: '60%', left: '4%' },
                { size: 105, top: '40%', left: '44%' },
            ].map((r, i) => (
                <div key={`r${i}`} style={{
                    position: 'absolute', width: r.size, height: r.size,
                    top: r.top, left: r.left, right: r.right,
                    border: `1px solid rgba(${i % 2 === 0 ? '192,57,43' : '26,58,92'},0.2)`,
                    borderRadius: '50%',
                    animation: `ch1Pulse ${7 + i * 2.5}s ease-in-out infinite`,
                    animationDelay: `${i * 1.8}s`,
                }} />
            ))}
            {/* Diamond accents */}
            {[
                { top: '18%', left: '5%', size: 8 },
                { top: '72%', right: '6%', size: 7 },
                { top: '48%', left: '47%', size: 5 },
                { top: '7%', right: '22%', size: 5 },
                { top: '85%', left: '35%', size: 4 },
            ].map((d, i) => (
                <div key={`d${i}`} style={{
                    position: 'absolute', top: d.top, left: d.left, right: d.right,
                    width: d.size, height: d.size,
                    background: i % 2 === 0 ? 'rgba(192,57,43,0.4)' : 'rgba(26,58,92,0.4)',
                    transform: 'rotate(45deg)',
                    animation: `ch1Float ${9 + i * 2}s ease-in-out infinite`,
                    animationDelay: `${i * 0.9}s`,
                }} />
            ))}
        </div>
    );
}

const OI = ['#D55E00', '#0072B2', '#009E73', '#CC79A7'];
const CL = ['#0072B2', '#E69F00', '#009E73'];
const CLN = ['A', 'B', 'C'];

// ── Biplot MDS (SVG, Mode Brush/Pan + Bounded Zoom) ─────────────────────────
function Biplot({ a, sel, setSel }) {
    const W = 640, H = 520, m = 40, cx = W / 2, cy = H / 2;

    // State Kontrol Navigasi
    const [zoom, setZoom] = React.useState(1);
    const [pan, setPan] = React.useState({ x: 0, y: 0 });
    const [mode, setMode] = React.useState('pan'); // 'pan' atau 'brush'
    const [isHovered, setIsHovered] = React.useState(false);

    // State Interaksi Mouse
    const [isPanning, setIsPanning] = React.useState(false);
    const [startPan, setStartPan] = React.useState({ x: 0, y: 0 });
    const ref = React.useRef(null);
    const [br, setBr] = React.useState(null);
    const [hov, setHov] = React.useState(null);

    const S = 270 * zoom;

    // Perhitungan posisi titik dengan memasukkan variabel PAN
    const pt = i => [cx + pan.x + a.Y[i][0] * S, cy + pan.y - a.Y[i][1] * S];

    const toSvg = e => { const b = ref.current.getBoundingClientRect(); return [(e.clientX - b.left) * W / b.width, (e.clientY - b.top) * H / b.height]; };
    const cmax = Math.max(...a.crime), cmin = Math.min(...a.crime);
    const rad = i => 5 + 9 * (a.crime[i] - cmin) / (cmax - cmin);

    // Fungsi pembatas pan agar grafik tidak bablas hilang ke luar layar
    const clampPan = (px, py, z) => {
        const limit = 250 * z;
        return {
            x: Math.max(-limit, Math.min(limit, px)),
            y: Math.max(-limit, Math.min(limit, py))
        };
    };

    // Event Listener (Mouse Action)
    const down = e => {
        const [x, y] = toSvg(e);
        ref.current.setPointerCapture(e.pointerId);
        if (mode === 'brush') {
            setBr({ x0: x, y0: y, x1: x, y1: y });
        } else {
            setIsPanning(true);
            setStartPan({ x: x - pan.x, y: y - pan.y });
        }
    };

    const move = e => {
        if (br) {
            const [x, y] = toSvg(e);
            setBr({ ...br, x1: x, y1: y });
        } else if (isPanning) {
            const [x, y] = toSvg(e);
            setPan(clampPan(x - startPan.x, y - startPan.y, zoom));
        }
    };

    const up = () => {
        if (br) {
            const [xa, xb] = [br.x0, br.x1].sort((p, q) => p - q), [ya, yb] = [br.y0, br.y1].sort((p, q) => p - q);
            if (xb - xa < 5 && yb - ya < 5) setSel([]);
            else setSel(a.names.map((_, i) => i).filter(i => { const [px, py] = pt(i); return px >= xa && px <= xb && py >= ya && py <= yb; }));
            setBr(null);
        }
        setIsPanning(false);
    };

    const toggle = (e, i) => { e.stopPropagation(); setSel(sel.includes(i) ? sel.filter(k => k !== i) : [...sel, i]); };
    const lab = i => a.outliers.includes(i) || sel.includes(i) || hov === i;

    const resetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // Dinamika kursor UI
    const cursorStyle = mode === 'brush' ? 'crosshair' : (isPanning ? 'grabbing' : 'grab');

    return (
        <div
            style={{ position: 'relative', width: '100%' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Panel Kontrol Tersembunyi (Menyesuaikan dengan lebar margin/garis dalam) */}
            <div style={{
                position: 'absolute', top: 'calc(7.69% + 12px)', right: 'calc(6.25% + 12px)',
                display: 'flex', gap: 10, zIndex: 10,
                opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s ease',
                pointerEvents: isHovered ? 'auto' : 'none'
            }}>
                {/* Switcher Mode */}
                <div style={{ display: 'flex', background: 'rgba(20,30,40,0.85)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', backdropFilter: 'blur(4px)' }}>
                    <button onClick={() => setMode('pan')} style={{ background: mode === 'pan' ? 'rgba(255,255,255,0.2)' : 'transparent', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: mode === 'pan' ? 'bold' : 'normal' }}>✋ Geser</button>
                    <button onClick={() => setMode('brush')} style={{ background: mode === 'brush' ? 'rgba(255,255,255,0.2)' : 'transparent', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: mode === 'brush' ? 'bold' : 'normal' }}>⬚ Pilih</button>
                </div>

                {/* Kontrol Zoom (Icon + dan - bentuk kotak) */}
                <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setZoom(z => z + 0.5)} style={{ background: 'rgba(20,30,40,0.85)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>+</button>
                    <button onClick={resetView} style={{ background: 'rgba(20,30,40,0.85)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}>Reset</button>
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.5))} style={{ background: 'rgba(20,30,40,0.85)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>-</button>
                </div>
            </div>

            <svg ref={ref} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', touchAction: 'none', cursor: cursorStyle, userSelect: 'none', WebkitUserSelect: 'none' }}
                onPointerDown={down} onPointerMove={move} onPointerUp={up}>

                <defs>
                    <marker id="ah" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L6,3 L0,6 z" fill="rgba(210,195,180,0.7)" />
                    </marker>
                    {/* Guntingan area kartesius */}
                    <clipPath id="chart-area">
                        <rect x={m} y={m} width={W - 2 * m} height={H - 2 * m} />
                    </clipPath>
                </defs>

                {/* Background Kotak Kartesius */}
                <rect x={m} y={m} width={W - 2 * m} height={H - 2 * m} fill="#0d1117" stroke="rgba(255,255,255,0.08)" />

                {/* Teks Label (Tetap statis di pojok) */}
                <text x={W - m} y={H - m + 16} textAnchor="end" style={{ fontSize: 11, fill: 'rgba(210,195,180,0.6)' }}>Dimensi 1 (searah IPM)</text>
                <text x={m - 6} y={m - 10} style={{ fontSize: 11, fill: 'rgba(210,195,180,0.6)' }}>Dimensi 2 (searah Crime Rate)</text>

                {/* ─── ELEMEN YANG DIPOTONG & BISA DIGESER (Clip Group) ─── */}
                <g clipPath="url(#chart-area)">
                    {/* Garis sumbu 0,0 yang ikut bergeser */}
                    <line x1={m} x2={W - m} y1={cy + pan.y} y2={cy + pan.y} stroke="rgba(255,255,255,0.12)" strokeDasharray="3,3" />
                    <line y1={m} y2={H - m} x1={cx + pan.x} x2={cx + pan.x} stroke="rgba(255,255,255,0.12)" strokeDasharray="3,3" />

                    {/* Vektor Panah Variabel */}
                    {a.arrows.map(v => (
                        <g key={v.label} pointerEvents="none">
                            <line x1={cx + pan.x} y1={cy + pan.y} x2={cx + pan.x + v.x * 130 * zoom} y2={cy + pan.y - v.y * 130 * zoom} stroke="rgba(210,195,180,0.55)" strokeWidth={1.4} markerEnd="url(#ah)" />
                            <text x={cx + pan.x + v.x * 145 * zoom} y={cy + pan.y - v.y * 145 * zoom} textAnchor={v.x >= 0 ? 'start' : 'end'} style={{ fontSize: 11, fill: 'rgba(240,230,211,0.85)', fontStyle: 'italic', textShadow: '1px 1px 2px #000' }}>{v.label}</text>
                        </g>
                    ))}

                    {/* Titik-titik Provinsi */}
                    {a.names.map((nm, i) => {
                        const [x, y] = pt(i), on = sel.includes(i), dim = sel.length > 0 && !on;
                        return (
                            <g key={nm} onPointerDown={e => e.stopPropagation()} onClick={e => toggle(e, i)}
                                onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'pointer' }}>
                                <circle cx={x} cy={y} r={rad(i)} fill={CL[a.cl[i]]} fillOpacity={dim ? 0.15 : 0.82} stroke={on ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth={on ? 2.2 : 0.8}>
                                    <title>{`${nm}\nCrime Rate: ${a.crime[i]}\nKelompok ${CLN[a.cl[i]]}`}</title>
                                </circle>
                                {lab(i) && <text x={x} y={y - rad(i) - 4} textAnchor="middle" style={{ fontSize: 10, fill: '#f0e6d3', fontWeight: 600 }}>{nm}</text>}
                            </g>
                        );
                    })}

                    {/* Visualisasi Kotak Pilihan (Brush) */}
                    {br && <rect x={Math.min(br.x0, br.x1)} y={Math.min(br.y0, br.y1)} width={Math.abs(br.x1 - br.x0)} height={Math.abs(br.y1 - br.y0)} fill="rgba(0,114,178,0.1)" stroke="#0072B2" strokeDasharray="4,3" />}
                </g>
            </svg>
        </div>
    );
}

// ── Radar chart 8 variabel (persentil antarprovinsi) ───────────────────────
function Radar({ a, sel }) {
    const S = 420, c = S / 2, r0 = 135, p = VARS.length;
    const ang = j => -Math.PI / 2 + (2 * Math.PI * j) / p;
    const P = vals => vals.map((v, j) => [c + Math.cos(ang(j)) * r0 * v, c + Math.sin(ang(j)) * r0 * v]);
    const poly = vals => P(vals).map(q => q.join(',')).join(' ');
    const avg = idx => VARS.map((_, j) => idx.reduce((s, i) => s + a.pr[i][j], 0) / idx.length);
    const all = a.names.map((_, i) => i);
    const many = sel.length > 4;
    const series = sel.length === 0 ? []
        : many ? [{ name: `Rata-rata ${sel.length} provinsi terpilih`, v: avg(sel), col: '#C9A84C' }]
            : sel.map((i, k) => ({ name: a.names[i], v: a.pr[i], col: OI[k], i }));
    return (
        <div>
            <svg viewBox={`0 0 ${S} ${S}`} style={{ width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' }}>
                <rect width={S} height={S} fill="#0d1117" />
                {[0.25, 0.5, 0.75, 1].map(t => <polygon key={t} points={poly(Array(p).fill(t))} fill="none" stroke="rgba(255,255,255,0.1)" />)}
                {VARS.map(([, lab], j) => {
                    const [x, y] = P(Array(p).fill(1.14))[j];
                    return <g key={lab}>
                        <line x1={c} y1={c} x2={P(Array(p).fill(1))[j][0]} y2={P(Array(p).fill(1))[j][1]} stroke="rgba(255,255,255,0.1)" />
                        <text x={x} y={y + 3} textAnchor={Math.abs(x - c) < 8 ? 'middle' : x > c ? 'start' : 'end'} style={{ fontSize: 11, fill: 'rgba(210,195,180,0.75)' }}>{lab}</text>
                    </g>;
                })}
                <polygon points={poly(avg(all))} fill="none" stroke="rgba(200,200,200,0.45)" strokeWidth={1.6} strokeDasharray="5,4" />
                {series.length === 0 && (
                    <text x={c} y={c} textAnchor="middle" style={{ fontSize: 13, fill: 'rgba(210,195,180,0.4)' }}>Pilih provinsi untuk ditampilkan</text>
                )}
                {series.map(s => (
                    <g key={s.name}>
                        <polygon points={poly(s.v)} fill={s.col} fillOpacity={0.2} stroke={s.col} strokeWidth={2.2} />
                        {P(s.v).map(([x, y], j) => <circle key={j} cx={x} cy={y} r={3.5} fill={s.col}>
                            <title>{`${s.name} • ${VARS[j][1]}${s.i !== undefined ? ': ' + (+a.X[s.i][j]).toLocaleString() : ''} (persentil ${Math.round(s.v[j] * 100)})`}</title></circle>)}
                    </g>
                ))}
            </svg>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', fontSize: '0.78rem', marginTop: 6, color: 'rgba(210,195,180,0.7)' }}>
                <span><span style={{ color: 'rgba(200,200,200,0.6)' }}>- - -</span> Rata-rata semua provinsi</span>
                {series.map(s => <span key={s.name}><span style={{ color: s.col, fontWeight: 700 }}>●</span> {s.name}</span>)}
            </div>
        </div>
    );
}

const fmtList = l => l.length ? l.join(' dan ') : 'tidak ada yang menonjol';

// ── Main component ──────────────────────────────────────────────────────────
export default function Chapter1({ index }) {
    const rawData = useExcelData('/DataMultivariat.xlsx');
    const [sel, setSel] = React.useState([]);
    const a = React.useMemo(() => (rawData ? analyze(rawData) : null), [rawData]);
    const bg = 'linear-gradient(135deg, #0a0e1a 0%, #111827 40%, #1a0a0f 100%)';

    if (!a) return (<Section index={index} bg={bg}><div style={{ textAlign: 'center', color: '#aaa' }}>Memuat data...</div></Section>);

    const titleStyle = { fontFamily: "'Caveat', cursive", fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)', color: '#f0e6d3', lineHeight: 1.15 };
    const textStyle = { fontSize: '1rem', color: 'rgba(210,195,180,0.85)', lineHeight: 1.85, marginBottom: 16 };
    const hl = { color: colors.rose, fontWeight: 600 };
    const jmax = a.crime.indexOf(Math.max(...a.crime)), jmin = a.crime.indexOf(Math.min(...a.crime));
    const addProv = e => { const i = +e.target.value; if (!isNaN(i) && e.target.value !== '' && !sel.includes(i)) setSel([...sel, i]); };

    return (
        <Section index={index} bg={bg}>
            <BgDecor />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1100, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 'clamp(60px, 8vw, 100px)' }}>
                <FadeIn>
                    <ChapterLabel num={1} title="Visualisasi Multivariat" />
                    <Divider style={{ margin: '0 0 24px 0' }} />
                    <h3 style={{ ...titleStyle, textAlign: 'center' }}>Apakah provinsi yang sejahtera lebih aman?</h3>
                    <p style={{ ...textStyle, marginTop: 16, textAlign: 'center' }}>
                        Delapan indikator kesejahteraan dan kriminalitas dari <span style={hl}>{a.names.length} provinsi</span> diringkas ke dua dimensi lewat Multidimensional Scaling (MDS). Titik yang berdekatan berarti profilnya mirip.
                    </p>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 }}>
                        <StatBox num={a.names.length} label="Provinsi" />
                        <StatBox num={`${a.stress.toFixed(1)}%`} label="Stress MDS (Kruskal)" color={colors.gold} />
                        <StatBox num={`${Math.min(...a.crime).toFixed(2)}–${Math.max(...a.crime).toFixed(2)}`} label="Rentang Crime Rate" color="#b07cc6" />
                    </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(28px, 4.5vw, 52px)', alignItems: 'flex-start' }}>
                        <div style={{ flex: '1.5 1 340px' }}>
                            <ChartCard title="Biplot MDS: Posisi Provinsi dan Arah Variabel">
                                <Biplot a={a} sel={sel} setSel={setSel} />
                                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.78rem', marginTop: 6 }}>
                                    {a.clInfo.map(c => <span key={c.k}><span style={{ color: CL[c.k], fontWeight: 700 }}>●</span> Kelompok {CLN[c.k]} ({c.n})</span>)}
                                    <span>Ukuran titik = Crime Rate</span>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#777', textAlign: 'center', marginTop: 8 }}>
                                    Seret kotak untuk memilih provinsi, atau klik titik. Panah = korelasi variabel dengan sumbu MDS. Kepadatan tidak ditransformasi. Sumber: BPS
                                </p>
                            </ChartCard>
                        </div>
                        <div style={{ flex: '1 1 280px' }}>
                            <h3 style={titleStyle}>Membaca kelompok dan pencilan</h3>
                            <p style={{ ...textStyle, marginTop: 12 }}>
                                Pencilan pada peta MDS tersebut adalah <span style={hl}>{a.outliers.length ? a.outliers.map(i => a.names[i]).join(', ') : 'tidak ada'}</span>. Crime Rate tertinggi berada di Provinsi <span style={hl}>{a.names[jmax]}</span> ({a.crime[jmax].toFixed(2)}) dan terendah di Provinsi <span style={hl}>{a.names[jmin]}</span> ({a.crime[jmin].toFixed(2)}).
                            </p>
                            {a.clInfo.map(c => {
                                // Siapkan teks statis berdasarkan index kelompok (0=A, 1=B, 2=C)
                                const deskripsiKelompok = [
                                    "Memiliki karakteristik rata-rata nasional. Tidak memiliki nilai ekstrem pada indikator kesejahteraan maupun kriminalitas.",
                                    "Sangat dominan pada tingkat Kepadatan Penduduk, Pengeluaran, dan IPM, serta memiliki tingkat Kemiskinan (P0) paling rendah.",
                                    "Ditandai dengan tingginya tingkat Kemiskinan (P0) dan Rasio Gini, serta masih tertinggal pada indikator pendidikan (RLS) dan IPM."
                                ];

                                return (
                                    <p key={c.k} style={{ ...textStyle, marginBottom: 10, fontSize: '0.92rem' }}>
                                        <span style={{ color: CL[c.k], fontWeight: 700 }}>Kelompok {CLN[c.k]}</span> ({c.n} provinsi): {deskripsiKelompok[c.k]}
                                    </p>
                                );
                            })}
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.15}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(28px, 4.5vw, 52px)', alignItems: 'flex-start' }}>
                        <div style={{ flex: '1 1 280px' }}>
                            <h3 style={titleStyle}>Bandingkan profil provinsi</h3>
                            <p style={{ ...textStyle, marginTop: 12 }}>Radar menampilkan 8 variabel sebagai persentil antarprovinsi (100 = tertinggi). Pilih provinsi di bawah, atau sorot kelompok pada biplot.</p>
                            <select value="" onChange={addProv} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: '0.9rem', marginBottom: 12, background: '#111827', color: '#fff', border: '1px solid #333' }}>
                                <option value="">+ Tambah provinsi…</option>
                                {a.names.map((nm, i) => (sel.includes(i) ? null : <option key={nm} value={i}>{nm}</option>))}
                            </select>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {sel.length <= 6 && sel.map((i, k) => (
                                    <button key={i} onClick={() => setSel(sel.filter(x => x !== i))} style={{ border: `1.5px solid ${sel.length <= 4 ? OI[k] : '#999'}`, background: 'transparent', color: '#f0e6d3', borderRadius: 16, padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>{a.names[i]} ✕</button>
                                ))}
                                {sel.length > 6 && <span style={{ color: '#f0e6d3', fontSize: '0.85rem' }}>{sel.length} provinsi terpilih</span>}
                                {sel.length > 0 && <button onClick={() => setSel([])} style={{ background: colors.rose, border: 'none', color: '#fff', borderRadius: 16, padding: '4px 14px', cursor: 'pointer', fontSize: '0.8rem' }}>Reset</button>}
                            </div>
                        </div>
                        <div style={{ flex: '1.3 1 320px' }}>
                            <ChartCard title="Radar: profil 8 variabel">
                                <Radar a={a} sel={sel} />
                                <p style={{ fontSize: '0.75rem', color: '#777', textAlign: 'center', marginTop: 8 }}>Arahkan kursor ke titik untuk nilai asli. Sumber: BPS</p>
                            </ChartCard>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </Section>
    );
}