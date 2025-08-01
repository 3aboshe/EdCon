import React, { useContext } from 'react';
import { AppContext } from '../../App';
import { APP_NAME } from '../../constants';

interface HeaderProps {
    title?: string;
    showBackButton?: boolean;
    onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, showBackButton = false, onBack }) => {
    const { t, logout, user } = useContext(AppContext);

    return (
        <header className="bg-slate-800 text-white p-4 shadow-md sticky top-0 z-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 w-1/3">
                    {showBackButton && (
                         <button onClick={onBack} className="text-xl hover:bg-slate-700 p-2 rounded-full">
                            <i className="fas fa-arrow-left"></i>
                        </button>
                    )}
                </div>
                <h1 className="text-xl font-bold text-center truncate w-1/3">{title || APP_NAME}</h1>
                <div className="flex items-center justify-end gap-2 w-1/3">
                    {user && (
                         <button onClick={logout} title={t('logout')} className="text-xl hover:bg-red-500 hover:text-white p-2 rounded-full">
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;