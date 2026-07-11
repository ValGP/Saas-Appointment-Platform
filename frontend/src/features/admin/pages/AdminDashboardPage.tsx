import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  UserPlus,
} from "lucide-react";
import {
  getAppointments,
  type Appointment,
  type AppointmentStatus,
} from "../../appointments/api/appointmentsApi";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { getBusinessHours } from "../../business-hours/api/businessHoursApi";
import { getProfessionals } from "../../professionals/api/professionalsApi";
import { getServices } from "../../services/api/servicesApi";
import {
  addDays,
  endOfDay,
  formatShortDateTime,
  formatTime,
  startOfDay,
  startOfWeek,
  toLocalDateTimeParam,
} from "../../../shared/utils/date";

const statusLabels: Record<AppointmentStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  REJECTED: "Rechazado",
  CANCELED_BY_CLIENT: "Cancelado cliente",
  CANCELED_BY_ADMIN: "Cancelado admin",
  COMPLETED: "Completado",
  NO_SHOW: "No asistio",
};

const statusTone: Record<AppointmentStatus, string> = {
  PENDING: "warning",
  CONFIRMED: "success",
  REJECTED: "danger",
  CANCELED_BY_CLIENT: "muted",
  CANCELED_BY_ADMIN: "muted",
  COMPLETED: "success",
  NO_SHOW: "danger",
};

const windowStart = startOfWeek(new Date());
const windowEnd = endOfDay(addDays(windowStart, 13));
const todayStart = startOfDay(new Date());
const todayEnd = endOfDay(new Date());

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function appointmentsUrl(filters: {
  clientId?: number;
  from?: Date | string;
  professionalId?: number;
  status?: AppointmentStatus | "ALL";
  to?: Date | string;
}) {
  const params = new URLSearchParams();

  if (filters.from) {
    params.set(
      "from",
      typeof filters.from === "string" ? filters.from : toDateInput(filters.from),
    );
  }

  if (filters.to) {
    params.set(
      "to",
      typeof filters.to === "string" ? filters.to : toDateInput(filters.to),
    );
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.clientId) {
    params.set("clientId", String(filters.clientId));
  }

  if (filters.professionalId) {
    params.set("professionalId", String(filters.professionalId));
  }

  return `/admin/appointments?${params.toString()}`;
}

function countByStatus(appointments: Appointment[], status: AppointmentStatus) {
  return appointments.filter((appointment) => appointment.status === status)
    .length;
}

function getNextAppointment(appointments: Appointment[]) {
  const now = Date.now();

  return appointments
    .filter((appointment) => new Date(appointment.startDateTime).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime(),
    )[0];
}

