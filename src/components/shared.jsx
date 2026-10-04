import React, { useEffect, useRef, useState } from 'react';

export const colors = {
    white: '#e8e4dc',
    blush: '#c0392b',
    rose: '#e05c3a',
    gold: '#c9a84c',
    sage: '#4a7c6f',
    dark: '#ddd5c8',
    soft: '#0d1117',
    blue: '#2e6da4',
    orange: '#d4622a',
};

export function Section({ index, bg, children, style = {} }) {
    return (
        <section
            data-index={index}
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 40px)',
                background: bg,
                position: 'relative',
                overflow: 'hidden',   /* was 'visible' — caused horizontal scroll */
                scrollSnapAlign: 'start',
                boxSizing: 'border-box',
                width: '100%',
                ...style,
            }}
        >
            {children}
        </section>
    );
}

export function Divider() {
    return <div style={{ width: 60, height: 2, background: colors.gold, margin: '0 auto 28px', borderRadius: 2 }} />;
}

export function ChapterLabel({ num, title }) {
    return (
        <>
            <p style={{ fontSize: '0.75rem', letterSpacing: 3, textTransform: 'uppercase', color: colors.gold, marginBottom: 6, textAlign: 'center' }}>
                {title || `Chapter ${num}`}
            </p>
        </>
    );
}

export function ChartCard({ title, children, style = {} }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 'clamp(16px, 3vw, 28px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            flex: 1, minWidth: 'min(280px, 100%)', width: '100%', boxSizing: 'border-box', ...style
        }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: '#e0d0c0', marginBottom: 16, textAlign: 'center' }}>
                {title}
            </h3>
            {children}
        </div>
    );
}

export function StatBox({ num, label, color = colors.rose }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);
    const numericVal = parseFloat(String(num).replace(/[^0-9.]/g, ''));
    const prefix = String(num).startsWith('+') ? '+' : '';
    const suffix = String(num).includes('%') ? '%' : '';

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                let start = 0;
                const step = numericVal / 60;
                const timer = setInterval(() => {
                    start += step;
                    if (start >= numericVal) { setDisplay(numericVal); clearInterval(timer); }
                    else setDisplay(start);
                }, 16);
            }
        }, { threshold: 0.5 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [numericVal]);

    const formatted = numericVal % 1 !== 0
        ? (prefix + display.toFixed(1) + suffix)
        : (prefix + Math.round(display).toLocaleString() + suffix);

    return (
        <div ref={ref} style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 'clamp(16px, 3vw, 24px) clamp(20px, 4vw, 32px)', textAlign: 'center',
            borderTop: `4px solid ${color}`, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: 'min(160px, 100%)', flex: 1
        }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.4rem', color }}>{formatted}</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{label}</div>
        </div>
    );
}

export function FadeIn({ children, delay = 0 }) {
    const [visible, setVisible] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
        }}>
            {children}
        </div>
    );
}