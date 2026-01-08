import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelector } from '../../components/ui/LanguageSelector';
import styles from './SchoolAdminLayout.module.css';

export function SchoolAdminLayout() {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: t('admin.dashboard'), end: true },
        { path: '/admin/users', icon: Users, label: t('admin.users') },
        { path: '/admin/academic', icon: BookOpen, label: t('admin.academic') },
        { path: '/admin/analytics', icon: BarChart3, label: t('admin.analytics') },
        { path: '/admin/tools', icon: Settings, label: t('admin.tools') },
    ];

    return (
        <div className={styles.layout}>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logo}>
                        <img src="/EdconaIcon.png" alt="EdCona" className={styles.logoIcon} />
                        <span>{t('common.app_name')}</span>
                    </div>
                    <button
                        className={styles.closeBtn}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles.active : ''}`
                            }
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>
                            {user?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className={styles.userDetails}>
                            <span className={styles.userName}>{user?.name}</span>
                            <span className={styles.userRole}>{t('admin.administrator')}</span>
                        </div>
                    </div>
                    <button
                        className={styles.logoutBtn}
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        <span>{t('admin.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {/* Top Bar */}
                <header className={styles.header}>
                    <button
                        className={styles.menuBtn}
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className={styles.pageTitle}>{t('admin.admin_panel')}</h1>
                    <LanguageSelector />
                </header>

                {/* Content */}
                <motion.div
                    className={styles.content}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Outlet />
                </motion.div>
            </main>
        </div>
    );
}

export default SchoolAdminLayout;
