import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../../shared/api/httpClient";
import { useActiveBusiness } from "../../../app/providers/BusinessProvider";
import {
  cancelAppointmentByClient,
  getAppointments,
  type Appointment,
  type AppointmentStatus,
} from "../../appointments/api/appointmentsApi";
import { formatShortDateTime } from "../../../shared/utils/date";

function getStatusLabel(status: AppointmentStatus, businessName: string) {
  const statusLabels: Record<AppointmentStatus, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    REJECTED: "Rechazado",
    CANCELED_BY_CLIENT: "Cancelado por vos",
    CANCELED_BY_ADMIN: `Cancelado por ${businessName}`,
    COMPLETED: "Completado",
    NO_SHOW: "No asistió",
  };
  return statusLabels[status];
}

function getStatusTone(status: AppointmentStatus) {
  if (status === "PENDING") return "is-pending";
  if (status === "CONFIRMED") return "is-confirmed";
  if (status === "COMPLETED") return "is-completed";
  return "is-muted";
}

function getStatusMessage(status: AppointmentStatus, businessName: string) {
  if (status === "PENDING") {
    return "";
  }
  if (status === "CONFIRMED") {
    return "Tu turno está confirmado.";
  }
  if (status === "REJECTED") {
    return "Esta solicitud fue rechazada. Podés pedir otro turno.";
  }
  if (status === "CANCELED_BY_CLIENT") {
    return "Cancelaste este turno.";
  }
  if (status === "CANCELED_BY_ADMIN") {
    return `${businessName} canceló este turno.`;
  }
  if (status === "COMPLETED") {
    return "Este turno ya fue completado.";
  }
  return "Este turno quedó marcado como no asistido.";
}

function isUpcoming(appointment: Appointment) {
  const date = new Date(appointment.startDateTime).getTime();
  return (
    date >= Date.now() &&
    (appointment.status === "PENDING" || appointment.status === "CONFIRMED")
  );
}

function canClientCancel(appointment: Appointment) {
  const date = new Date(appointment.startDateTime).getTime();
  return (
    date >= Date.now() &&
    (appointment.status === "PENDING" || appointment.status === "CONFIRMED")
  );
}

