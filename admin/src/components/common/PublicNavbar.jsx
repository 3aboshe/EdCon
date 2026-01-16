import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function PublicNavbar() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem 3rem',
                background: 'linear-gradient(to bottom, rgba(0,51,102,0.9), transparent)',
            }}
        >
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}>
                    <img
                        src="/EdconaIcon.png"
                        alt="EdCona"
                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                    />
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
                    EdCona
                </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/contact')}
                    style={{
                        padding: '0.625rem 1.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.8)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                    }}
                    onMouseOver={(e) => e.target.style.color = 'white'}
                    onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
                >
                    {t('Contact Sales') || 'Contact Sales'}
                </button>

                <button
                    onClick={() => navigate('/login')}
                    style={{
                        padding: '0.625rem 1.5rem',
                        borderRadius: '9999px',
                        background: 'white',
                        color: '#003366',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 0 20px rgba(255,255,255,0.3)',
                        transition: 'all 0.3s',
                    }}
                    onMouseOver={(e) => e.target.style.boxShadow = '0 0 30px rgba(255,255,255,0.5)'}
                    onMouseOut={(e) => e.target.style.boxShadow = '0 0 20px rgba(255,255,255,0.3)'}
                >
                    {t('Login') || 'Login'}
                </button>
            </div>
        </motion.nav>
    );
}
