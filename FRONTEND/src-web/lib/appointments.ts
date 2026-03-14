import { apiRequest } from "@/lib/api";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type AppointmentView = {
  id: string;
  status: AppointmentStatus;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number | null;
  description: string | null;
  customer: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
  assignedUser: {
    id: string;
    name: string | null;
  } | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type AppointmentResponse = {
  id?: string;
  status?: string | null;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
  durationMinutes?: number | string | null;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  customer?: {
    id?: string;
    name?: string | null;
    phone?: string | null;
  } | null;
  assignedUser?: {
    id?: string;
    name?: string | null;
  } | null;
};

type AppointmentsResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: "config_error" | "network_error" | "server_error" | "unauthorized"; message: string };

export type UpdateAppointmentInput = {
  status: AppointmentStatus;
  notifyCustomer?: boolean;
};

function toNullableNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapStatus(value: string | null | undefined): AppointmentStatus {
  return value === "confirmed" || value === "cancelled" || value === "completed" ? value : "pending";
}

function mapAppointment(item: AppointmentResponse): AppointmentView | null {
  if (!item.id || !item.appointmentDate || !item.appointmentTime) {
    return null;
  }

  return {
    id: item.id,
    status: mapStatus(item.status),
    appointmentDate: item.appointmentDate,
    appointmentTime: item.appointmentTime,
    durationMinutes: toNullableNumber(item.durationMinutes),
    description: item.description ?? null,
    customer: item.customer?.id
      ? {
          id: item.customer.id,
          name: item.customer.name ?? null,
          phone: item.customer.phone ?? null,
        }
      : null,
    assignedUser: item.assignedUser?.id
      ? {
          id: item.assignedUser.id,
          name: item.assignedUser.name ?? null,
        }
      : null,
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
  };
}

async function requestAppointments<T>(path: string, token: string, init?: RequestInit): Promise<AppointmentsResult<T>> {
  try {
    const response = await apiRequest(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        code: "unauthorized",
        message: "Tu sesion expiro o ya no es valida. Inicia sesion nuevamente.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        code: "server_error",
        message: init?.method === "PATCH"
          ? "No se pudo actualizar la cita."
          : "No se pudieron cargar las citas.",
      };
    }

    const data = response.status === 204 ? null : await response.json();
    return { ok: true, data: data as T };
  } catch (error) {
    if (error instanceof Error && error.message === "api_url_missing") {
      return {
        ok: false,
        code: "config_error",
        message: "Falta configurar VITE_API_URL para conectar con el backend.",
      };
    }

    return {
      ok: false,
      code: "network_error",
      message: "No se pudo conectar con el backend para las citas.",
    };
  }
}

export function getAppointments(token: string) {
  return requestAppointments<AppointmentResponse[]>("/appointments", token).then((result) => {
    if (!result.ok) return result;

    return {
      ok: true as const,
      data: result.data.map(mapAppointment).filter((item): item is AppointmentView => Boolean(item)),
    };
  });
}

export function updateAppointment(token: string, id: string, input: UpdateAppointmentInput) {
  return requestAppointments<AppointmentResponse>(`/appointments/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(input),
  }).then((result) => {
    if (!result.ok) return result;

    const appointment = mapAppointment(result.data);
    if (!appointment) {
      return {
        ok: false as const,
        code: "server_error" as const,
        message: "La respuesta de la cita no fue valida.",
      };
    }

    return { ok: true as const, data: appointment };
  });
}