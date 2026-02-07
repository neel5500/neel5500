import { createContext, useContext, useMemo, useState } from 'react';
import { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem('pvd_session');
    return raw ? JSON.parse(raw) : null;
  });

  if (session?.token) setAuthToken(session.token);

  const value = useMemo(
    () => ({
      session,
      login: (next) => {
        localStorage.setItem('pvd_session', JSON.stringify(next));
        setAuthToken(next.token);
        setSession(next);
      },
      logout: () => {
        localStorage.removeItem('pvd_session');
        setAuthToken(null);
        setSession(null);
      }
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
