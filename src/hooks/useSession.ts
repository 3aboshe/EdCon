import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { 
  saveUserSession, 
  loadUserSession, 
  clearUserSession, 
  initActivityTracking, 
  stopActivityTracking 
} from '../utils/sessionManager';
import { realTimeManager } from '../utils/realTimeManager';

export const useSession = () => {
  const [user, setUser] = useState<User | null>(null);

  // Load session on mount
  useEffect(() => {
    const storedSession = loadUserSession();
    if (storedSession?.user) {
      setUser(storedSession.user);
    }
  }, []);

  const login = useCallback((newUser: User, token: string) => {
    setUser(newUser);
    saveUserSession(newUser, token);
    initActivityTracking();
    
    // Start real-time updates
    realTimeManager.startPolling();
    realTimeManager.requestNotificationPermission();
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearUserSession();
    stopActivityTracking();
    realTimeManager.stopPolling();
  }, []);

  return {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };
};
