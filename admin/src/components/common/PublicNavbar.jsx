import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function PublicNavbar() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { scrollY } = useScroll();

    // Advanced scroll transformations for an "alive" feel
    const navBackground = useTransform(
        scrollY,
        [0, 100],
        ['rgba(255, 255, 255, 0)', 'rgba(10, 25, 48, 0.7)']
    );

    const navBlur = useTransform(
        scrollY,
        [0, 100],
        ['blur(0px)', 'blur(20px)']
    );

    const navBorder = useTransform(
        scrollY,
        [0, 100],
        ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.1)']
    );

    const navPadding = useTransform(
        scrollY,
        [0, 100],
        ['1.5rem 2rem', '1rem 2rem']
    );

    const logoScale = useTransform(scrollY, [0, 100], [1, 0.9]);

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: navPadding,
                background: navBackground,
                backdropFilter: navBlur,
                borderBottom: `1px solid`,
                borderColor: navBorder,
                transition: 'padding 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
        >
            {/* Brand / Logo */}
            <motion.div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    scale: logoScale
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
            >
                <div style={{
                    width: '42px',
                    height: '42px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {/* Glowing effect behind logo */}
                    <div style={{
                        position: 'absolute',
                        inset: -10,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                        zIndex: -1,
                    }} />
                    <img
                        src="/logowhite.png"
                        alt="EdCona"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </div>
                <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'white',
                    letterSpacing: '-0.04em',
                    textTransform: 'uppercase',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    EdCona
                </span>
            </motion.div>

            {/* Navigation Navigation - Minimalist & Discrete */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2.5rem',
            }}>
                {['Solutions', 'Tech', 'Legacy'].map((item) => (
                    <motion.a
                        key={item}
                        href={`/${item.toLowerCase()}`}
                        whileHover={{ y: -2 }}
                        style={{
                            color: 'rgba(255,255,255,0.5)',
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            transition: 'color 0.3s ease',
                            display: 'none',
                        }}
                        className="nav-link-desktop"
                    >
                        {item}
                    </motion.a>
                ))}
            </div>

            {/* Actions - Impactful CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <motion.button
                    onClick={() => navigate('/login')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        padding: '0.8rem 2rem',
                        borderRadius: '2px', // Brutalist/Minimalist sharp edges
                        background: 'white',
                        color: '#0A1930',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                >
                    Access System
                </motion.button>
            </div>

            <style>{`
                @media (min-width: 1024px) {
                    .nav-link-desktop {
                        display: block !important;
                    }
                }
                .nav-link-desktop:hover {
                    color: white !important;
                }
            `}</style>
        </motion.nav>
    );
}
