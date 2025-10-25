import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ 
  children, 
  variant = 'info',
  className = ''
}) => {
  const baseClasses = 'p-4 rounded-md border';
  
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="flex">
        <div className="ml-3">
          <div className="text-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;