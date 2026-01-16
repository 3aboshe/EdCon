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
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12"
        >
            {/* Brand */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                    <img src="/hero-assets/logo_2d_start.png" alt="EdCona" className="w-6 h-6 object-contain brightness-200" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">EdCona</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/contact')}
                    className="hidden md:block px-6 py-2.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                    {t('Contact Sales') || 'Contact Sales'}
                </button>

                <button
                    onClick={() => navigate('/login')}
                    className="group relative px-6 py-2.5 rounded-full bg-white text-[#003366] text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 active:scale-95 overflow-hidden"
                >
                    <span className="relative z-10">{t('Login') || 'Login'}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
                </button>
            </div>
        </motion.nav>
    );
}
