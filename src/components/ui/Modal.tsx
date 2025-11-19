
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../contexts/AppContext';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string | React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
    const { i18n } = useTranslation();
    const dir = ['ar', 'ku-sorani', 'ku-badini', 'syr'].includes(i18n.language) ? 'rtl' : 'ltr';

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 animate-fadeIn"
            onClick={onClose}
            style={{
                animation: 'fadeIn 0.2s ease-out'
            }}
        >
            <div
                dir={dir}
                className={`bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col transform transition-all duration-300 ${className}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                    animation: 'scaleIn 0.3s ease-out'
                }}
            >
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl hover:rotate-90 transition-transform duration-200">
                        &times;
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.9) translateY(-20px);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default Modal;
