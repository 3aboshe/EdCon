import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

interface HeaderProps {
  user?: {
    name: string;
    role: string;
  } | null;
  onLogout: () => void;
  showLanguageSelector?: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, showLanguageSelector = true }) => {
  const { t } = useTranslation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {t('app_name')}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {showLanguageSelector && <LanguageSelector />}
            
            {user && (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">
                  {t('welcome_user', { user })}
                </span>
                
                <button
                  onClick={onLogout}
                  className="text-sm font-medium text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md px-3 py-2"
                >
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;