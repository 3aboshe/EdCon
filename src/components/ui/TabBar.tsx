
import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';

type ParentTab = 'dashboard' | 'performance' | 'homework' | 'messages' | 'profile';

interface TabBarProps {
    activeTab: ParentTab;
    onTabChange: (tab: ParentTab) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
    const { t } = useContext(AppContext);

    const tabs: { id: ParentTab; labelKey: string; icon: string }[] = [
        { id: 'dashboard', labelKey: 'dashboard', icon: 'fa-home' },
        { id: 'performance', labelKey: 'performance', icon: 'fa-chart-line' },
        { id: 'homework', labelKey: 'homework', icon: 'fa-book-open' },
        { id: 'messages', labelKey: 'messages', icon: 'fa-comments' },
        { id: 'profile', labelKey: 'profile', icon: 'fa-user-circle' },
    ];

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-gray-200">
            <div className="max-w-md mx-auto lg:max-w-none">
            <div className="flex justify-around">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center justify-center w-full py-2 px-1 text-center transition-colors duration-200 ${
                                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
                            }`}
                        >
                            <i className={`fas ${tab.icon} text-base sm:text-lg lg:text-xl ${isActive ? 'scale-110' : ''} transition-transform`}></i>
                            <span className="text-xs mt-1 font-medium">{t(tab.labelKey)}</span>
                        </button>
                    );
                })}
            </div>
            </div>
        </footer>
    );
};

export default TabBar;
