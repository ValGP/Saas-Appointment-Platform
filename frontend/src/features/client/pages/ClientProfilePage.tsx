import {
  CheckCircle2,
  Mail,
  Pencil,
  Phone,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "../../../shared/api/httpClient";
import { updateCurrentUser } from "../../auth/api/authApi";
import { useAuth } from "../../auth/context/AuthProvider";

function getInitials(fullName?: string) {
  return (
    fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "B"
  );
}

export function ClientProfilePage() {
  const { refreshUser, user } = useAuth();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [editableFields, setEditableFields] = useState({
    fullName: false,
    phone: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const initials = getInitials(user?.fullName);
  const accountStatus = user?.active === false ? "Inactiva" : "Activa";
  const saveMutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: async () => {
      setFormError(null);
      setFormSuccess("Perfil actualizado correctamente.");
      await refreshUser();
    },
    onError: (error) => {
      setFormSuccess(null);
      setFormError(
        error instanceof ApiError
          ? error.message
          : "No pudimos actualizar tu perfil.",
      );
    },
  });

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setPhone(user?.phone ?? "");
    setEditableFields({
      fullName: false,
      phone: false,
    });
  }, [user?.fullName, user?.phone]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanFullName = fullName.trim();
    const cleanPhone = phone.trim();

    setFormError(null);
    setFormSuccess(null);

    if (!cleanFullName) {
      setFormError("Ingresa tu nombre completo.");
      return;
    }

    if (cleanFullName.length > 120) {
      setFormError("El nombre puede tener hasta 120 caracteres.");
      return;
    }

    if (cleanPhone.length > 40) {
      setFormError("El telefono puede tener hasta 40 caracteres.");
      return;
    }

    saveMutation.mutate({
      fullName: cleanFullName,
      phone: cleanPhone || undefined,
    });
  }

  function enableField(field: "fullName" | "phone") {
    setEditableFields((current) => ({
      ...current,
      [field]: true,
    }));
    setFormError(null);
    setFormSuccess(null);
  }

  return (
    <section className="client-profile-page">
      <div className="client-book-hero">
        <div>
          <p className="public-pill">Mi perfil</p>
          <h1>Tus datos de cuenta.</h1>
          <p>
            Esta informacion ayuda a identificar tus solicitudes y mantener el
            contacto con BIBE cuando pedis un turno.
          </p>
        </div>
        <button
          className="client-secondary-action"
          type="button"
          onClick={() => void refreshUser()}
        >
          Actualizar datos
        </button>
      </div>

      <div className="client-profile-grid">
        <article className="client-profile-card client-profile-identity">
          <div className="client-profile-avatar">{initials}</div>
          <div>
            <span>Cliente</span>
            <h2>{user?.fullName ?? "Cliente BIBE"}</h2>
            <p>{user?.email ?? "Email no disponible"}</p>
          </div>
        </article>

        <article className="client-profile-card">
          <div className="client-section-title">
            <UserRound aria-hidden="true" size={20} />
            <h2>Datos personales</h2>
          </div>
          <dl className="client-profile-list">
            <div>
              <dt>Nombre completo</dt>
              <dd>{user?.fullName ?? "Sin nombre registrado"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <Mail aria-hidden="true" size={16} />
                {user?.email ?? "Sin email registrado"}
              </dd>
            </div>
            <div>
              <dt>Telefono</dt>
              <dd>
                <Phone aria-hidden="true" size={16} />
                {user?.phone || "Todavia no hay telefono registrado"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="client-profile-card client-profile-next">
          <span>Mis datos</span>
          <h2>Modificar mis datos</h2>
          <p>
            Podes actualizar tu nombre y telefono de contacto. Por seguridad, el
            email no se puede cambiar.
          </p>

          <form className="client-profile-form" onSubmit={handleSubmit}>
            <label>
              Nombre completo
              <span className="client-editable-field">
                <input
                  maxLength={120}
                  readOnly={!editableFields.fullName}
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setFormError(null);
                    setFormSuccess(null);
                  }}
                />
                <button
                  aria-label="Editar nombre completo"
                  type="button"
                  onClick={() => enableField("fullName")}
                >
                  <Pencil aria-hidden="true" size={16} />
                </button>
              </span>
            </label>

            <label>
              Telefono
              <span className="client-editable-field">
                <input
                  maxLength={40}
                  readOnly={!editableFields.phone}
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setFormError(null);
                    setFormSuccess(null);
                  }}
                  placeholder="Opcional"
                />
                <button
                  aria-label="Editar telefono"
                  type="button"
                  onClick={() => enableField("phone")}
                >
                  <Pencil aria-hidden="true" size={16} />
                </button>
              </span>
            </label>

            {formError ? <p className="client-form-error">{formError}</p> : null}
            {formSuccess ? (
              <div className="client-action-success">
                <CheckCircle2 aria-hidden="true" size={20} />
                <span>{formSuccess}</span>
              </div>
            ) : null}

            <div className="client-profile-actions">
              <button
                className="client-primary-action"
                disabled={saveMutation.isPending}
                type="submit"
              >
                {saveMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </button>
              <Link className="client-secondary-link" to={`/n/${businessSlug}/app/appointments`}>
                Ver mis turnos
              </Link>
            </div>
          </form>
        </article>
      </div>
    </section>
  );
}
