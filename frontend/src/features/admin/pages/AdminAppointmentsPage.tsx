import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  Search,
  UserX,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError } from "../../../shared/api/httpClient";
import {
  addDays,
  endOfDay,
  formatShortDateTime,
  formatTime,
  startOfWeek,
} from "../../../shared/utils/date";
import { usePersistentState } from "../../../shared/hooks/usePersistentState";
import {
  cancelAppointmentByAdmin,
  completeAppointment,
  confirmAppointment,
  getAppointments,
  markAppointmentNoShow,
  rejectAppointment,
  type Appointment,
  type AppointmentStatus,
} from "../../appointments/api/appointmentsApi";
import { getClients } from "../../clients/api/clientsApi";
import { getProfessionals } from "../../professionals/api/professionalsApi";
import { AdminConfirmDialog } from "../components/AdminConfirmDialog";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminModal } from "../components/AdminModal";
import { AdminToast } from "../components/AdminToast";
import { useAdminToast } from "../hooks/useAdminToast";

const statusOptions: Array<{ label: string; value: AppointmentStatus }> = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Confirmado", value: "CONFIRMED" },
  { label: "Rechazado", value: "REJECTED" },
  { label: "Cancelado cliente", value: "CANCELED_BY_CLIENT" },
  { label: "Cancelado admin", value: "CANCELED_BY_ADMIN" },
  { label: "Completado", value: "COMPLETED" },
  { label: "No asistio", value: "NO_SHOW" },
];

const statusLabels = Object.fromEntries(
  statusOptions.map((status) => [status.value, status.label]),
) as Record<AppointmentStatus, string>;

const statusTone: Record<AppointmentStatus, string> = {
  PENDING: "warning",
  CONFIRMED: "success",
  REJECTED: "danger",
  CANCELED_BY_CLIENT: "muted",
  CANCELED_BY_ADMIN: "muted",
  COMPLETED: "success",
  NO_SHOW: "danger",
};

type Filters = {
  clientId: string;
  professionalId: string;
  status: string;
  from: string;
  to: string;
};

type TransitionAction = "reject" | "cancel";
type SimpleAction = "confirm" | "complete" | "no-show";

const simpleActionLabels: Record<
  SimpleAction,
  {
    confirmLabel: string;
    message: (appointment: Appointment) => string;
    success: string;
    title: string;
  }
> = {
  confirm: {
    confirmLabel: "Confirmar",
    message: (appointment) =>
      `Vas a confirmar el turno de ${appointment.clientName}. Esta accion cambia el estado del turno.`,
    success: "Turno confirmado.",
    title: "Confirmar turno",
  },
  complete: {
    confirmLabel: "Completar",
    message: (appointment) =>
      `Vas a marcar como completado el turno de ${appointment.clientName}.`,
    success: "Turno completado.",
    title: "Completar turno",
  },
  "no-show": {
    confirmLabel: "Marcar no-show",
    message: (appointment) =>
      `Vas a marcar que ${appointment.clientName} no asistio al turno.`,
    success: "Turno marcado como no asistio.",
    title: "Marcar no-show",
  },
};

const initialStart = startOfWeek(new Date());
const initialEnd = endOfDay(addDays(initialStart, 13));
const nextWeekStart = addDays(initialStart, 7);
const nextWeekEnd = endOfDay(addDays(nextWeekStart, 6));

