export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  businessId?: string;
  role?: string;
  business?: {
    id?: string;
    name?: string;
  };
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

export type AuthMode = "login" | "register";

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
      code: "invalid_credentials" | "network_error" | "server_error" | "config_error";
      message: string;
    };

export type RegisterResult =
  | {
      ok: true;
      email: string;
      user?: AuthUser;
    }
  | {
      ok: false;
      code: "duplicate_email" | "network_error" | "server_error" | "config_error";
      message: string;
    };
