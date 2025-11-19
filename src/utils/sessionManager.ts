import { User } from '../types';

// Cookie utilities
export const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  // Secure cookie settings
  const isProduction = window.location.protocol === 'https:';
  const secureFlag = isProduction ? 'Secure; ' : '';
  const sameSiteFlag = isProduction ? 'SameSite=None; ' : 'SameSite=Lax; ';
  
  const cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; ${secureFlag}${sameSiteFlag}`;
  document.cookie = cookieString;
  
  console.log('Setting cookie:', cookieString);
  console.log('All cookies after setting:', document.cookie);
};

export const getCookie = (name: string): string | null => {
  console.log('Getting cookie:', name);
  console.log('All cookies:', document.cookie);
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
      console.log('Found cookie value:', value);
      return value;
    }
  }
  console.log('Cookie not found');
  return null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Test function to verify cookie functionality
export const testCookies = () => {
  console.log('Testing cookie functionality...');
  
  // Test setting a cookie
  setCookie('test_cookie', 'test_value', 1);
  
  // Test getting the cookie
  const retrieved = getCookie('test_cookie');
  console.log('Retrieved test cookie:', retrieved);
  
  // Test localStorage
  localStorage.setItem('test_storage', 'test_value');
  const storageValue = localStorage.getItem('test_storage');
  console.log('Retrieved test localStorage:', storageValue);
  
  return {
    cookieSet: retrieved === 'test_value',
    localStorageSet: storageValue === 'test_value'
  };
};

// Make test function globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).testCookies = testCookies;
}

// Session management
export const SESSION_KEYS = {
  USER_DATA: 'edcon_user_data',
  SESSION_TOKEN: 'edcon_session_token',
  LAST_ACTIVITY: 'edcon_last_activity',
} as const;

export interface StoredSession {
  user: User;
  token: string;
}

export const saveUserSession = (user: User, token: string) => {
  try {
    console.log('Saving session for user:', user.name, 'ID:', user.id);
    
    // Save user data to localStorage for immediate access
    localStorage.setItem(SESSION_KEYS.USER_DATA, JSON.stringify(user));
    console.log('Saved to localStorage:', SESSION_KEYS.USER_DATA);
    
    // Save session token as cookie for persistence across browser sessions
    setCookie(SESSION_KEYS.SESSION_TOKEN, token, 30); // 30 days
    console.log('Attempting to save cookie:', SESSION_KEYS.SESSION_TOKEN, 'with value:', '***');
    
    // Update last activity
    updateLastActivity();
    
    console.log('Session saved successfully for user:', user.name);
  } catch (error) {
    console.error('Error saving user session:', error);
  }
};

export const loadUserSession = (): StoredSession | null => {
  try {
    // Check if session token exists
    const sessionToken = getCookie(SESSION_KEYS.SESSION_TOKEN);
    if (!sessionToken) {
      console.log('No session token found');
      return null;
    }
    
    // Load user data
    const userData = localStorage.getItem(SESSION_KEYS.USER_DATA);
    if (!userData) {
      console.log('No user data found in localStorage');
      clearUserSession();
      return null;
    }
    
    // Parse and validate user data
    const user = JSON.parse(userData) as User;
    if (!user.id || !user.name || !user.role) {
      console.log('Invalid user data structure');
      clearUserSession();
      return null;
    }
    
    // Check session validity (30 days max)
    const lastActivity = localStorage.getItem(SESSION_KEYS.LAST_ACTIVITY);
    if (lastActivity) {
      const lastActivityTime = new Date(lastActivity);
      const now = new Date();
      const daysSinceLastActivity = (now.getTime() - lastActivityTime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastActivity > 30) {
        console.log('Session expired after 30 days');
        clearUserSession();
        return null;
      }
    }
    
    updateLastActivity();
    console.log('Session successfully loaded for user:', user.name);
    return { user, token: sessionToken };
  } catch (error) {
    console.error('Error loading user session:', error);
    clearUserSession();
    return null;
  }
};

export const clearUserSession = () => {
  try {
    localStorage.removeItem(SESSION_KEYS.USER_DATA);
    localStorage.removeItem(SESSION_KEYS.LAST_ACTIVITY);
    deleteCookie(SESSION_KEYS.SESSION_TOKEN);
    console.log('Session cleared');
  } catch (error) {
    console.error('Error clearing user session:', error);
  }
};

export const updateLastActivity = () => {
  try {
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, new Date().toISOString());
  } catch (error) {
    console.error('Error updating last activity:', error);
  }
};

export const isSessionValid = (): boolean => {
  const sessionToken = getCookie(SESSION_KEYS.SESSION_TOKEN);
  const userData = localStorage.getItem(SESSION_KEYS.USER_DATA);
  return !!(sessionToken && userData);
};

// Auto-update last activity on user interaction
let activityTimer: NodeJS.Timeout | null = null;

export const initActivityTracking = () => {
  const updateActivity = () => {
    if (isSessionValid()) {
      updateLastActivity();
    }
  };

  // Update activity every 5 minutes
  if (activityTimer) {
    clearInterval(activityTimer);
  }
  activityTimer = setInterval(updateActivity, 5 * 60 * 1000);

  // Update on user interactions
  const events = ['click', 'keypress', 'scroll', 'mousemove'];
  events.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });
};

export const stopActivityTracking = () => {
  if (activityTimer) {
    clearInterval(activityTimer);
    activityTimer = null;
  }
};
