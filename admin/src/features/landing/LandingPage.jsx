import { motion } from 'framer-motion';
import { useRef } from 'react';
import { Layers, Shield, Zap, Globe, Target, Cpu } from 'lucide-react';
import PublicNavbar from '../../components/common/PublicNavbar';
import ScrollHero from './ScrollHero';

// ============================================================================
// DATA & CONSTANTS
// ============================================================================

const FEATURES = [
    {
        icon: <Layers size={24} />,
        title: 'UNIFIED ARCHITECTURE',
        description: 'Single source of truth for all educational operations, from grades to attendance.',
    },
    {
        icon: <Shield size={24} />,
        title: 'SECURE INFRASTRUCTURE',
        description: 'Bank-grade security protocols ensuring data privacy and integrity.',
    },
    {
        icon: <Zap size={24} />,
        title: 'REAL-TIME SYNC',
        description: 'Instant synchronization across web and mobile platforms for zero latency.',
    },
    {
        icon: <Globe size={24} />,
        title: 'SCALABLE REACH',
        description: 'Built to manage environments from single schools to national networks.',
    },
    {
        icon: <Target size={24} />,
        title: 'PRECISION ANALYTICS',
        description: 'Advanced data modeling to track and predict student performance.',
    },
    {
        icon: <Cpu size={24} />,
        title: 'CORE AUTOMATION',
        description: 'Automated workflows that reduce administrative burden by up to 60%.',
    },
];

const STATS = [
    { value: '250K+', label: 'DATA POINTS' },
    { value: '99.99%', label: 'AVAILABILITY' },
    { value: '15MS', label: 'LATENCY' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

function FeatureItem({ feature, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
                padding: '3rem',
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                transition: 'border-color 0.4s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
        >
            <div style={{ color: 'white', opacity: 0.8 }}>{feature.icon}</div>
            <h3 style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: 'white',
                letterSpacing: '0.1em',
                margin: 0,
            }}>
                {feature.title}
            </h3>
            <p style={{
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.7,
                margin: 0,
            }}>
                {feature.description}
            </p>
        </motion.div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function LandingPage() {
    return (
        <main style={{
            backgroundColor: '#0A1930',
            minHeight: '100vh',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <PublicNavbar />

            {/* HER0 - CANVAS ANIMATION */}
            <ScrollHero />

            {/* STATS SECTION - MINIMALIST */}
            <section style={{
                padding: '10rem 2rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'center',
                background: '#0A1930'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '4rem',
                }}>
                    {STATS.map((stat, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ duration: 1 }}
                                style={{
                                    fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                                    fontWeight: 900,
                                    letterSpacing: '-0.04em',
                                    marginBottom: '0.5rem'
                                }}
                            >
                                {stat.value}
                            </motion.div>
                            <div style={{
                                fontSize: '0.7rem',
                                letterSpacing: '0.3em',
                                color: 'rgba(255,255,255,0.4)',
                                textTransform: 'uppercase'
                            }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FEATURES SECTION - ASYMMETRICAL GRID */}
            <section style={{
                padding: '10rem 2.5rem',
                background: '#0A1930',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <div style={{ maxWidth: '1400px', width: '100%' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', marginBottom: '8rem' }}>
                        <div style={{ flex: '1 1 500px' }}>
                            <h2 style={{
                                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                                fontWeight: 900,
                                lineHeight: 1,
                                letterSpacing: '-0.04em',
                                color: 'white',
                                margin: 0
                            }}>
                                ARCHITECTED FOR <br />
                                <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}>EXCELLENCE.</span>
                            </h2>
                        </div>
                        <div style={{ flex: '1 1 400px', display: 'flex', alignItems: 'flex-end' }}>
                            <p style={{
                                fontSize: '1.1rem',
                                color: 'rgba(255,255,255,0.5)',
                                lineHeight: 1.8,
                                margin: 0
                            }}>
                                We believe in the power of precision. Every component of EdCona is engineered to provide a seamless, high-performance experience for institutions that demand the best.
                            </p>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '0', // Border-sharing look
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                        {FEATURES.map((feature, i) => (
                            <FeatureItem key={i} feature={feature} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA SECTION - BRUTALIST/MINIMALIST */}
            <section style={{
                padding: '15rem 2rem',
                textAlign: 'center',
                background: 'linear-gradient(180deg, #0A1930 0%, #000000 100%)',
                borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    style={{ maxWidth: '800px', margin: '0 auto' }}
                >
                    <h2 style={{
                        fontSize: 'clamp(2.5rem, 8vw, 6rem)',
                        fontWeight: 900,
                        letterSpacing: '-0.05em',
                        lineHeight: 0.9,
                        marginBottom: '4rem'
                    }}>
                        READY TO EVOLVE?
                    </h2>
                    <motion.button
                        onClick={() => window.location.href = '/login'}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: '1.5rem 4rem',
                            background: 'white',
                            color: '#0A1930',
                            border: 'none',
                            borderRadius: '0',
                            fontSize: '0.8rem',
                            fontWeight: 900,
                            letterSpacing: '0.3em',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                        }}
                    >
                        ENTER SYSTEM
                    </motion.button>
                </motion.div>
            </section>

            {/* FOOTER */}
            <footer style={{
                padding: '6rem 2.5rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4rem',
                background: '#000000'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '1400px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '2rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src="/logowhite.png" alt="EdCona" style={{ width: 40 }} />
                        <span style={{ fontWeight: 900, letterSpacing: '0.1em' }}>EDCONA</span>
                    </div>
                    <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                        {['SYSTEM', 'LEGAL', 'DOCS', 'CONTACT'].map((link) => (
                            <a
                                key={link}
                                href="#"
                                style={{
                                    color: 'rgba(255,255,255,0.3)',
                                    textDecoration: 'none',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.2em',
                                    transition: 'color 0.3s'
                                }}
                                onMouseEnter={(e) => e.target.style.color = 'white'}
                                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.3)'}
                            >
                                {link}
                            </a>
                        ))}
                    </div>
                </div>
                <div style={{
                    fontSize: '0.6rem',
                    color: 'rgba(255,255,255,0.2)',
                    letterSpacing: '0.1em'
                }}>
                    © {new Date().getFullYear()} EDCONA ANALYTICS. ALL RIGHTS RESERVED.
                </div>
            </footer>
        </main>
    );
}
