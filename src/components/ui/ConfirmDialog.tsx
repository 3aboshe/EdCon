import React from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    isLoading = false
}) => {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: 'fas fa-exclamation-triangle text-red-500',
                    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
                    iconBg: 'bg-red-100'
                };
            case 'warning':
                return {
                    icon: 'fas fa-exclamation-circle text-yellow-500',
                    confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
                    iconBg: 'bg-yellow-100'
                };
            case 'info':
                return {
                    icon: 'fas fa-info-circle text-blue-500',
                    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
                    iconBg: 'bg-blue-100'
                };
            default:
                return {
                    icon: 'fas fa-exclamation-triangle text-red-500',
                    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
                    iconBg: 'bg-red-100'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <i className={`${styles.icon} text-xl`}></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{message}</p>
                        </div>
                    </div>
                    
                    <div className="flex space-x-3 mt-6">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center ${styles.confirmButton}`}
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
