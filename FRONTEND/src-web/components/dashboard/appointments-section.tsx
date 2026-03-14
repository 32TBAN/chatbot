import { CalendarClock, LoaderCircle, RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  getAppointments,
  updateAppointment,
  type AppointmentStatus,
  type AppointmentView,
} from "@/services/appointments-service";

const STATUS_COLUMNS: Array<{
  description: string;
  label: string;
  status: AppointmentStatus;
}> = [
  {
    status: "pending",
    label: "Pendientes",
    description: "Citas creadas y aun no confirmadas.",
  },
  {
    status: "confirmed",
    label: "Confirmadas",
    description: "Citas listas para atencion.",
  },
  {
    status: "cancelled",
    label: "Canceladas",
    description: "Citas que ya no se realizaran.",
  },
  {
    status: "completed",
    label: "Finalizadas",
    description: "Citas ya atendidas.",
  },
];

const STATUS_OPTIONS = STATUS_COLUMNS.map((column) => ({ value: column.status, label: column.label }));

const STATUS_BADGE: Record<AppointmentStatus, "default" | "warning" | "destructive" | "success"> = {
  pending: "warning",
  confirmed: "default",
  cancelled: "destructive",
  completed: "success",
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

export function AppointmentsSection() {
  const { getAccessToken, invalidateSession } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentView[]>([]);
  const [originalStatuses, setOriginalStatuses] = useState<Record<string, AppointmentStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<AppointmentStatus | null>(null);
  const [status, setStatus] = useState<{ tone: "error" | "success"; message: string } | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const token = getAccessToken();
      if (!token) {
        if (!active) return;
        setLoading(false);
        setStatus({ tone: "error", message: "No hay una sesion activa para cargar las citas." });
        return;
      }

      const result = await getAppointments(token);
      if (!active) return;

      if (!result.ok) {
        setLoading(false);
        if (result.code === "unauthorized") {
          await invalidateSession(result.message);
          return;
        }

        setStatus({ tone: "error", message: result.message });
        return;
      }

      setAppointments(result.data);
      setOriginalStatuses(Object.fromEntries(result.data.map((item) => [item.id, item.status])));
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [getAccessToken, invalidateSession]);

  const dirtyIds = useMemo(
    () => appointments.filter((item) => originalStatuses[item.id] && originalStatuses[item.id] !== item.status).map((item) => item.id),
    [appointments, originalStatuses],
  );

  const appointmentsByStatus = useMemo(
    () =>
      Object.fromEntries(
        STATUS_COLUMNS.map((column) => [
          column.status,
          appointments.filter((item) => item.status === column.status),
        ]),
      ) as Record<AppointmentStatus, AppointmentView[]>,
    [appointments],
  );

  const updateLocalStatus = (id: string, nextStatus: AppointmentStatus) => {
    setAppointments((current) => current.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
    setStatus(null);
  };

  const discardChanges = () => {
    setAppointments((current) => current.map((item) => ({ ...item, status: originalStatuses[item.id] ?? item.status })));
    setStatus(null);
  };

  const saveChanges = async () => {
    const token = getAccessToken();
    if (!token) {
      setStatus({ tone: "error", message: "No hay una sesion activa para guardar cambios en las citas." });
      return;
    }

    if (!dirtyIds.length) {
      setStatus({ tone: "success", message: "No hay cambios pendientes por guardar." });
      return;
    }

    setSaving(true);
    setStatus(null);

    const failures: string[] = [];
    const updatedOriginals = { ...originalStatuses };

    for (const id of dirtyIds) {
      const appointment = appointments.find((item) => item.id === id);
      if (!appointment) continue;

      const result = await updateAppointment(token, id, { status: appointment.status, notifyCustomer: true });
      if (!result.ok) {
        if (result.code === "unauthorized") {
          setSaving(false);
          await invalidateSession(result.message);
          return;
        }

        failures.push(id);
        setAppointments((current) =>
          current.map((item) =>
            item.id === id
              ? { ...item, status: originalStatuses[id] ?? item.status }
              : item,
          ),
        );
        continue;
      }

      updatedOriginals[id] = result.data.status;
      setAppointments((current) => current.map((item) => (item.id === id ? result.data : item)));
    }

    setOriginalStatuses(updatedOriginals);
    setSaving(false);

    if (failures.length) {
      setStatus({
        tone: "error",
        message: failures.length === 1
          ? "No se pudo guardar una de las citas. Se revirtio a su estado original."
          : `No se pudieron guardar ${failures.length} citas. Se revirtieron a su estado original.`,
      });
      return;
    }

    setStatus({ tone: "success", message: "Estados de citas guardados correctamente." });
  };

  if (loading) {
    return (
      <section className="grid gap-6">
        <Card className="shadow-[0_20px_70px_rgba(18,25,36,0.08)]">
          <CardContent className="flex min-h-[220px] items-center justify-center gap-3 text-muted-foreground">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Cargando citas...</span>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <Card className="border-border/80 bg-card shadow-[0_18px_60px_rgba(18,25,36,0.06)]">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardDescription>Agenda operativa</CardDescription>
            <CardTitle>Tablero de citas por estado</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={dirtyIds.length ? "warning" : "default"}>
              {dirtyIds.length ? `${dirtyIds.length} cambio(s) pendiente(s)` : "Sin cambios pendientes"}
            </Badge>
            <Button disabled={!dirtyIds.length || saving} onClick={discardChanges} type="button" variant="secondary">
              <RotateCcw className="h-4 w-4" />
              Descartar cambios
            </Button>
            <Button disabled={!dirtyIds.length || saving} onClick={saveChanges} type="button">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar cambios
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {status ? (
            <div className={cn(
              "rounded-2xl border px-4 py-3 text-sm",
              status.tone === "success"
                ? "border-emerald-300/70 bg-emerald-100/85 text-emerald-950"
                : "border-rose-300/80 bg-rose-100/85 text-rose-950",
            )}>
              {status.message}
            </div>
          ) : null}

          {!appointments.length ? (
            <div className="grid gap-3 rounded-[1.25rem] border border-dashed border-border/80 bg-background/75 px-5 py-10 text-center">
              <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-panel-ink">Aun no hay citas registradas</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cuando los clientes empiecen a reservar, apareceran aqui para organizarlas por estado.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-4">
              {STATUS_COLUMNS.map((column) => {
                const columnAppointments = appointmentsByStatus[column.status];

                return (
                  <div
                    key={column.status}
                    className={cn(
                      "grid gap-4 rounded-[1.35rem] border border-border/80 bg-[linear-gradient(180deg,rgba(251,248,241,0.92),rgba(243,245,240,0.88))] p-4 shadow-sm",
                      dragOverStatus === column.status && "border-panel-steel/50 bg-panel-signal/20",
                    )}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOverStatus(column.status);
                    }}
                    onDragLeave={() => setDragOverStatus((current) => (current === column.status ? null : current))}
                    onDrop={(event) => {
                      event.preventDefault();
                      const id = event.dataTransfer.getData("text/appointment-id");
                      if (id) {
                        updateLocalStatus(id, column.status);
                      }
                      setDragOverStatus(null);
                      setDraggingId(null);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-panel-ink">{column.label}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{column.description}</p>
                      </div>
                      <Badge variant="default">{columnAppointments.length}</Badge>
                    </div>

                    <div className="grid gap-3">
                      {columnAppointments.length ? (
                        columnAppointments.map((appointment) => {
                          const isDirty = originalStatuses[appointment.id] !== appointment.status;

                          return (
                            <article
                              key={appointment.id}
                              className={cn(
                                "grid gap-3 rounded-2xl border border-border bg-background/90 p-4 shadow-sm transition-opacity",
                                draggingId === appointment.id && "opacity-60",
                              )}
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.setData("text/appointment-id", appointment.id);
                                event.dataTransfer.effectAllowed = "move";
                                setDraggingId(appointment.id);
                              }}
                              onDragEnd={() => {
                                setDraggingId(null);
                                setDragOverStatus(null);
                              }}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={STATUS_BADGE[appointment.status]}>{STATUS_OPTIONS.find((option) => option.value === appointment.status)?.label}</Badge>
                                {isDirty ? <Badge variant="warning">Pendiente de guardar</Badge> : null}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-panel-ink">
                                  {appointment.customer?.name?.trim() || appointment.customer?.phone || "Cliente sin nombre"}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatDate(appointment.appointmentDate)} a las {formatTime(appointment.appointmentTime)}
                                </p>
                              </div>

                              <div className="grid gap-2 text-sm text-muted-foreground">
                                <p>{appointment.description?.trim() || "Sin descripcion registrada."}</p>
                                <p>
                                  Responsable: <span className="text-panel-ink">{appointment.assignedUser?.name?.trim() || "Sin responsable"}</span>
                                </p>
                              </div>

                              <label className="grid gap-2 text-sm text-panel-ink">
                                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mover a</span>
                                <select
                                  className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm"
                                  onChange={(event) => updateLocalStatus(appointment.id, event.target.value as AppointmentStatus)}
                                  value={appointment.status}
                                >
                                  {STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </article>
                          );
                        })
                      ) : (
                        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                          No hay citas en esta columna.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}