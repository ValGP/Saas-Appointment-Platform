import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  UserRoundCheck,
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { type Appointment } from "../../appointments/api/appointmentsApi";
import { formatShortDateTime, formatTime } from "../../../shared/utils/date";
import { useAuth } from "../../auth/context/AuthProvider";

type BookingSuccessState = {
  appointment?: Appointment;
};

export function ClientBookingSuccessPage() {
  const location = useLocation();
  const { user } = useAuth();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const appointment = (location.state as BookingSuccessState | null)?.appointment;
  const isGuest = !user;
  const bookPath = isGuest ? `/n/${businessSlug}` : `/n/${businessSlug}/app/book`;

  if (!appointment) {
    return (
      <section className="client-result-page">
        <div className="client-result-card">
          <div className="client-result-icon tone-muted">
            <CalendarClock aria-hidden="true" size={34} />
          </div>
          <p className="public-pill">Solicitud de turno</p>
          <h1>No encontramos una solicitud reciente.</h1>
          <p>
            {isGuest 
              ? "Si ya pediste un turno, revisa tu casilla de correo electrónico donde te enviamos los detalles." 
              : "Si ya pediste un turno, podes revisarlo desde `Mis turnos`. Tambien podes iniciar una nueva solicitud."
            }
          </p>
          <div className="client-result-actions">
            {!isGuest && (
              <Link className="client-primary-link" to={`/n/${businessSlug}/app/appointments`}>
                Ver mis turnos
              </Link>
            )}
            <Link className="client-secondary-link" to={bookPath}>
              Solicitar otro turno
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="client-result-page">
      <div className="client-result-card">
        <div className="client-result-icon">
          <CheckCircle2 aria-hidden="true" size={36} />
        </div>
        <p className="public-pill">Solicitud enviada</p>
        <h1>Tu turno fue enviado a confirmar.</h1>
        <p>
          {isGuest 
            ? "El negocio va a revisar tu solicitud y confirmar el horario. Te enviamos un correo electrónico de confirmación con los detalles." 
            : "BIBE va a revisar la solicitud y confirmar el horario. Mientras tanto, podes seguir el estado desde `Mis turnos`."
          }
        </p>

        <div className="client-result-summary">
          <div>
            <CalendarCheck aria-hidden="true" size={18} />
            <span>Servicio</span>
            <strong>{appointment.serviceName}</strong>
          </div>
          <div>
            <UserRoundCheck aria-hidden="true" size={18} />
            <span>Profesional</span>
            <strong>{appointment.professionalName}</strong>
          </div>
          <div>
            <Clock aria-hidden="true" size={18} />
            <span>Dia y horario</span>
            <strong>
              {formatShortDateTime(appointment.startDateTime)} -{" "}
              {formatTime(appointment.endDateTime)}
            </strong>
          </div>
        </div>

        <div className="client-result-note">
          <span>Estado actual</span>
          <strong>Pendiente de confirmacion</strong>
        </div>

        <div className="client-result-actions">
          {!isGuest && (
            <Link className="client-primary-link" to={`/n/${businessSlug}/app/appointments`}>
              Ver mis turnos
            </Link>
          )}
          <Link className="client-secondary-link" to={bookPath}>
            Solicitar otro turno
          </Link>
        </div>
      </div>
    </section>
  );
}
