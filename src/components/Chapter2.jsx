import React from 'react';
import { Section, Divider, ChapterLabel, ChartCard, FadeIn, colors } from './shared';
import { useExcelData } from '../hooks/useExcelData';

// ── Konstanta warna komunitas ────────────────────────────────────────────────
const COMM_COLORS = ['#E63946', '#FFC107', '#4DA3FF', '#52C41A', '#CC79A7', '#FF8C42', '#B388FF'];
const THRESHOLD = 0.85; // korelasi minimum agar dua provinsi dianggap mirip
const TOP_K = 3;        // tiap provinsi menunjuk maksimal K provinsi paling mirip (arah panah)
const CURVE = 0.25;     // tingkat lengkung edge

// ── Hitung korelasi Pearson antar dua array ──────────────────────────────────
function pearson(a, b) {
    const n = a.length;
    const ma = a.reduce((s, v) => s + v, 0) / n;
    const mb = b.reduce((s, v) => s + v, 0) / n;
    let sab = 0, saa = 0, sbb = 0;
    for (let i = 0; i < n; i++) {
        sab += (a[i] - ma) * (b[i] - mb);
        saa += (a[i] - ma) ** 2;
        sbb += (b[i] - mb) ** 2;
    }
    if (saa === 0 || sbb === 0) return 0;
    return sab / Math.sqrt(saa * sbb);
}

// ── Parse Excel → { names, matrix (n×n korelasi) } ──────────────────────────
function buildGraph(rows) {
    if (!rows || rows.length < 2) return null;
    // rows[0] = header row (sub-kategori), rows[1..] = data provinsi
    // useExcelData pakai sheet_to_json default → baris pertama jadi key
    // Kita perlu raw: gunakan format khusus di hook, tapi hook sudah fixed
    // Struktur: rows dari sheet_to_json → baris 0 = provinsi pertama (Aceh)
    // karena header row 0 (kategori) jadi key, row 1 (sub-kategori) jadi row pertama
    // Cek apakah baris pertama adalah sub-kategori atau data
    // useExcelData pakai sheet_to_json default:
    // - Row 0 Excel (kategori besar) → jadi key kolom
    // - Row 1 Excel (sub-kategori: "Pembunuhan", dst) → rows[0] di React
    // - Row 2 Excel (Aceh, dst) → rows[1] di React
    // Jadi rows[0] adalah baris sub-kategori, harus dibuang.
    // Provinsi valid: string, bukan angka, dan bukan nama jenis kejahatan (rows[0])
    const subHeaderKeys = new Set(Object.values(rows[0]).map(v => String(v).trim()));
    const validRows = rows.slice(1).filter(r => {
        const v = String(Object.values(r)[0] ?? '').trim();
        return v !== '' && isNaN(+v) && !subHeaderKeys.has(v);
    });
    const names = validRows.map(r => String(Object.values(r)[0]).trim());
    const vectors = validRows.map(r => Object.values(r).slice(1).map(v => +v || 0));

    const n = names.length;
    const cor = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => i === j ? 1 : pearson(vectors[i], vectors[j]))
    );

    // Directed edges: i → j bila j termasuk TOP_K provinsi paling mirip dengan i (r ≥ THRESHOLD)
    const edges = [];
    for (let i = 0; i < n; i++) {
        cor[i]
            .map((w, j) => ({ j, w }))
            .filter(({ j, w }) => j !== i && w >= THRESHOLD)
            .sort((a, b) => b.w - a.w)
            .slice(0, TOP_K)
            .forEach(({ j, w }) => edges.push({ i, j, w }));
    }
    const inDeg = Array(n).fill(0), outDeg = Array(n).fill(0);
    const adj = Array.from({ length: n }, () => new Set()); // tetangga (masuk + keluar) untuk hover
    for (const { i, j } of edges) { outDeg[i]++; inDeg[j]++; adj[i].add(j); adj[j].add(i); }

    // Louvain phase 1 pada graf tak-berarah (r ≥ THRESHOLD) — sama dengan igraph cluster_louvain di R
    let m = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (cor[i][j] >= THRESHOLD) m += cor[i][j];
    const kdeg = Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && cor[i][j] >= THRESHOLD) kdeg[i] += cor[i][j];

    let comm = Array.from({ length: n }, (_, i) => i);
    let changed = true;
    while (changed) {
        changed = false;
        for (let i = 0; i < n; i++) {
            const curC = comm[i];
            const neighborComms = new Set();
            for (let j = 0; j < n; j++) if (j !== i && cor[i][j] >= THRESHOLD) neighborComms.add(comm[j]);
            let bestC = curC, bestGain = 0;
            for (const c of neighborComms) {
                if (c === curC) continue;
                let ki_in_target = 0, ki_in_cur = 0, sumTot_target = 0, sumTot_cur = 0;
                for (let j = 0; j < n; j++) {
                    if (j === i) continue;
                    const w = cor[i][j] >= THRESHOLD ? cor[i][j] : 0;
                    if (comm[j] === c) ki_in_target += w;
                    if (comm[j] === curC) ki_in_cur += w;
                }
                for (let j = 0; j < n; j++) {
                    if (comm[j] === c) sumTot_target += kdeg[j];
                    if (comm[j] === curC && j !== i) sumTot_cur += kdeg[j];
                }
                const gain = (ki_in_target - ki_in_cur) / m
                    - kdeg[i] * (sumTot_target - sumTot_cur) / (2 * m * m);
                if (gain > bestGain) { bestGain = gain; bestC = c; }
            }
            if (bestC !== curC) { comm[i] = bestC; changed = true; }
        }
    }
    const uniq = [...new Set(comm)];
    comm = comm.map(c => uniq.indexOf(c));

    return { names, cor, comm, inDeg, outDeg, adj, edges, n };
}

