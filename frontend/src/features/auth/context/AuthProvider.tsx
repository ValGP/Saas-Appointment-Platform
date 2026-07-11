import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { tokenStorage } from "../../../shared/api/tokenStorage";
import { type CurrentUser } from "../../../shared/types/user";
import {
  getCurrentUser,
  login,
  persistAuthResponse,
  registerClient,
  type LoginPayload,
  type RegisterPayload,
} from "../api/authApi";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  user: CurrentUser | null;
  login: (payload: LoginPayload) => Promise<CurrentUser>;
  registerClient: (payload: RegisterPayload) => Promise<CurrentUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.get()) {
      clearSession();
      return;
    }

    try {
      setStatus("loading");
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setStatus("authenticated");
    } catch {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const handleLogin = useCallback(async (payload: LoginPayload) => {
    const response = await login(payload);
    const loggedUser = persistAuthResponse(response);
    setUser(loggedUser);
    setStatus("authenticated");
    return loggedUser;
  }, []);

  const handleRegisterClient = useCallback(async (payload: RegisterPayload) => {
    const response = await registerClient(payload);
    const loggedUser = persistAuthResponse(response);
    setUser(loggedUser);
    setStatus("authenticated");
    return loggedUser;
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      login: handleLogin,
      registerClient: handleRegisterClient,
      logout: clearSession,
      refreshUser,
    }),
    [clearSession, handleLogin, handleRegisterClient, refreshUser, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
