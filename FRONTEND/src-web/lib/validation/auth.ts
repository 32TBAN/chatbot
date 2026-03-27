import type { LoginValues, RegisterValues } from "@/types/auth";

export function validateName(name: string) {
  if (!name.trim()) return "Escribe tu nombre.";
  return undefined;
}

export function validateEmail(email: string) {
  if (!email.trim()) return "Escribe tu correo.";
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email.trim())) return "Escribe un correo valido.";
  return undefined;
}

export function validatePassword(password: string) {
  if (!password.trim()) return "Escribe tu contrasena.";
  if (password.trim().length < 6) return "Tu contrasena debe tener al menos 6 caracteres.";
  return undefined;
}

export function validateLogin(values: LoginValues) {
  return {
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  };
}

export function validateRegister(values: RegisterValues) {
  const errors: Partial<Record<keyof RegisterValues, string>> = {
    name: validateName(values.name),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  };

  if (values.phone.trim() && !/^[0-9+\-\s()]{7,}$/.test(values.phone.trim())) {
    errors.phone = "Escribe un telefono valido o deja el campo vacio.";
  }

  if (!values.confirmPassword.trim()) {
    errors.confirmPassword = "Repite tu contrasena.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Las contrasenas no coinciden.";
  }

  return errors;
}
