import React, { useRef, useState, useEffect } from 'react';
import { Section } from './shared';

function useInView(threshold = 0.3) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVisible(true); },
            { threshold }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold]);
    return [ref, visible];
}

const lines = [
    { delay: 0.1, text: 'Jadi apakah pola kejahatan bisa diprediksi dan dicegah?' },
    { delay: 0.4, text: 'Data tidak memberikan jawaban tunggal. Yang ia ungkapkan adalah bahwa kejahatan bukan fenomena acak — ia tumbuh dari ketimpangan, kepadatan, dan kerentanan struktural yang berbeda di setiap wilayah.' },
    { delay: 0.8, text: 'Dan mungkin itulah justru pesannya. Memahami pola bukan berarti menerima kejahatan sebagai takdir. Ia adalah langkah pertama untuk merancang kebijakan yang lebih tepat sasaran.' },
    { delay: 1.2, text: 'Angka-angka di atas adalah petanya. Perjalanan menuju keamanan yang lebih merata masih terus berlanjut.' },
];

export default function Conclusion({ index }) {
    const [containerRef, containerVisible] = useInView(0.2);

    return (
        <Section
            index={index}
            bg="linear-gradient(135deg, #0a0e1a 0%, #111827 40%, #1a0a0f 100%)"
            style={{ justifyContent: 'center', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}
        >
            {/* Background dekoratif */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', width: 500, height: 500,
                    borderRadius: '50%', top: '-10%', left: '-10%',
                    background: 'radial-gradient(circle, rgba(192,57,43,0.1) 0%, transparent 70%)',
                }} />
                <div style={{
                    position: 'absolute', width: 400, height: 400,
                    borderRadius: '50%', bottom: '-5%', right: '-5%',
                    background: 'radial-gradient(circle, rgba(46,109,164,0.1) 0%, transparent 70%)',
                }} />
                <div style={{
                    position: 'absolute', top: '50%', left: '5%', right: '5%',
                    height: 1, background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.12), transparent)',
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(circle, rgba(201,168,76,0.06) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />
            </div>

            {/* Konten Teks */}
            <div
                ref={containerRef}
                style={{
                    maxWidth: 720, width: '100%', zIndex: 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', gap: 0, padding: 'clamp(16px, 4vw, 40px)',
                }}
            >
                <div style={{
                    opacity: containerVisible ? 1 : 0,
                    transform: containerVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.6s ease 0s, transform 0.6s ease 0s',
                    fontSize: '0.7rem', letterSpacing: 4,
                    textTransform: 'uppercase', color: '#c9a84c',
                    marginBottom: 20,
                }}>
                    Penutup
                </div>

                <div style={{
                    opacity: containerVisible ? 1 : 0,
                    transition: 'opacity 0.6s ease 0.1s',
                    display: 'flex', alignItems: 'center', gap: 12,
                    marginBottom: 40,
                }}>
                    <div style={{ width: 40, height: 1, background: '#c9a84c', opacity: 0.4 }} />
                    <span style={{ fontSize: '1rem', opacity: 0.7 }}>🔍</span>
                    <div style={{ width: 40, height: 1, background: '#c9a84c', opacity: 0.4 }} />
                </div>

                {lines.map((line, i) => (
                    <div
                        key={i}
                        style={{
                            opacity: containerVisible ? 1 : 0,
                            transform: containerVisible ? 'translateY(0)' : 'translateY(20px)',
                            transition: `opacity 0.7s ease ${line.delay}s, transform 0.7s ease ${line.delay}s`,
                            marginBottom: i === 0 ? 32 : 24,
                            width: '100%',
                        }}
                    >
                        {i === 0 ? (
                            <p style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                                color: '#e05c3a',
                                lineHeight: 1.6,
                                fontStyle: 'italic',
                                margin: 0,
                            }}>
                                "{line.text}"
                            </p>
                        ) : i === lines.length - 1 ? (
                            <p style={{
                                fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
                                color: '#c9a84c',
                                lineHeight: 1.8,
                                margin: 0,
                                fontStyle: 'italic',
                                opacity: 0.9,
                            }}>
                                — {line.text}
                            </p>
                        ) : (
                            <p style={{
                                fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)',
                                color: 'rgba(210,195,180,0.85)',
                                lineHeight: 1.9,
                                margin: 0,
                            }}>
                                {line.text}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </Section>
    );
}