export function AdminDashboardPage() {
  const appointmentsQuery = useQuery({
    queryKey: ["admin-dashboard-appointments"],
    queryFn: () =>
      getAppointments({
        from: toLocalDateTimeParam(windowStart),
        to: toLocalDateTimeParam(windowEnd),
        page: 0,
        size: 100,
        sort: "startDateTime,asc",
      }),
  });
  const professionalsQuery = useQuery({
    queryKey: ["professionals"],
    queryFn: () => getProfessionals(),
  });
  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: () => getServices(),
  });
  const hoursQuery = useQuery({
    queryKey: ["business-hours"],
    queryFn: getBusinessHours,
  });

  const appointments = appointmentsQuery.data?.content ?? [];
  const activeProfessionals =
    professionalsQuery.data?.filter((professional) => professional.active) ?? [];
  const activeServices =
    servicesQuery.data?.filter((service) => service.active) ?? [];
  const activeHours = hoursQuery.data?.filter((item) => item.active) ?? [];
  const serviceProfessionalQueries = useQueries({
    queries: activeServices.map((service) => ({
      queryKey: ["professionals", "compatible-service", service.id],
      queryFn: () => getProfessionals({ serviceId: service.id }),
    })),
  });
  const professionalsWithoutHours = activeProfessionals.filter(
    (professional) =>
      !activeHours.some((item) => item.professionalId === professional.id),
  );
  const servicesWithoutProfessionals = activeServices.filter((service, index) => {
    const compatibleProfessionals = serviceProfessionalQueries[index]?.data ?? [];
    return (
      serviceProfessionalQueries[index]?.isSuccess &&
      compatibleProfessionals.filter((professional) => professional.active).length === 0
    );
  });
  const configurationAlerts = [
    ...professionalsWithoutHours.map((professional) => ({
      detail: "No genera disponibilidad hasta cargar horarios.",
      label: professional.fullName,
      to: "/admin/business-hours",
      type: "Profesional sin horarios",
    })),
    ...servicesWithoutProfessionals.map((service) => ({
      detail: "No se puede reservar hasta asignar profesionales.",
      label: service.name,
      to: "/admin/services",
      type: "Servicio sin profesionales",
    })),
  ];
  const nextAppointment = getNextAppointment(appointments);
  const visibleAppointments = appointments.slice(0, 6);
  const pendingCount = countByStatus(appointments, "PENDING");
  const confirmedCount = countByStatus(appointments, "CONFIRMED");
  const completedCount = countByStatus(appointments, "COMPLETED");
  const windowAppointmentsUrl = appointmentsUrl({
    from: windowStart,
    status: "ALL",
    to: windowEnd,
  });

  return (
    <section className="admin-dashboard">
      <div className="dashboard-title-row">
        <div>
          <p className="admin-kicker">Semana actual y proxima</p>
          <h2>Operacion diaria</h2>
        </div>
        <div className="dashboard-actions">
          <button
            className="admin-soft-button"
            type="button"
            onClick={() => void appointmentsQuery.refetch()}
          >
            <RefreshCw aria-hidden="true" size={16} />
            Actualizar
          </button>
          <Link className="admin-primary-button" to="/admin/calendar">
            <Plus aria-hidden="true" size={16} />
            Nuevo turno
          </Link>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard
          to={appointmentsUrl({
            from: windowStart,
            status: "PENDING",
            to: windowEnd,
          })}
          icon={Clock3}
          label="Pendientes"
          value={pendingCount}
          detail="Requieren confirmacion"
          tone="warning"
        />
        <MetricCard
          to={appointmentsUrl({
            from: todayStart,
            status: "CONFIRMED",
            to: todayEnd,
          })}
          icon={CheckCircle2}
          label="Confirmados"
          value={confirmedCount}
          detail="Ver confirmados de hoy"
          tone="success"
        />
        <MetricCard
          to={appointmentsUrl({
            from: windowStart,
            status: "COMPLETED",
            to: windowEnd,
          })}
          icon={ListChecks}
          label="Completados"
          value={completedCount}
          detail="Servicios finalizados"
          tone="accent"
        />
        <MetricCard
          to={windowAppointmentsUrl}
          icon={CalendarClock}
          label="Total ventana"
          value={appointmentsQuery.data?.totalElements ?? appointments.length}
          detail="14 dias visibles"
          tone="info"
        />
      </div>

      <div className="dashboard-content-grid">
        <article className="admin-card schedule-card">
          <div className="card-heading">
            <div>
              <p className="admin-kicker">Agenda</p>
              <h3>Turnos proximos</h3>
            </div>
            <span className="window-pill">14 dias</span>
          </div>

          {appointmentsQuery.isLoading ? (
            <DashboardState label="Cargando turnos..." />
          ) : null}

          {appointmentsQuery.isError ? (
            <DashboardState
              icon={AlertCircle}
              label="No se pudieron cargar los turnos."
            />
          ) : null}

          {!appointmentsQuery.isLoading &&
          !appointmentsQuery.isError &&
          visibleAppointments.length === 0 ? (
            <AdminEmptyState
              label="No hay turnos en la ventana actual."
              supportingText="Revisa disponibilidad para crear un turno desde un horario valido."
              action={
                <Link className="admin-primary-button" to="/admin/calendar">
                  Revisar agenda
                </Link>
              }
            />
          ) : null}

          {visibleAppointments.length > 0 ? (
            <div className="appointment-list">
              {visibleAppointments.map((appointment) => (
                <AppointmentRow
                  appointment={appointment}
                  key={appointment.id}
                  to={appointmentsUrl({
                    clientId: appointment.clientId,
                    from: appointment.startDateTime.slice(0, 10),
                    status: appointment.status,
                    to: appointment.startDateTime.slice(0, 10),
                  })}
                />
              ))}
            </div>
          ) : null}
        </article>

        <aside className="dashboard-side-stack">
          <article className="admin-card next-card">
            <div className="card-heading">
              <div>
                <p className="admin-kicker">Siguiente</p>
                <h3>Proximo turno</h3>
              </div>
            </div>
            {nextAppointment ? (
              <Link
                className="next-appointment is-link"
                to={appointmentsUrl({
                  clientId: nextAppointment.clientId,
                  from: nextAppointment.startDateTime.slice(0, 10),
                  status: nextAppointment.status,
                  to: nextAppointment.startDateTime.slice(0, 10),
                })}
              >
                <strong>{nextAppointment.clientName}</strong>
                <span>{nextAppointment.serviceName}</span>
                <time>{formatShortDateTime(nextAppointment.startDateTime)}</time>
              </Link>
            ) : (
              <p className="muted-copy">No hay turnos proximos cargados.</p>
            )}
          </article>

          <article className="admin-card quick-actions-card">
            <div className="card-heading">
              <div>
                <p className="admin-kicker">Acciones</p>
                <h3>Rapidas</h3>
              </div>
            </div>
            <Link className="quick-action" to="/admin/calendar">
              <Plus aria-hidden="true" size={16} />
              Crear desde agenda
            </Link>
            <Link className="quick-action" to="/admin/clients">
              <UserPlus aria-hidden="true" size={16} />
              Registrar cliente
            </Link>
            <Link className="quick-action" to="/admin/calendar">
              <CalendarClock aria-hidden="true" size={16} />
              Revisar disponibilidad
            </Link>
            <Link className="quick-action" to={windowAppointmentsUrl}>
              <Search aria-hidden="true" size={16} />
              Ver semana actual y proxima
            </Link>
          </article>

          <article className="admin-card config-alerts-card">
            <div className="card-heading">
              <div>
                <p className="admin-kicker">Configuracion</p>
                <h3>Alertas</h3>
              </div>
            </div>
            {configurationAlerts.length === 0 ? (
              <p className="muted-copy">No hay alertas de configuracion.</p>
            ) : (
              <div className="config-alert-list">
                {configurationAlerts.slice(0, 5).map((alert) => (
                  <Link
                    className="config-alert-row"
                    key={`${alert.type}-${alert.label}`}
                    to={alert.to}
                  >
                    <strong>{alert.type}</strong>
                    <span>{alert.label}</span>
                    <small>{alert.detail}</small>
                  </Link>
                ))}
              </div>
            )}
          </article>
        </aside>
      </div>
    </section>
  );
}

