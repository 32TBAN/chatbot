import {
  createContext,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { getSessionUser, getSessionToken, login, logout, register } from "@/services/auth-service";
import { validateLogin, validateRegister } from "@/lib/validation/auth";
import type { AuthMode, AuthStatus, AuthUser, LoginValues, RegisterValues } from "@/types/auth";

type AuthContextValue = {
  authBusy: boolean;
  authMode: AuthMode;
  authStatus: AuthStatus | null;
  isAuthenticated: boolean;
  isSessionReady: boolean;
  loginErrors: Partial<Record<keyof LoginValues, string>>;
  loginValues: LoginValues;
  registerErrors: Partial<Record<keyof RegisterValues, string>>;
  registerValues: RegisterValues;
  logoutBusy: boolean;
  sessionUser: AuthUser | null;
  refreshSession: () => Promise<AuthUser | null>;
  getAccessToken: () => string | null;
  setSessionUser: Dispatch<SetStateAction<AuthUser | null>>;
  setLoginValues: Dispatch<SetStateAction<LoginValues>>;
  setRegisterValues: Dispatch<SetStateAction<RegisterValues>>;
  submitLogin: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  submitRegister: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  switchMode: (mode: AuthMode) => void;
  performLogout: () => Promise<void>;
  invalidateSession: (message?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const initialLogin: LoginValues = {
  email: "",
  password: "",
};

const initialRegister: RegisterValues = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [loginValues, setLoginValues] = useState<LoginValues>(initialLogin);
  const [registerValues, setRegisterValues] = useState<RegisterValues>(initialRegister);
  const loginErrors = validateLogin(loginValues);
  const registerErrors = validateRegister(registerValues);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const user = await getSessionUser();
      if (cancelled) return;
      setSessionUser(user);
      setIsSessionReady(true);
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthStatus(null);
  };

  const refreshSession = async () => {
    const user = await getSessionUser();
    setSessionUser(user);
    return user;
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.values(loginErrors).some(Boolean)) {
      setAuthStatus({ tone: "error", message: "Revisa tu correo y tu contrasena antes de continuar." });
      return;
    }

    setAuthBusy(true);
    setAuthStatus(null);
    const result = await login(loginValues);
    setAuthBusy(false);

    if (!result.ok) {
      setAuthStatus({ tone: "error", message: result.message });
      return;
    }

    setSessionUser(result.user);
  };

  const submitRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.values(registerErrors).some(Boolean)) {
      setAuthStatus({ tone: "error", message: "Revisa tus datos antes de crear la cuenta." });
      return;
    }

    setAuthBusy(true);
    setAuthStatus(null);
    const result = await register(registerValues);
    setAuthBusy(false);

    if (!result.ok) {
      setAuthStatus({ tone: "error", message: result.message });
      return;
    }

    if (result.user) {
      setSessionUser(result.user);
      return;
    }

    setLoginValues((current) => ({ ...current, email: result.email, password: "" }));
    setRegisterValues((current) => ({ ...current, password: "", confirmPassword: "" }));
    setAuthMode("login");
    setAuthStatus({ tone: "success", message: "Tu cuenta esta lista. Ahora entra para continuar." });
  };

  const invalidateSession = async (message = "Tu sesion vencio. Vuelve a entrar para seguir usando WhatsFlow.") => {
    setLogoutBusy(true);
    await logout();
    setLogoutBusy(false);
    setSessionUser(null);
    setAuthMode("login");
    setAuthStatus({ tone: "warning", message });
  };

  const performLogout = async () => {
    await invalidateSession("Saliste de tu cuenta correctamente.");
    setAuthStatus({ tone: "neutral", message: "Saliste de tu cuenta correctamente." });
  };

  return (
    <AuthContext.Provider
      value={{
        authBusy,
        authMode,
        authStatus,
        isAuthenticated: Boolean(sessionUser),
        isSessionReady,
        loginErrors,
        loginValues,
        registerErrors,
        registerValues,
        logoutBusy,
        performLogout,
        invalidateSession,
        refreshSession,
        sessionUser,
        getAccessToken: getSessionToken,
        setSessionUser,
        setLoginValues,
        setRegisterValues,
        submitLogin,
        submitRegister,
        switchMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
