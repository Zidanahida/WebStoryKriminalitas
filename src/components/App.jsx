import React, { useState, useEffect } from 'react';
import Hero from './Hero';
import Intro from './Intro';
import Chapter1 from './Chapter1';
import Chapter2 from './Chapter2';
import Chapter3 from './Chapter3';
import Conclusion from './Conclusion';
import Footer from './Footer';

export default function App() {
    const [activeSection, setActiveSection] = useState(0);

    useEffect(() => {
        const sections = document.querySelectorAll('section[data-index]');
        const visibleSet = new Set();

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(e => {
                    const idx = Number(e.target.dataset.index);
                    if (e.isIntersecting) visibleSet.add(idx);
                    else visibleSet.delete(idx);
                });

                if (visibleSet.size > 0) {
                    setActiveSection(Math.min(...visibleSet));
                }
            },
            { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
        );

        sections.forEach(s => observer.observe(s));

        const handleScroll = () => {
            const scrollBottom = window.innerHeight + window.scrollY;
            const pageHeight = document.documentElement.scrollHeight;

            if (scrollBottom >= pageHeight - 80) {
                const allIndexes = Array.from(sections).map(s => Number(s.dataset.index));
                const maxIndex = Math.max(...allIndexes);
                setActiveSection(maxIndex);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const [navIdle, setNavIdle] = React.useState(false);
    const idleTimer = React.useRef(null);

    const resetIdle = () => {
        setNavIdle(false);
        clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => setNavIdle(true), 2500);
    };

    React.useEffect(() => {
        idleTimer.current = setTimeout(() => setNavIdle(true), 2500);
        window.addEventListener('mousemove', resetIdle);
        window.addEventListener('scroll', resetIdle, { passive: true });
        return () => {
            clearTimeout(idleTimer.current);
            window.removeEventListener('mousemove', resetIdle);
            window.removeEventListener('scroll', resetIdle);
        };
    }, []);

    const navLabels = [
        { short: 'Intro', full: 'Intro' },
        { short: 'Multivariat', full: 'Visualisasi Multivariat' },
        { short: 'Berjejaring', full: 'Visualisasi Berjejaring' },
        { short: 'Hierarki', full: 'Visualisasi Hierarki' },
        { short: 'Akhir', full: 'Kesimpulan' },
    ];

    const accentColors = [
        '#c9a84c',
        '#e05c3a',
        '#4DA3FF',
        '#52C41A',
        '#c9a84c',
    ];

    const scrollTo = (i) => {
        document.querySelector(`section[data-index="${i}"]`)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <>
            {/* DYNAMIC ISLAND NAVBAR */}
            <nav
                onMouseEnter={() => { setNavIdle(false); clearTimeout(idleTimer.current); }}
                onMouseLeave={() => { idleTimer.current = setTimeout(() => setNavIdle(true), 2500); }}
                style={{
                    position: 'fixed',
                    top: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(13,17,23,0.75)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    borderRadius: 999,
                    padding: '6px 14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
                    transition: 'all 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                    overflow: 'hidden',
                }}>
                {navIdle ? (
                    <span style={{
                        color: accentColors[activeSection],
                        fontSize: '0.75rem',
                        fontFamily: "'Lato', sans-serif",
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        padding: '2px 6px',
                        whiteSpace: 'nowrap',
                    }}>
                        {navLabels[activeSection].short}
                    </span>
                ) : (
                    navLabels.map((item, i) => {
                        const isActive = activeSection === i;
                        return (
                            <button
                                key={i}
                                onClick={() => scrollTo(i)}
                                title={item.full}
                                style={{
                                    background: isActive ? accentColors[i] : 'transparent',
                                    border: `1.5px solid ${isActive ? accentColors[i] : 'transparent'}`,
                                    color: isActive ? '#fff' : 'rgba(210,195,180,0.55)',
                                    padding: '4px 12px',
                                    borderRadius: 16,
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontFamily: "'Lato', sans-serif",
                                    fontWeight: isActive ? 700 : 400,
                                    letterSpacing: 0.3,
                                    transition: 'all 0.25s ease',
                                    whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                        e.currentTarget.style.color = '#f0e6d3';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'rgba(210,195,180,0.55)';
                                    }
                                }}
                            >
                                {item.short}
                            </button>
                        );
                    })
                )}
            </nav>

            {/* DOT NAVIGATION */}
            <nav style={{
                position: 'fixed',
                right: 20,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
            }}>
                {navLabels.map((lbl, i) => {
                    const isActive = activeSection === i;
                    return (
                        <button
                            key={i}
                            onClick={() => scrollTo(i)}
                            title={lbl}
                            style={{
                                width: isActive ? 10 : 7,
                                height: isActive ? 10 : 7,
                                borderRadius: '50%',
                                border: `2px solid ${isActive ? accentColors[i] : 'rgba(255,255,255,0.2)'}`,
                                background: isActive ? accentColors[i] : 'transparent',
                                cursor: 'pointer',
                                padding: 0,
                                transition: 'all 0.3s ease',
                                display: 'block',
                            }}
                        />
                    );
                })}
            </nav>

            <div style={{
                fontFamily: "'Lato', sans-serif",
                background: '#fffaf7',
                color: '#3d2b2b',
                overflowX: 'hidden',
            }}>
                <Hero index={0} />
                <Intro index={0} />
                <Chapter1 index={1} />
                <Chapter2 index={2} />
                <Chapter3 index={3} />
                <Conclusion index={4} />
                <Footer />
            </div>
        </>
    );
}