// ── Force-Directed Graph ─────────────────────────────────────────────────────
function ForceGraph({ g, hovNode, setHovNode }) {
    const W = 700, H = 520;
    const [pos, setPos] = React.useState(null);
    const [drag, setDrag] = React.useState(null);
    const svgRef = React.useRef(null);
    const simRef = React.useRef(null); // simpan posisi simulasi tanpa trigger re-render tiap frame
    const dragRef = React.useRef(null); // node yang sedang diseret (dibaca oleh simulasi)

    React.useEffect(() => {
        if (!g) return;
        const numComm = new Set(g.comm).size;
        const commAngle = k => (2 * Math.PI * k) / numComm;
        const clusterR = 150;

        // Inisialisasi: tiap komunitas di klaster melingkar tersendiri
        // Setiap node diberi posisi unik — jitter deterministik per node
        const p = g.names.map((_, i) => {
            const k = g.comm[i];
            const membersOfK = g.names.map((_, x) => x).filter(x => g.comm[x] === k);
            const posInCluster = membersOfK.indexOf(i);
            const total = membersOfK.length;
            // Pusat klaster di lingkaran besar
            const cx = W / 2 + Math.cos(commAngle(k)) * clusterR;
            const cy = H / 2 + Math.sin(commAngle(k)) * clusterR;
            // Setiap anggota disebar melingkar di sekitar pusat klaster
            const spreadR = 25 + total * 3.5; // makin banyak anggota, makin lebar sebarannya
            const spreadA = (2 * Math.PI * posInCluster) / total;
            return {
                x: cx + Math.cos(spreadA) * spreadR,
                y: cy + Math.sin(spreadA) * spreadR,
                vx: 0, vy: 0,
            };
        });
        simRef.current = p;
        setPos(p.map(q => ({ ...q })));

        // Layout Fruchterman-Reingold dengan "suhu": panjang langkah dibatasi dan terus mengecil,
        // sehingga node tidak terlempar ke tepi kanvas walau edge-nya sedikit.
        const n = g.n;
        const k = Math.sqrt((W * H) / n) * 0.55; // jarak ideal antar node
        const MAX_IT = 400, PER_FRAME = 3, MARGIN = 30;
        const members = Array.from({ length: numComm }, (_, c) => g.names.map((_, i) => i).filter(i => g.comm[i] === c));
        let frame;
        let iter = 0;

        const tick = () => {
            const cur = simRef.current;
            const t = 40 * (1 - iter / MAX_IT) + 1; // suhu: 41 → 1
            const dx = new Array(n).fill(0), dy = new Array(n).fill(0);

            // Tolak-menolak (lebih kuat antar komunitas berbeda)
            for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
                const ex = cur[i].x - cur[j].x, ey = cur[i].y - cur[j].y;
                const d = Math.max(Math.hypot(ex, ey), 0.5);
                const f = (k * k / d) * (g.comm[i] === g.comm[j] ? 1 : 1.5);
                dx[i] += ex / d * f; dy[i] += ey / d * f;
                dx[j] -= ex / d * f; dy[j] -= ey / d * f;
            }
            // Tarik-menarik sepanjang edge
            for (const { i, j, w } of g.edges) {
                const ex = cur[i].x - cur[j].x, ey = cur[i].y - cur[j].y;
                const d = Math.max(Math.hypot(ex, ey), 0.5);
                const f = (d * d / k) * w * (g.comm[i] === g.comm[j] ? 1 : 0.5);
                dx[i] -= ex / d * f; dy[i] -= ey / d * f;
                dx[j] += ex / d * f; dy[j] += ey / d * f;
            }
            // Tarik ke centroid komunitas + gravitasi ke tengah
            for (const mem of members) {
                if (!mem.length) continue;
                const cx = mem.reduce((s2, i) => s2 + cur[i].x, 0) / mem.length;
                const cy = mem.reduce((s2, i) => s2 + cur[i].y, 0) / mem.length;
                for (const i of mem) { dx[i] += (cx - cur[i].x) * 0.08; dy[i] += (cy - cur[i].y) * 0.08; }
            }
            for (let i = 0; i < n; i++) { dx[i] += (W / 2 - cur[i].x) * 0.03; dy[i] += (H / 2 - cur[i].y) * 0.03; }

            // Terapkan dengan batas langkah = suhu, lalu clamp ke kanvas
            simRef.current = cur.map((q, i) => {
                if (i === dragRef.current) return q; // node yang sedang diseret tidak digeser simulasi
                const len = Math.hypot(dx[i], dy[i]) || 1;
                const lim = Math.min(len, t);
                return {
                    ...q,
                    x: Math.max(MARGIN, Math.min(W - MARGIN, q.x + dx[i] / len * lim)),
                    y: Math.max(MARGIN, Math.min(H - MARGIN, q.y + dy[i] / len * lim)),
                };
            });
            iter++;
        };

        const run = () => {
            for (let s2 = 0; s2 < PER_FRAME && iter < MAX_IT; s2++) tick();
            setPos(simRef.current.map(q => ({ ...q })));
            if (iter < MAX_IT) frame = requestAnimationFrame(run);
        };
        frame = requestAnimationFrame(run);
        return () => cancelAnimationFrame(frame);
    }, [g]); // eslint-disable-line

    const toSvg = e => {
        const b = svgRef.current.getBoundingClientRect();
        return [(e.clientX - b.left) * W / b.width, (e.clientY - b.top) * H / b.height];
    };

    const onNodeDown = (e, i) => {
        e.stopPropagation();
        setDrag(i);
        dragRef.current = i;
        svgRef.current.setPointerCapture(e.pointerId);
    };
    const onMove = e => {
        if (drag === null) return;
        const [x, y] = toSvg(e);
        if (simRef.current) simRef.current[drag] = { ...simRef.current[drag], x, y, vx: 0, vy: 0 };
        setPos(p => p.map((q, i) => i === drag ? { ...q, x, y } : q));
    };
    const onUp = () => { setDrag(null); dragRef.current = null; };

    if (!pos || !g) return <div style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>Menghitung layout…</div>;

    const numComm = new Set(g.comm).size;
    const maxIn = Math.max(...g.inDeg, 1);
    const nodeR = i => 5 + 11 * (g.inDeg[i] / maxIn);              // ukuran node = in-degree
    const colOf = i => COMM_COLORS[g.comm[i] % COMM_COLORS.length];
    const isHovConn = i => hovNode !== null && (i === hovNode || g.adj[hovNode].has(i));
    const labelMin = Math.max(1, [...g.inDeg].sort((x, y) => y - x)[Math.min(7, g.n - 1)]); // label 8 node teratas

    // Edge melengkung: titik kontrol digeser tegak lurus terhadap garis i→j,
    // jadi pasangan timbal-balik (i→j dan j→i) otomatis melengkung ke sisi berlawanan.
    // Ujung path dipendekkan sebesar radius node tujuan supaya panah tidak tertutup node.
    const edgePath = (i, j) => {
        const { x: x1, y: y1 } = pos[i], { x: x2, y: y2 } = pos[j];
        const dx = x2 - x1, dy = y2 - y1;
        const cx = (x1 + x2) / 2 - dy * CURVE, cy = (y1 + y2) / 2 + dx * CURVE;
        const ex = x2 - cx, ey = y2 - cy, el = Math.hypot(ex, ey) || 1;
        const t = nodeR(j) + 2;
        return `M${x1},${y1} Q${cx},${cy} ${x2 - (ex / el) * t},${y2 - (ey / el) * t}`;
    };

    return (
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', touchAction: 'none', userSelect: 'none', cursor: drag !== null ? 'grabbing' : 'default' }}
            onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <defs>
                {/* Satu arrowhead per komunitas, warnanya mengikuti warna komunitas asal edge */}
                {Array.from({ length: numComm }, (_, k) => (
                    <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5"
                        markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
                        <path d="M0,0 L10,5 L0,10 z" fill={COMM_COLORS[k % COMM_COLORS.length]} />
                    </marker>
                ))}
            </defs>
            <rect width={W} height={H} fill="#0d1117" rx={8} />

            {/* Edges (terarah, melengkung, berwarna sesuai komunitas node asal) */}
            {g.edges.map(({ i, j, w }) => {
                const t = (w - THRESHOLD) / (1 - THRESHOLD);
                const touch = hovNode === i || hovNode === j;
                const dim = hovNode !== null && !touch;
                return (
                    <path key={`${i}->${j}`} d={edgePath(i, j)} fill="none"
                        stroke={colOf(i)}
                        strokeWidth={touch ? 2 : 0.8 + 1.4 * t}
                        opacity={dim ? 0.05 : touch ? 0.95 : 0.35 + 0.4 * t}
                        markerEnd={`url(#arrow-${g.comm[i]})`}
                        style={{ pointerEvents: 'none' }} />
                );
            })}

            {/* Nodes */}
            {g.names.map((nm, i) => {
                const r = nodeR(i);
                const col = colOf(i);
                const dim = hovNode !== null && !isHovConn(i);
                return (
                    <g key={nm} style={{ cursor: 'pointer' }}
                        onPointerDown={e => onNodeDown(e, i)}
                        onMouseEnter={() => setHovNode(i)}
                        onMouseLeave={() => setHovNode(null)}>
                        <circle cx={pos[i].x} cy={pos[i].y} r={r}
                            fill={col} fillOpacity={dim ? 0.15 : 1}
                            stroke={hovNode === i ? '#fff' : '#0d1117'}
                            strokeWidth={hovNode === i ? 2 : 1.2} />
                        {(hovNode === i || g.inDeg[i] >= labelMin) &&
                            <text x={pos[i].x} y={pos[i].y - r - 3} textAnchor="middle"
                                style={{ fontSize: 9, fill: dim ? 'rgba(240,230,211,0.2)' : '#f0e6d3', fontWeight: 600, pointerEvents: 'none' }}>
                                {nm}
                            </text>}
                        <title>{`${nm}\nIn-degree: ${g.inDeg[i]}\nOut-degree: ${g.outDeg[i]}\nKomunitas: ${g.comm[i] + 1}`}</title>
                    </g>
                );
            })}
        </svg>
    );
}

