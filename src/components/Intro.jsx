import React from 'react';
import { Section, Divider, colors, FadeIn } from './shared';

const reasons = [
    { title: 'Data Resmi & Terpercaya', desc: 'Dibangun menggunakan dataset komprehensif dari publikasi Statistik Kriminal 2024/2025 yang bersumber dari BPS dan Kepolisian RI.' },
    { title: 'Variasi Karakteristik Wilayah', desc: 'Proyeksi multivariat digunakan untuk membedah anomali, seperti ekstremitas kepadatan penduduk, dan memetakan profil kejahatan unik di tiap daerah.' },
    { title: 'Jaringan Kemiripan Provinsi', desc: 'Analisis berjejaring (network) menghubungkan 34 provinsi di Indonesia untuk melihat klaster wilayah mana saja yang memiliki wajah dan karakteristik kriminalitas serupa.' },
    { title: 'Struktur Hierarki Kejahatan', desc: 'Visualisasi hierarki memecah data dari tingkat nasional, gugus pulau, hingga level provinsi untuk mengevaluasi dominasi kasus secara interaktif.' },
];

export default function Intro({ index }) {
    return (
        <Section 
            index={index} 
            bg="linear-gradient(135deg, #0a0e1a 0%, #111827 40%, #1a0a0f 100%)"
        >

            <FadeIn>
                <h2 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(1.6rem, 3.2vw, 2.4rem)',
                    color: '#f0e6d3',
                    textAlign: 'center',
                    marginBottom: 16,
                }}>
                    Mengapa Menganalisis Kriminalitas Nusantara?
                </h2>
                <Divider />
                <p style={{
                    maxWidth: 580,
                    margin: '0 auto 36px',
                    color: 'rgba(200,185,170,0.75)',
                    lineHeight: 1.9,
                    fontSize: '1rem',
                    fontFamily: "'Lora', serif",
                    fontStyle: 'italic',
                    letterSpacing: '0.02em',
                    textAlign: 'center',
                }}>
                    Di balik angka statistik, tersimpan pola kompleks tentang kerentanan wilayah,
                    ketimpangan sosial, dan karakteristik kejahatan yang unik di setiap provinsi.
                </p>
            </FadeIn>

            {/* GRID */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 20,
                maxWidth: 800,
                width: '100%',
                padding: '0 20px',
                margin: '0 auto',
                alignItems: 'stretch'
            }}>
                {reasons.map((r, i) => (
                    <FadeIn key={i} delay={i * 0.1}>
                        <div
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 20,
                                padding: '24px 28px',
                                height: 200, 
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                textAlign: 'left',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
                                transition: 'transform 0.3s, box-shadow 0.3s',
                                cursor: 'default',
                                boxSizing: 'border-box',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';

                                const img = e.currentTarget.querySelector('img');
                                if (img) img.style.transform = 'scale(1.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)';

                                const img = e.currentTarget.querySelector('img');
                                if (img) img.style.transform = 'scale(1)';
                            }}
                        >
                            
                            {/* TEXT */}
                            <div>
                                <h3 style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: '1.05rem',
                                    color: colors.gold,
                                    marginBottom: 8
                                }}>
                                    {r.title}
                                </h3>

                                <p style={{
                                    fontSize: '0.85rem',
                                    color: 'rgba(200,185,170,0.65)',
                                    lineHeight: 1.6
                                }}>
                                    {r.desc}
                                </p>
                            </div>
                        </div>
                    </FadeIn>
                ))}
            </div>

        </Section>
    );
}