export function ClientAppointmentsPage() {
  const { business } = useActiveBusiness();
  const businessName = business?.name || "el negocio";
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [cancelOption, setCancelOption] = useState("No puedo asistir (cambio de planes)");
  const [otherReasonText, setOtherReasonText] = useState("");
  const appointmentsQuery = useQuery({
    queryKey: ["appointments", "client"],
    queryFn: () =>
      getAppointments({
        page: 0,
        size: 30,
        sort: "startDateTime,desc",
      }),
  });

  const appointments = appointmentsQuery.data?.content ?? [];
  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (left, right) =>
          new Date(left.startDateTime).getTime() -
          new Date(right.startDateTime).getTime(),
      ),
    [appointments],
  );
  const pendingAppointments = sortedAppointments.filter(
    (appointment) => isUpcoming(appointment) && appointment.status === "PENDING",
  );
  const confirmedAppointments = sortedAppointments.filter(
    (appointment) => isUpcoming(appointment) && appointment.status === "CONFIRMED",
  );
  const historyAppointments = sortedAppointments
    .filter((appointment) => !isUpcoming(appointment))
    .sort(
      (left, right) =>
        new Date(right.startDateTime).getTime() -
        new Date(left.startDateTime).getTime(),
    );

  const upcomingAppointments = [...confirmedAppointments, ...pendingAppointments];


  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      cancelAppointmentByClient(id, { reason }),
    onSuccess: async (appointment) => {
      setCancelTarget(null);
      setCancelOption("No puedo asistir (cambio de planes)");
      setOtherReasonText("");
      setCancelError(null);
      setCancelSuccess(`${appointment.serviceName} fue cancelado correctamente.`);
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "No pudimos cancelar el turno. Proba nuevamente.";
      setCancelError(message);
    },
  });

  function openCancelModal(appointment: Appointment) {
    setCancelTarget(appointment);
    setCancelOption("No puedo asistir (cambio de planes)");
    setOtherReasonText("");
    setCancelError(null);
    setCancelSuccess(null);
  }

  function closeCancelModal() {
    if (cancelMutation.isPending) {
      return;
    }

    setCancelTarget(null);
    setCancelOption("No puedo asistir (cambio de planes)");
    setOtherReasonText("");
    setCancelError(null);
  }

  function submitCancel() {
    if (!cancelTarget) {
      return;
    }

    let reason = cancelOption;
    if (cancelOption === "Otro") {
      reason = otherReasonText.trim();
      if (!reason) {
        setCancelError("Por favor detalla el motivo de la cancelacion.");
        return;
      }
    }

    cancelMutation.mutate({ id: cancelTarget.id, reason });
  }

  return (
    <section className="client-appointments-page">
      <div className="client-book-hero">
        <div>
          <h1>Seguí tus solicitudes.</h1>
        </div>

        <Link className="client-primary-link" to={`/n/${businessSlug}/app/book`}>
          Pedir otro turno
          <CalendarClock aria-hidden="true" size={18} />
        </Link>
      </div>

      {appointmentsQuery.isLoading ? (
        <div className="client-empty-state">
          <strong>Cargando turnos...</strong>
          <p>Estamos buscando tus solicitudes.</p>
        </div>
      ) : null}

      {appointmentsQuery.isError ? (
        <div className="client-empty-state tone-danger">
          <strong>No pudimos cargar tus turnos.</strong>
          <p>Proba recargar la pagina en unos minutos.</p>
        </div>
      ) : null}

      {cancelSuccess ? (
        <div className="client-action-success">
          <CheckCircle2 aria-hidden="true" size={20} />
          <span>{cancelSuccess}</span>
        </div>
      ) : null}

      {!appointmentsQuery.isLoading &&
      !appointmentsQuery.isError &&
      appointments.length === 0 ? (
        <div className="client-empty-state">
          <strong>Todavia no solicitaste turnos.</strong>
          <p>Cuando pidas uno, va a aparecer aca con su estado.</p>
          <Link className="client-inline-link" to={`/n/${businessSlug}/app/book`}>
            Pedir mi primer turno
          </Link>
        </div>
      ) : null}

      {appointments.length > 0 ? (
        <div className="client-dashboard-content">
          {upcomingAppointments.length > 0 ? (
            <AppointmentSection
              appointments={upcomingAppointments}
              emptyText="No tenes turnos proximos."
              icon={<CheckCircle2 aria-hidden="true" size={20} />}
              onCancel={openCancelModal}
              title="Tus proximos turnos"
              businessName={businessName}
            />
          ) : (
            <div className="client-no-upcoming">
              <p className="client-muted-text">No tenes turnos proximos programados.</p>
              <Link className="client-inline-link" to={`/n/${businessSlug}/app/book`}>
                Pedir un turno
              </Link>
            </div>
          )}

          {historyAppointments.length > 0 ? (
            <div className="client-history-toggle-section">
              <button
                className="client-history-toggle-button"
                type="button"
                onClick={() => setShowHistory((prev) => !prev)}
              >
                <span>{showHistory ? "Ocultar historial de turnos" : "Ver historial de turnos"}</span>
                {showHistory ? (
                  <ChevronUp aria-hidden="true" size={16} />
                ) : (
                  <ChevronDown aria-hidden="true" size={16} />
                )}
              </button>

              {showHistory ? (
                <div className="client-history-expanded">
                  <AppointmentSection
                  appointments={historyAppointments}
                  emptyText="No hay historial de turnos."
                  icon={<History aria-hidden="true" size={20} />}
                  onCancel={openCancelModal}
                  title="Historial de turnos"
                  businessName={businessName}
                />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {cancelTarget ? (
        <div
          className="client-modal-backdrop"
          role="presentation"
          onClick={closeCancelModal}
        >
          <section
            aria-modal="true"
            aria-labelledby="client-cancel-title"
            className="client-confirm-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label="Cerrar cancelacion"
              className="client-modal-close"
              type="button"
              onClick={closeCancelModal}
            >
              <X aria-hidden="true" size={20} />
            </button>

            <span>
              {cancelTarget.status === "PENDING"
                ? "Cancelar solicitud"
                : "Cancelar turno"}
            </span>
            <h2 id="client-cancel-title">
              {cancelTarget.status === "PENDING"
                ? "Vas a cancelar esta solicitud."
                : "Vas a cancelar este turno."}
            </h2>
            <p className="client-confirmation-hint">
              <XCircle aria-hidden="true" size={16} />
              Esta accion libera el horario y no se puede deshacer desde el panel.
            </p>

            <dl>
              <div>
                <dt>Servicio</dt>
                <dd>{cancelTarget.serviceName}</dd>
              </div>
              <div>
                <dt>Profesional</dt>
                <dd>{cancelTarget.professionalName}</dd>
              </div>
              <div>
                <dt>Dia y horario</dt>
                <dd>{formatShortDateTime(cancelTarget.startDateTime)}</dd>
              </div>
            </dl>

             <label className="client-notes-field">
               <span>Motivo de cancelacion</span>
               <select
                 value={cancelOption}
                 onChange={(event) => {
                   setCancelOption(event.target.value);
                   setCancelError(null);
                 }}
               >
                 <option value="No puedo asistir (cambio de planes)">
                   No puedo asistir (cambio de planes)
                 </option>
                 <option value="Inconveniente de ultimo momento">
                   Inconveniente de ultimo momento
                 </option>
                 <option value="Quiero reprogramar para otra fecha">
                   Quiero reprogramar para otra fecha
                 </option>
                 <option value="Error al seleccionar el horario/servicio">
                   Error al seleccionar el horario/servicio
                 </option>
                 <option value="Otro">Otro motivo...</option>
               </select>
             </label>

             {cancelOption === "Otro" ? (
               <label className="client-notes-field" style={{ marginTop: "12px" }}>
                 <span>Especificar motivo</span>
                 <textarea
                   maxLength={300}
                   rows={3}
                   value={otherReasonText}
                   onChange={(event) => {
                     setOtherReasonText(event.target.value);
                     setCancelError(null);
                   }}
                   placeholder="Por favor contanos brevemente el motivo..."
                 />
                 <small>{otherReasonText.length}/300 caracteres</small>
               </label>
             ) : null}

            {cancelError ? <p className="client-form-error">{cancelError}</p> : null}

            <div className="client-modal-actions">
              <button
                className="client-secondary-action"
                disabled={cancelMutation.isPending}
                type="button"
                onClick={closeCancelModal}
              >
                Volver
              </button>
              <button
                className="client-danger-action"
                disabled={cancelMutation.isPending}
                type="button"
                onClick={submitCancel}
              >
                {cancelMutation.isPending ? "Cancelando..." : "Confirmar cancelacion"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function SummaryCard({
  description,
  label,
  value,
}: {
  description: string;
  label: string;
  value: number;
}) {
  return (
    <article className="client-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}

function AppointmentSection({
  appointments,
  emptyText,
  icon,
  onCancel,
  title,
  businessName,
}: {
  appointments: Appointment[];
  emptyText: string;
  icon: ReactNode;
  onCancel: (appointment: Appointment) => void;
  title: string;
  businessName: string;
}) {
  return (
    <section className="client-dashboard-card client-appointment-section">
      <div className="client-section-title">
        {icon}
        <h2>{title}</h2>
      </div>

      {appointments.length === 0 ? (
        <p className="client-muted-text">{emptyText}</p>
      ) : (
        <div className="client-appointment-list">
          {appointments.map((appointment) => (
            <AppointmentCard
              appointment={appointment}
              key={appointment.id}
              onCancel={onCancel}
              businessName={businessName}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function AppointmentCard({
  appointment,
  onCancel,
  businessName,
}: {
  appointment: Appointment;
  onCancel: (appointment: Appointment) => void;
  businessName: string;
}) {
  const statusTone = getStatusTone(appointment.status);
  const cancelable = canClientCancel(appointment);

  return (
    <article className="client-appointment-card">
      <div>
        <span className={`client-status-pill ${statusTone}`}>
          {appointment.status === "PENDING" ? (
            <Clock aria-hidden="true" size={14} />
          ) : appointment.status === "CONFIRMED" ? (
            <CheckCircle2 aria-hidden="true" size={14} />
          ) : (
            <XCircle aria-hidden="true" size={14} />
          )}
          {getStatusLabel(appointment.status, businessName)}
        </span>
        <h3>{appointment.serviceName}</h3>
        <p>{formatShortDateTime(appointment.startDateTime)}</p>
        {getStatusMessage(appointment.status, businessName) ? (
          <small className="client-status-message">
            {getStatusMessage(appointment.status, businessName)}
          </small>
        ) : null}
      </div>

      <dl>
        <div>
          <dt>Profesional</dt>
          <dd>{appointment.professionalName}</dd>
        </div>
        {appointment.notes && (
          <div>
            <dt>Notas</dt>
            <dd>{appointment.notes}</dd>
          </div>
        )}
      </dl>

      {cancelable ? (
        <button
          className="client-cancel-appointment-button"
          type="button"
          onClick={() => onCancel(appointment)}
        >
          {appointment.status === "PENDING" ? "Cancelar solicitud" : "Cancelar turno"}
        </button>
      ) : null}
    </article>
  );
}