type MetricCardProps = {
  icon: typeof Clock3;
  label: string;
  to: string;
  value: number;
  detail: string;
  tone: string;
};

function MetricCard({
  detail,
  icon: Icon,
  label,
  to,
  tone,
  value,
}: MetricCardProps) {
  return (
    <Link className={`admin-card metric-card is-link tone-${tone}`} to={to}>
      <div className="metric-icon">
        <Icon aria-hidden="true" size={18} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </Link>
  );
}

function AppointmentRow({
  appointment,
  to,
}: {
  appointment: Appointment;
  to: string;
}) {
  return (
    <Link className="appointment-row is-link" to={to}>
      <div className="appointment-time">
        <strong>{formatTime(appointment.startDateTime)}</strong>
        <span>{formatShortDateTime(appointment.startDateTime)}</span>
      </div>
      <div className="appointment-main">
        <strong>{appointment.clientName}</strong>
        <span>{appointment.serviceName}</span>
      </div>
      <div className="appointment-meta">
        <span>{appointment.professionalName}</span>
        <span className={`status-badge tone-${statusTone[appointment.status]}`}>
          {statusLabels[appointment.status]}
        </span>
      </div>
    </Link>
  );
}

function DashboardState({
  icon: Icon = CalendarClock,
  label,
}: {
  icon?: typeof CalendarClock;
  label: string;
}) {
  return (
    <div className="dashboard-state">
      <Icon aria-hidden="true" size={20} />
      <span>{label}</span>
    </div>
  );
}
