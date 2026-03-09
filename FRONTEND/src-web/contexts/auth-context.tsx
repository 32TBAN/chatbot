import {
  createContext,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSessionUser, login, logout, register, requestPasswordReset } from "@/services/auth-service";
import { validateEmail, validateLogin, validateRegister } from "@/lib/validation/auth";
import type { AuthMode, AuthStatus, AuthUser, LoginValues, RegisterValues } from "@/types/auth";

type AuthContextValue = {
  authBusy: boolean;
  authMode: AuthMode;
  authStatus: AuthStatus | null;
  isAuthenticated: boolean;
  isSessionReady: boolean;
  loginErrors: Partial<Record<keyof LoginValues, string>>;
  loginValues: LoginValues;
  logoutBusy: boolean;
  registerErrors: Partial<Record<keyof RegisterValues, string>>;
  registerValues: RegisterValues;
  sessionUser: AuthUser | null;
  setLoginValues: Dispatch<SetStateAction<LoginValues>>;
  setRegisterValues: Dispatch<SetStateAction<RegisterValues>>;
  submitLogin: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  submitRecover: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  submitRegister: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  switchMode: (mode: AuthMode) => void;
  performLogout: () => Promise<void>;
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

  const loginErrors = useMemo(() => validateLogin(loginValues), [loginValues]);
  const registerErrors = useMemo(() => validateRegister(registerValues), [registerValues]);

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

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.values(loginErrors).some(Boolean)) {
      setAuthStatus({ tone: "error", message: "Revisa el email y la contrasena antes de continuar." });
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
      setAuthStatus({ tone: "error", message: "Corrige los datos del registro antes de continuar." });
      return;
    }

    setAuthBusy(true);
    setAuthStatus(null);
    const result = await register({
      name: registerValues.name,
      phone: registerValues.phone,
      email: registerValues.email,
      password: registerValues.password,
    });
    setAuthBusy(false);

    if (!result.ok) {
      setAuthStatus({
        tone: result.code === "email_exists" ? "warning" : "error",
        message: result.message,
      });
      if (result.code === "email_exists") {
        setLoginValues((current) => ({ ...current, email: registerValues.email }));
      }
      return;
    }

    setSessionUser(result.user);
  };

  const submitRecover = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailError = validateEmail(loginValues.email);
    if (emailError) {
      setAuthStatus({ tone: "error", message: emailError });
      return;
    }

    setAuthBusy(true);
    setAuthStatus(null);
    const result = await requestPasswordReset({ email: loginValues.email });
    setAuthBusy(false);
    setAuthStatus({
      tone: result.ok ? "success" : result.code === "not_found" ? "warning" : "error",
      message: result.message,
    });
  };

  const performLogout = async () => {
    setLogoutBusy(true);
    await logout();
    setLogoutBusy(false);
    setSessionUser(null);
    setAuthMode("login");
    setAuthStatus({ tone: "neutral", message: "La sesion se cerro correctamente." });
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
        logoutBusy,
        performLogout,
        registerErrors,
        registerValues,
        sessionUser,
        setLoginValues,
        setRegisterValues,
        submitLogin,
        submitRecover,
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
