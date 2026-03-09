export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
};

export type LoginValues = {
  email: string;
  password: string;
};

export type RegisterValues = {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthMode = "login" | "register" | "recover";

export type AuthStatusTone = "neutral" | "error" | "success" | "warning";

export type AuthStatus = {
  tone: AuthStatusTone;
  message: string;
};

export type AuthResult =
  | {
      ok: true;
      user: AuthUser;
    }
  | {
      ok: false;
      code: "invalid_credentials" | "email_exists" | "network_error" | "server_error" | "not_found";
      message: string;
    };
