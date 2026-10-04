import React, { useRef } from 'react';
import coverImg from '../assets/cover.png';

function FallingAsh() {
    const particles = useRef(
        Array.from({ length: 30 }, (_, i) => ({
            key: i,
            size: 2 + (i * 13 % 4),
            left: (i * 337 % 100),
            dur: 8 + (i * 71 % 8),
            delay: (i * 53 % 120) / 10,
            opacity: 0.3 + (i * 7 % 4) * 0.1,
            isEmber: i % 5 === 0,
        }))
    ).current;

    return (
        <>
            <style>{`
                @keyframes ashFall {
                    0%   { transform: translateY(-20px) translateX(0) rotate(0deg);   opacity: 0; }
                    10%  { opacity: var(--op); }
                    85%  { opacity: var(--op); }
                    100% { transform: translateY(108vh) translateX(var(--sw)) rotate(180deg); opacity: 0; }
                }
                @keyframes emberGlow {
                    0%,100% { box-shadow: 0 0 3px 1px rgba(255,120,30,0.6); }
                    50%     { box-shadow: 0 0 6px 2px rgba(255,180,50,0.9); }
                }
            `}</style>
            {particles.map(p => (
                <div key={p.key} style={{
                    position: 'absolute',
                    top: '-2%',
                    left: `${p.left}%`,
                    width: p.size,
                    height: p.size,
                    borderRadius: p.isEmber ? '50%' : '30% 70% 60% 40%',
                    background: p.isEmber
                        ? `rgba(220, ${60 + (p.key * 17 % 60)}, 30, 0.85)`
                        : `rgba(${80 + (p.key * 11 % 40)}, ${80 + (p.key * 7 % 30)}, ${90 + (p.key * 5 % 20)}, 0.45)`,
                    pointerEvents: 'none',
                    zIndex: 4,
                    '--op': p.opacity,
                    '--sw': `${(p.key % 2 === 0 ? 1 : -1) * (10 + p.key % 20)}px`,
                    animation: `ashFall ${p.dur}s ease-in ${p.delay}s infinite${
                        p.isEmber ? `, emberGlow ${1.5 + p.key % 2}s ease-in-out ${p.delay}s infinite` : ''
                    }`,
                }} />
            ))}
        </>
    );
}

export default function Hero() {
    return (
        <>
            <style>{`
                @keyframes sayingFade {
                    0%,100% { opacity: 0.82; transform: translateY(0); }
                    50%     { opacity: 1;    transform: translateY(-4px); }
                }
            `}</style>

            <section style={{
                width: '100%',
                paddingBottom: '56.25%',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* ── Background ── */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${coverImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                    backgroundRepeat: 'no-repeat',
                    zIndex: 0,
                }} />

                {/* ── Falling Ash & Embers ── */}
                <FallingAsh />

                {/* ── Bottom gradient ── */}
                <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    height: '40%',
                    zIndex: 5,
                    pointerEvents: 'none',
                    background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(5,8,18,0.55) 50%, rgba(5,8,18,0.95) 80%, #050812 100%)`,
                }} />
            </section>

            {/* ── Saying text — di bawah cover ── */}
            <div style={{
                background: 'linear-gradient(180deg, #050812 0%, #0a0e1a 60%, #0f1220 100%)',
                textAlign: 'center',
                padding: 'clamp(32px, 5vw, 56px) clamp(24px, 8vw, 120px)',
            }}>
                <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: 'italic',
                    fontSize: 'clamp(1.2rem, 2.8vw, 1.9rem)',
                    color: 'rgba(201, 168, 76, 0.92)',
                    letterSpacing: '0.04em',
                    lineHeight: 1.65,
                    fontWeight: 600,
                    margin: '0 0 16px',
                    animation: 'sayingFade 5s ease-in-out infinite',
                    textShadow: '0 2px 12px rgba(201,168,76,0.15)',
                }}>
                    "Apakah Kejahatan Terjadi Begitu Saja,<br />atau Ada Pola yang Menyembunyikannya?"
                </p>
                <p style={{
                    fontSize: '0.72rem',
                    color: 'rgba(180,170,155,0.45)',
                    letterSpacing: 1.8,
                    fontFamily: "'Nunito', sans-serif",
                    margin: 0,
                }}>
                    © 2026 · Publikasi Statistik Kriminal 2024 · Badan Pusat Statistik
                </p>
            </div>
        </>
    );
}