// ── Adjacency Matrix Heatmap ─────────────────────────────────────────────────
function AdjMatrix({ g, hovNode, setHovNode }) {
    const [hovCell, setHovCell] = React.useState(null);
    if (!g) return null;

    const SIZE = 560;
    const PAD_L = 110, PAD_T = 10, PAD_B = 115;
    const cell = (SIZE - PAD_L) / g.n;

    const colorCell = v => {
        if (v < THRESHOLD) return 'rgba(255,255,255,0.03)';
        const t = (v - THRESHOLD) / (1 - THRESHOLD);
        const r = Math.round(20 + t * (192 - 20));
        const g2 = Math.round(10 + t * (57 - 10));
        const b = Math.round(10 + t * (43 - 10));
        return `rgb(${r},${g2},${b})`;
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${SIZE} ${SIZE + PAD_B}`} style={{ width: '100%', minWidth: 340 }}>
                <rect width={SIZE} height={SIZE + PAD_B} fill="#0d1117" />
                {/* Cells */}
                {g.names.map((_, i) => g.names.map((_, j) => {
                    const v = g.cor[i][j];
                    const hov = hovCell && hovCell[0] === i && hovCell[1] === j;
                    const rowHov = hovNode === i || hovNode === j;
                    return (
                        <rect key={`${i}-${j}`}
                            x={PAD_L + j * cell} y={PAD_T + i * cell}
                            width={cell - 0.5} height={cell - 0.5}
                            fill={colorCell(v)}
                            stroke={hov ? '#fff' : 'none'} strokeWidth={0.8}
                            opacity={hovNode !== null && !rowHov ? 0.3 : 1}
                            onMouseEnter={() => { setHovCell([i, j]); setHovNode(i); }}
                            onMouseLeave={() => { setHovCell(null); setHovNode(null); }}
                            style={{ cursor: 'crosshair' }}>
                            <title>{`${g.names[i]} × ${g.names[j]}: ${v.toFixed(3)}`}</title>
                        </rect>
                    );
                }))}
                {/* Row labels */}
                {g.names.map((nm, i) => (
                    <text key={`rl${i}`} x={PAD_L - 4} y={PAD_T + i * cell + cell * 0.65}
                        textAnchor="end" style={{ fontSize: Math.min(9, cell * 0.75), fill: hovNode === i ? '#f0e6d3' : 'rgba(210,195,180,0.55)' }}>
                        {nm}
                    </text>
                ))}
                {/* Col labels */}
                {g.names.map((nm, j) => (
                    <text key={`cl${j}`}
                        x={PAD_L + j * cell + cell * 0.5}
                        y={PAD_T + g.n * cell + 6}
                        transform={`rotate(90, ${PAD_L + j * cell + cell * 0.5}, ${PAD_T + g.n * cell + 6})`}
                        textAnchor="start" style={{ fontSize: Math.min(9, cell * 0.75), fill: hovNode === j ? '#f0e6d3' : 'rgba(210,195,180,0.55)' }}>
                        {nm}
                    </text>
                ))}
                {/* Legend */}
                {Array.from({ length: 40 }, (_, k) => {
                    const t = k / 39;
                    const v = THRESHOLD + t * (1 - THRESHOLD);
                    return <rect key={`lg${k}`} x={PAD_L + k * 8} y={SIZE + PAD_B - 22} width={8} height={12} fill={colorCell(v)} />;
                })}
                <text x={PAD_L} y={SIZE + PAD_B - 26} style={{ fontSize: 9, fill: 'rgba(210,195,180,0.5)' }}>{THRESHOLD.toFixed(2)}</text>
                <text x={PAD_L + 320} y={SIZE + PAD_B - 26} style={{ fontSize: 9, fill: 'rgba(210,195,180,0.5)' }}>1.00</text>
                <text x={PAD_L + 140} y={SIZE + PAD_B - 26} style={{ fontSize: 9, fill: 'rgba(210,195,180,0.5)' }}>Korelasi</text>
            </svg>
            {hovCell && g.cor[hovCell[0]][hovCell[1]] >= THRESHOLD && (
                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(210,195,180,0.7)', marginTop: 4 }}>
                    <span style={{ color: '#E69F00' }}>{g.names[hovCell[0]]}</span> × <span style={{ color: '#56B4E9' }}>{g.names[hovCell[1]]}</span>
                    {' '}— korelasi: <span style={{ color: '#f0e6d3', fontWeight: 600 }}>{g.cor[hovCell[0]][hovCell[1]].toFixed(3)}</span>
                </div>
            )}
        </div>
    );
}

// ── Background decoration (sama dengan Chapter1) ─────────────────────────────
const bgStyles = `
@keyframes c2Float{0%,100%{transform:translateY(0) translateX(0)}33%{transform:translateY(-16px) translateX(6px)}66%{transform:translateY(9px) translateX(-5px)}}
@keyframes c2Pulse{0%,100%{opacity:0.1;transform:scale(1)}50%{opacity:0.22;transform:scale(1.05)}}
@keyframes c2Scan{0%{transform:translateY(-100%);opacity:0}10%{opacity:0.3}90%{opacity:0.3}100%{transform:translateY(200vh);opacity:0}}
`;
function BgDecor() {
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <style>{bgStyles}</style>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 10% 20%, rgba(192,57,43,0.13) 0%, transparent 58%), radial-gradient(ellipse 55% 70% at 88% 80%, rgba(26,58,92,0.16) 0%, transparent 58%)' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(192,57,43,0.1) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, height: 2, top: 0, background: 'linear-gradient(90deg, transparent, rgba(192,57,43,0.22), transparent)', animation: 'c2Scan 14s linear infinite' }} />
            {Array.from({ length: 16 }, (_, i) => (
                <div key={i} style={{ position: 'absolute', width: 2 + (i % 3), height: 2 + (i % 3), top: `${5 + (i * 5.8) % 88}%`, left: `${3 + (i * 6.1) % 94}%`, background: i % 2 === 0 ? 'rgba(192,57,43,0.45)' : 'rgba(26,58,92,0.45)', borderRadius: '50%', animation: `c2Float ${10 + (i % 6) * 2}s ease-in-out infinite`, animationDelay: `${(i * 0.7) % 5}s` }} />
            ))}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Chapter2({ index }) {
    const rawData = useExcelData('/DataBerjejaringHierarki.xlsx');
    const [hovNode, setHovNode] = React.useState(null);

    const g = React.useMemo(() => rawData ? buildGraph(rawData) : null, [rawData]);

    const bg = 'linear-gradient(135deg, #0a0e1a 0%, #111827 40%, #1a0a0f 100%)';
    if (!g) return <Section index={index} bg={bg}><div style={{ color: '#aaa', textAlign: 'center' }}>Memuat data…</div></Section>;

    const numEdges = g.edges.length;
    const numComm = new Set(g.comm).size;
    const maxDegNode = g.names[g.inDeg.indexOf(Math.max(...g.inDeg))];

    const titleStyle = { fontFamily: "'Caveat', cursive", fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)', color: '#f0e6d3', lineHeight: 1.15 };
    const textStyle = { fontSize: '1rem', color: 'rgba(210,195,180,0.85)', lineHeight: 1.85, marginBottom: 16 };
    const hl = { color: colors.rose, fontWeight: 600 };

    return (
        <Section index={index} bg={bg}>
            <BgDecor />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1100, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 'clamp(60px, 8vw, 100px)' }}>

                {/* ── Header ── */}
                <FadeIn>
                    <ChapterLabel num={2} title="Visualisasi Berjejaring" />
                    <Divider style={{ margin: '0 0 24px 0' }} />
                    <h3 style={{ ...titleStyle, textAlign: 'center' }}>Provinsi mana yang punya pola kejahatan serupa?</h3>
                    <p style={{ ...textStyle, marginTop: 16, textAlign: 'center' }}>
                        Jaringan dibangun dari <span style={hl}>korelasi Pearson</span> profil kejahatan antar-provinsi (36 jenis kejahatan). Setiap provinsi menunjuk <span style={hl}>{TOP_K} provinsi</span> dengan korelasi tertinggi (syarat r ≥ <span style={hl}>{THRESHOLD}</span>), sehingga edge berarah <b>A → B</b>. Ukuran titik = in-degree, warna = komunitas (Louvain).
                    </p>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 }}>
                        {[
                            { num: g.n, label: 'Provinsi (Node)', col: colors.rose },
                            { num: numEdges, label: `Edge terarah (top-${TOP_K}, r ≥ ${THRESHOLD})`, col: colors.gold },
                            { num: numComm, label: 'Komunitas', col: '#56B4E9' },
                        ].map(({ num, label, col }) => (
                            <div key={label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 28px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: col }}>{num}</div>
                                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </FadeIn>

                {/* ── Force-Directed Graph + Narasi ── */}
                <FadeIn delay={0.1}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(28px, 4.5vw, 52px)', alignItems: 'flex-start' }}>
                        <div style={{ flex: '1.6 1 360px', display: 'flex', flexDirection: 'column', gap: 16, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                            <ChartCard title="Jaringan Kemiripan Profil Kejahatan Antar-Provinsi">
                                <ForceGraph g={g} hovNode={hovNode} setHovNode={setHovNode} />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 10, fontSize: '0.75rem', color: 'rgba(210,195,180,0.7)' }}>
                                    {Array.from({ length: numComm }, (_, k) => (
                                        <span key={k}><span style={{ color: COMM_COLORS[k % COMM_COLORS.length], fontWeight: 700 }}>●</span> Komunitas {k + 1}</span>
                                    ))}
                                </div>
                                <p style={{ fontSize: '0.73rem', color: '#666', textAlign: 'center', marginTop: 6 }}>
                                    Panah A → B: B termasuk provinsi paling mirip dengan A. Warna edge = komunitas asal. Seret node untuk mengatur posisi, hover untuk highlight. Ukuran node = in-degree.
                                </p>
                            </ChartCard>
                        </div>
                        <div style={{ flex: '1 1 240px' }}>
                            <h3 style={titleStyle}>Membaca jaringan kejahatan</h3>
                            <p style={{ ...textStyle, marginTop: 12 }}>
                                Dari <span style={hl}>{g.n} provinsi</span>, terbentuk <span style={hl}>{numEdges} edge terarah</span> (top-{TOP_K} tetangga paling mirip, korelasi ≥ {THRESHOLD}). Provinsi dengan in-degree tertinggi adalah <span style={hl}>{maxDegNode}</span> — profil kejahatannya paling sering menjadi 'rujukan' kemiripan bagi provinsi lain.
                            </p>
                            <p style={textStyle}>
                                Warna node menunjukkan <span style={hl}>{numComm} komunitas</span> hasil deteksi Louvain. Provinsi dalam satu komunitas cenderung memiliki komposisi jenis kejahatan yang serupa, meski tidak selalu berdekatan secara geografis.
                            </p>
                        </div>
                    </div>
                    {/* Kotak komunitas — full width di bawah baris grafik+narasi */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, width: '100%', marginTop: 24 }}>
                        {Array.from({ length: numComm }, (_, k) => {
                            const members = g.names.filter((_, i) => g.comm[i] === k);
                            return (
                                <div key={k} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', borderLeft: `3px solid ${COMM_COLORS[k % COMM_COLORS.length]}` }}>
                                    <div style={{ fontSize: '0.8rem', color: COMM_COLORS[k % COMM_COLORS.length], fontWeight: 700, marginBottom: 4 }}>Komunitas {k + 1} ({members.length} provinsi)</div>
                                    <div style={{ fontSize: '0.72rem', color: 'rgba(210,195,180,0.6)', lineHeight: 1.6 }}>{members.join(', ')}</div>
                                </div>
                            );
                        })}
                    </div>
                </FadeIn>

                {/* ── Adjacency Matrix ── */}
                <FadeIn delay={0.15}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(28px, 4.5vw, 52px)', alignItems: 'flex-start' }}>
                        <div style={{ flex: '1.6 1 360px' }}>
                            <ChartCard title={`Adjacency Matrix — korelasi ≥ ${THRESHOLD} ditampilkan berwarna`}>
                                <AdjMatrix g={g} hovNode={hovNode} setHovNode={setHovNode} />
                                <p style={{ fontSize: '0.73rem', color: '#666', textAlign: 'center', marginTop: 6 }}>
                                    Hover sel untuk detail korelasi. Baris/kolom diurutkan sesuai urutan data.
                                </p>
                            </ChartCard>
                        </div>
                        <div style={{ flex: '1 1 260px' }}>
                            <h3 style={titleStyle}>Membaca adjacency matrix</h3>
                            <p style={{ ...textStyle, marginTop: 12 }}>
                                Setiap sel menunjukkan korelasi antara dua provinsi. Sel <span style={hl}>merah gelap</span> berarti korelasi mendekati 1 — profil kejahatan sangat mirip. Sel gelap/transparan berarti korelasi di bawah threshold {THRESHOLD}.
                            </p>
                            <p style={textStyle}>
                                Pola <span style={{ color: colors.gold, fontWeight: 600 }}>blok diagonal</span> menunjukkan klaster provinsi yang saling mirip satu sama lain. Hover pada sel untuk melihat nilai korelasi tepat antara dua provinsi.
                            </p>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </Section>
    );
}