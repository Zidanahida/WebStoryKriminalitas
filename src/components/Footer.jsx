import React from 'react';

export default function Footer() {
    return (
        <footer style={{
            position: 'relative',
            background: 'linear-gradient(180deg, #0a0e1a 0%, #060810 100%)',
            color: '#7a8a9a',
            minHeight: '30vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: 'clamp(32px, 5vw, 48px) clamp(24px, 5vw, 40px)',
            gap: 8,
            boxSizing: 'border-box',
            width: '100%',
            overflow: 'hidden',
        }}>
            {/* garis pemisah */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'min(86vw, 980px)',
                height: 1,
                background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.25), transparent)',
                pointerEvents: 'none',
            }} />

            {/* dot grid */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'radial-gradient(circle, rgba(201,168,76,0.05) 1px, transparent 1px)',
                backgroundSize: '36px 36px',
            }} />

            <h2 style={{
                fontFamily: "'Playfair Display', serif",
                color: '#c9a84c',
                fontSize: '1.8rem',
                marginBottom: 8,
                position: 'relative',
                zIndex: 1,
            }}>
                Kriminalitas Nusantara — Data Story
            </h2>

            <p style={{
                fontSize: '0.9rem',
                color: 'rgba(180,170,155,0.55)',
                maxWidth: 500,
                lineHeight: 1.7,
                position: 'relative',
                zIndex: 1,
            }}>
                Visualisasi data kriminalitas 34 provinsi Indonesia — bersumber dari
                Publikasi Statistik Kriminal 2024/2025, Badan Pusat Statistik &amp; Kepolisian RI.
            </p>

            <p style={{
                fontSize: '0.75rem',
                color: 'rgba(150,140,125,0.5)',
                marginTop: 20,
                position: 'relative',
                zIndex: 1,
            }}>
                © 2026 · Kelompok 2 - Visualisasi Data
            </p>
        </footer>
    );
}
