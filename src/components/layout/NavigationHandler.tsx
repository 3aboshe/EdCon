import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../../contexts/AppContext';

// NavigationHandler - handles automatic role-based redirects

const NavigationHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const userRole = user.role.toLowerCase();
      const expectedPath = `/${userRole}`;
      
      // Only redirect if we're not already on the correct path
      if (location.pathname !== expectedPath && location.pathname !== '/') {
        console.log(`Redirecting ${user.name} (${userRole}) to ${expectedPath}`);
        navigate(expectedPath, { replace: true });
      }
    }
  }, [user, navigate, location.pathname]);

  return <>{children}</>;
};

export default NavigationHandler;
