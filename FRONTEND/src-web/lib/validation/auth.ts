import type { LoginValues, RegisterValues } from "@/types/auth";

export function validateName(name: string) {
  if (!name.trim()) return "El nombre es obligatorio.";
  return undefined;
}

export function validateEmail(email: string) {
  if (!email.trim()) return "El email es obligatorio.";
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email.trim())) return "Ingresa un email valido.";
  return undefined;
}

export function validatePassword(password: string) {
  if (!password.trim()) return "La contrasena es obligatoria.";
  if (password.trim().length < 6) return "La contrasena debe tener al menos 6 caracteres.";
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
    errors.phone = "Ingresa un telefono valido o deja el campo vacio.";
  }

  if (!values.confirmPassword.trim()) {
    errors.confirmPassword = "Confirma la contrasena.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Las contrasenas no coinciden.";
  }

  return errors;
}