function toDateInput(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate(),
  )}`;
}

function toDayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatDayTitle(dayKey: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(`${dayKey}T00:00:00`));
}

function toDateTimeStart(value: string) {
  return `${value}T00:00:00`;
}

function toDateTimeEnd(value: string) {
  return `${value}T23:59:59`;
}

function isAppointmentStatus(value: string): value is AppointmentStatus {
  return statusOptions.some((status) => status.value === value);
}

function getFiltersFromSearchParams(searchParams: URLSearchParams) {
  const nextFilters: Partial<Filters> = {};
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");
  const professionalId = searchParams.get("professionalId");

  if (from) {
    nextFilters.from = from;
  }

  if (to) {
    nextFilters.to = to;
  }

  if (status === "ALL") {
    nextFilters.status = "";
  } else if (status && isAppointmentStatus(status)) {
    nextFilters.status = status;
  }

  if (clientId) {
    nextFilters.clientId = clientId;
  }

  if (professionalId) {
    nextFilters.professionalId = professionalId;
  }

  return Object.keys(nextFilters).length > 0 ? nextFilters : null;
}

export function AdminAppointmentsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const [page, setPage] = usePersistentState("admin:appointments:page", 0);
  const [filters, setFilters] = usePersistentState<Filters>("admin:appointments:filters", {
    clientId: "",
    professionalId: "",
    status: "",
    from: toDateInput(initialStart),
    to: toDateInput(initialEnd),
  });
  const [transition, setTransition] = useState<{
    action: TransitionAction;
    appointment: Appointment;
  } | null>(null);
  const [simpleAction, setSimpleAction] = useState<{
    action: SimpleAction;
    appointment: Appointment;
  } | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [transitionReason, setTransitionReason] = useState("");
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const { showToast, toast } = useAdminToast();

  useEffect(() => {
    const nextFilters = getFiltersFromSearchParams(new URLSearchParams(searchKey));

    if (!nextFilters) {
      return;
    }

    setFilters((current) => ({ ...current, ...nextFilters }));
    setPage(0);
  }, [searchKey, setFilters, setPage]);

  const appointmentsQuery = useQuery({
    queryKey: ["admin-appointments", filters, page],
    queryFn: () =>
      getAppointments({
        clientId: filters.clientId ? Number(filters.clientId) : undefined,
        professionalId: filters.professionalId
          ? Number(filters.professionalId)
          : undefined,
        status: filters.status ? (filters.status as AppointmentStatus) : undefined,
        from: filters.from ? toDateTimeStart(filters.from) : undefined,
        to: filters.to ? toDateTimeEnd(filters.to) : undefined,
        page,
        size: 40,
        sort: "startDateTime,asc",
      }),
  });

  const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: getClients });
  const professionalsQuery = useQuery({
    queryKey: ["professionals"],
    queryFn: () => getProfessionals(),
  });

  const appointments = appointmentsQuery.data?.content ?? [];
  const clients = clientsQuery.data ?? [];
  const professionals = professionalsQuery.data ?? [];

  const groupedAppointments = useMemo(() => {
    return appointments.reduce<Record<string, Appointment[]>>((acc, appointment) => {
      const key = toDayKey(appointment.startDateTime);
      acc[key] = acc[key] ?? [];
      acc[key].push(appointment);
      return acc;
    }, {});
  }, [appointments]);

  const simpleActionMutation = useMutation({
    mutationFn: ({
      action,
      id,
    }: {
      action: SimpleAction;
      id: number;
    }) => {
      if (action === "confirm") {
        return confirmAppointment(id);
      }
      if (action === "complete") {
        return completeAppointment(id);
      }
      return markAppointmentNoShow(id);
    },
    onSuccess: async (_data, variables) => {
      await refreshAppointments();
      setSimpleAction(null);
      setSelectedAppointment(null);
      showToast(simpleActionLabels[variables.action].success);
    },
    onError: (error) =>
      showToast(
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar el turno.",
        "danger",
      ),
  });

  const transitionMutation = useMutation({
    mutationFn: ({
      action,
      id,
      reason,
    }: {
      action: TransitionAction;
      id: number;
      reason: string;
    }) =>
      action === "reject"
        ? rejectAppointment(id, { reason })
        : cancelAppointmentByAdmin(id, { reason }),
    onSuccess: async (_data, variables) => {
      await refreshAppointments();
      closeTransitionModal();
      setSelectedAppointment(null);
      showToast(
        variables.action === "reject" ? "Turno rechazado." : "Turno cancelado.",
      );
    },
    onError: (error) =>
      setTransitionError(
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar el turno.",
      ),
  });

  function refreshAppointments() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-appointments"] }),
    ]);
  }

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
  }

  function resetFilters() {
    setFilters({
      clientId: "",
      professionalId: "",
      status: "",
      from: toDateInput(initialStart),
      to: toDateInput(initialEnd),
    });
    setPage(0);
  }

  function setRange(from: Date, to: Date) {
    setFilters((current) => ({
      ...current,
      from: toDateInput(from),
      to: toDateInput(to),
    }));
    setPage(0);
  }

  function clearFilters() {
    setFilters({
      clientId: "",
      professionalId: "",
      status: "",
      from: "",
      to: "",
    });
    setPage(0);
  }

  function openTransitionModal(action: TransitionAction, appointment: Appointment) {
    setTransition({ action, appointment });
    setTransitionReason("");
    setTransitionError(null);
  }

  function openSimpleAction(action: SimpleAction, appointment: Appointment) {
    setSimpleAction({ action, appointment });
  }

  function closeTransitionModal() {
    setTransition(null);
    setTransitionReason("");
    setTransitionError(null);
  }

  function submitTransition() {
    if (!transition) {
      return;
    }

    if (!transitionReason.trim()) {
      setTransitionError("Ingresa un motivo.");
      return;
    }

    transitionMutation.mutate({
      action: transition.action,
      id: transition.appointment.id,
      reason: transitionReason.trim(),
    });
  }

  const dayKeys = Object.keys(groupedAppointments).sort();
  const total = appointmentsQuery.data?.totalElements ?? 0;

  return (
    <section className="appointments-page">
      <AdminToast toast={toast} />
      <div className="catalog-header">
        <div>
          <p className="admin-kicker">Agenda</p>
          <h2>Turnos</h2>
          <p>
            Opera los turnos desde una agenda simple por dia, con filtros y
            acciones de estado.
          </p>
        </div>
        <Link
          className="admin-primary-button"
          to="/admin/calendar"
        >
          Revisar agenda
        </Link>
      </div>

      <article className="admin-card appointments-filter-card">
        <div className="card-heading">
          <div>
            <p className="admin-kicker">Filtros</p>
            <h3>Busqueda operativa</h3>
          </div>
          <button
            className="admin-soft-button"
            type="button"
            onClick={() => void appointmentsQuery.refetch()}
          >
            <RefreshCw aria-hidden="true" size={16} />
            Actualizar
          </button>
        </div>

        <div className="appointment-status-tabs" role="group" aria-label="Vista rapida de turnos">
          <StatusTab
            active={filters.status === ""}
            label="Todos"
            onClick={() => updateFilter("status", "")}
          />
          <StatusTab
            active={filters.status === "PENDING"}
            label="Pendientes"
            onClick={() => updateFilter("status", "PENDING")}
          />
          <StatusTab
            active={filters.status === "CONFIRMED"}
            label="Confirmados"
            onClick={() => updateFilter("status", "CONFIRMED")}
          />
          <StatusTab
            active={filters.status === "COMPLETED"}
            label="Completados"
            onClick={() => updateFilter("status", "COMPLETED")}
          />
          <StatusTab
            active={filters.status === "CANCELED_BY_ADMIN"}
            label="Cancelados"
            onClick={() => updateFilter("status", "CANCELED_BY_ADMIN")}
          />
        </div>

        <div className="appointment-range-actions" aria-label="Rangos rapidos">
          <button
            className="admin-soft-button"
            type="button"
            onClick={() => setRange(initialStart, endOfDay(addDays(initialStart, 6)))}
          >
            Semana actual
          </button>
          <button
            className="admin-soft-button"
            type="button"
            onClick={() => setRange(nextWeekStart, nextWeekEnd)}
          >
            Proxima semana
          </button>
          <button className="admin-soft-button" type="button" onClick={resetFilters}>
            Semana actual + proxima
          </button>
          <button className="admin-danger-button" type="button" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>

        <div className="appointments-filter-grid">
          <label>
            Desde
            <input
              type="date"
              value={filters.from}
              onChange={(event) => updateFilter("from", event.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={filters.to}
              onChange={(event) => updateFilter("to", event.target.value)}
            />
          </label>
          <label>
            Estado
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              <option value="">Todos</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Profesional
            <select
              value={filters.professionalId}
              onChange={(event) =>
                updateFilter("professionalId", event.target.value)
              }
            >
              <option value="">Todos</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.fullName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cliente
            <select
              value={filters.clientId}
              onChange={(event) => updateFilter("clientId", event.target.value)}
            >
              <option value="">Todos</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.fullName}
                </option>
              ))}
            </select>
          </label>
        </div>
      </article>

      <article className="admin-card appointments-list-card">
        <div className="card-heading">
          <div>
            <p className="admin-kicker">Listado</p>
            <h3>{total} turnos encontrados</h3>
          </div>
          <div className="appointments-pagination">
            <button
              className="icon-button"
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={appointmentsQuery.data?.first ?? true}
              aria-label="Pagina anterior"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </button>
            <span>
              Pagina {(appointmentsQuery.data?.page ?? page) + 1} de{" "}
              {Math.max(appointmentsQuery.data?.totalPages ?? 1, 1)}
            </span>
            <button
              className="icon-button"
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={appointmentsQuery.data?.last ?? true}
              aria-label="Pagina siguiente"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </div>
        </div>

        {appointmentsQuery.isLoading ? (
          <DashboardState label="Cargando turnos..." />
        ) : null}
        {appointmentsQuery.isError ? (
          <DashboardState label="No se pudieron cargar los turnos." />
        ) : null}
        {!appointmentsQuery.isLoading &&
        !appointmentsQuery.isError &&
        appointments.length === 0 ? (
          <AdminEmptyState
            label="No hay turnos para los filtros elegidos."
            supportingText="Puedes revisar disponibilidad en Agenda o ajustar los filtros para ampliar la busqueda."
            action={
              <Link className="admin-primary-button" to="/admin/calendar">
                Revisar agenda
              </Link>
            }
          />
        ) : null}

        {dayKeys.length > 0 ? (
          <div className="appointments-day-list">
            {dayKeys.map((dayKey) => (
              <section className="appointments-day-group" key={dayKey}>
                <h4>{formatDayTitle(dayKey)}</h4>
                <div className="appointments-admin-list">
                  {groupedAppointments[dayKey].map((appointment) => (
                    <AppointmentAdminRow
                      appointment={appointment}
                      key={appointment.id}
                      onOpen={() => setSelectedAppointment(appointment)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </article>

      {selectedAppointment ? (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          isBusy={simpleActionMutation.isPending || transitionMutation.isPending}
          onCancel={() => openTransitionModal("cancel", selectedAppointment)}
          onClose={() => setSelectedAppointment(null)}
          onComplete={() => openSimpleAction("complete", selectedAppointment)}
          onConfirm={() => openSimpleAction("confirm", selectedAppointment)}
          onNoShow={() => openSimpleAction("no-show", selectedAppointment)}
          onReject={() => openTransitionModal("reject", selectedAppointment)}
        />
      ) : null}

      {transition ? (
        <AdminModal
          title={
            transition.action === "reject" ? "Rechazar turno" : "Cancelar turno"
          }
          kicker="Confirmacion"
          onClose={closeTransitionModal}
          stack="top"
        >
          <div className="transition-summary">
            <strong>{transition.appointment.clientName}</strong>
            <span>{transition.appointment.serviceName}</span>
            <time>{formatShortDateTime(transition.appointment.startDateTime)}</time>
          </div>
          <label className="modal-field">
            Motivo
            <textarea
              rows={4}
              value={transitionReason}
              onChange={(event) => setTransitionReason(event.target.value)}
              maxLength={300}
            />
          </label>
          {transitionError ? (
            <div className="admin-form-error">{transitionError}</div>
          ) : null}
          <div className="form-actions">
            <button
              className="admin-soft-button"
              type="button"
              onClick={closeTransitionModal}
            >
              Volver
            </button>
            <button
              className="admin-primary-button"
              type="button"
              onClick={submitTransition}
              disabled={transitionMutation.isPending}
            >
              {transitionMutation.isPending ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        </AdminModal>
      ) : null}

      {simpleAction ? (
        <AdminConfirmDialog
          title={simpleActionLabels[simpleAction.action].title}
          message={simpleActionLabels[simpleAction.action].message(
            simpleAction.appointment,
          )}
          confirmLabel={simpleActionLabels[simpleAction.action].confirmLabel}
          isPending={simpleActionMutation.isPending}
          onCancel={() => setSimpleAction(null)}
          onConfirm={() =>
            simpleActionMutation.mutate({
              action: simpleAction.action,
              id: simpleAction.appointment.id,
            })
          }
        />
      ) : null}
    </section>
  );
}

function StatusTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={active ? "is-active" : ""}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function AppointmentAdminRow({
  appointment,
  onOpen,
}: {
  appointment: Appointment;
  onOpen: () => void;
}) {
  return (
    <article className="appointment-admin-row">
      <div className="appointment-time">
        <strong>{formatTime(appointment.startDateTime)}</strong>
        <span>{formatTime(appointment.endDateTime)}</span>
      </div>
      <div className="appointment-main">
        <strong>{appointment.clientName}</strong>
        <span>{appointment.serviceName}</span>
      </div>
      <div className="appointment-main appointment-secondary">
        <strong>{appointment.professionalName}</strong>
        <span>{appointment.notes || "Sin notas"}</span>
      </div>
      <span className={`status-badge tone-${statusTone[appointment.status]}`}>
        {statusLabels[appointment.status]}
      </span>
      <div className="appointment-admin-actions">
        <button className="admin-soft-button" type="button" onClick={onOpen}>
          <Search aria-hidden="true" size={16} />
          Ver detalle
        </button>
      </div>
    </article>
  );
}

function AppointmentDetailModal({
  appointment,
  isBusy,
  onCancel,
  onClose,
  onComplete,
  onConfirm,
  onNoShow,
  onReject,
}: {
  appointment: Appointment;
  isBusy: boolean;
  onCancel: () => void;
  onClose: () => void;
  onComplete: () => void;
  onConfirm: () => void;
  onNoShow: () => void;
  onReject: () => void;
}) {
  const canConfirm = appointment.status === "PENDING";
  const canReject = appointment.status === "PENDING";
  const canCancel =
    appointment.status === "PENDING" || appointment.status === "CONFIRMED";
  const canComplete = appointment.status === "CONFIRMED";
  const canNoShow = appointment.status === "CONFIRMED";

  return (
    <AdminModal
      kicker="Detalle"
      title={`Turno #${appointment.id}`}
      onClose={onClose}
    >
      <div className="appointment-detail-grid">
        <DetailItem label="Cliente" value={appointment.clientName} />
        <DetailItem label="Profesional" value={appointment.professionalName} />
        <DetailItem label="Servicio" value={appointment.serviceName} />
        <DetailItem
          label="Fecha y horario"
          value={`${formatShortDateTime(appointment.startDateTime)} - ${formatTime(
            appointment.endDateTime,
          )}`}
        />
        <DetailItem
          label="Estado"
          value={
            <span className={`status-badge tone-${statusTone[appointment.status]}`}>
              {statusLabels[appointment.status]}
            </span>
          }
        />
        <DetailItem label="Creado por" value={appointment.createdByRole} />
        <DetailItem
          label="Notas"
          value={appointment.notes || "Sin notas"}
          wide
        />
        {appointment.rejectionReason ? (
          <DetailItem
            label="Motivo de rechazo"
            value={appointment.rejectionReason}
            wide
          />
        ) : null}
        {appointment.cancelReason ? (
          <DetailItem
            label="Motivo de cancelacion"
            value={appointment.cancelReason}
            wide
          />
        ) : null}
        <DetailItem
          label="Confirmado"
          value={formatOptionalDate(appointment.confirmedAt)}
        />
        <DetailItem
          label="Cancelado"
          value={formatOptionalDate(appointment.canceledAt)}
        />
        <DetailItem
          label="Completado"
          value={formatOptionalDate(appointment.completedAt)}
        />
        <DetailItem
          label="No asistio"
          value={formatOptionalDate(appointment.noShowAt)}
        />
      </div>

      <div className="appointment-detail-actions">
        <h4>Acciones disponibles</h4>
        {canConfirm ? (
          <ActionButton
            icon={Check}
            label="Confirmar turno"
            onClick={onConfirm}
            disabled={isBusy}
          />
        ) : null}
        {canReject ? (
          <ActionButton
            icon={X}
            label="Rechazar turno"
            onClick={onReject}
            disabled={isBusy}
            tone="danger"
          />
        ) : null}
        {canCancel ? (
          <ActionButton
            icon={Ban}
            label="Cancelar turno"
            onClick={onCancel}
            disabled={isBusy}
            tone="danger"
          />
        ) : null}
        {canComplete ? (
          <ActionButton
            icon={CheckCircle2}
            label="Completar turno"
            onClick={onComplete}
            disabled={isBusy}
          />
        ) : null}
        {canNoShow ? (
          <ActionButton
            icon={UserX}
            label="Marcar no asistio"
            onClick={onNoShow}
            disabled={isBusy}
            tone="danger"
          />
        ) : null}
        {!canConfirm && !canReject && !canCancel && !canComplete && !canNoShow ? (
          <p className="muted-copy">Este turno ya no tiene acciones disponibles.</p>
        ) : null}
      </div>
    </AdminModal>
  );
}

function DetailItem({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "detail-item is-wide" : "detail-item"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ActionButton({
  disabled,
  icon: Icon,
  label,
  onClick,
  tone = "primary",
}: {
  disabled: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: "danger" | "primary";
}) {
  return (
    <button
      className={`appointment-detail-action tone-${tone}`}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <Icon aria-hidden="true" size={16} />
      {label}
    </button>
  );
}

function formatOptionalDate(value?: string | null) {
  return value ? formatShortDateTime(value) : "No registrado";
}

function DashboardState({ label }: { label: string }) {
  return (
    <div className="dashboard-state">
      <Clock3 aria-hidden="true" size={20} />
      <span>{label}</span>
    </div>
  );
}
