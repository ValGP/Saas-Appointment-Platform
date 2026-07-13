import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../../shared/api/httpClient";
import { useAuth } from "../context/AuthProvider";

type RegisterFormValues = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
};

export function RegisterPage() {
  const { registerClient } = useAuth();
  const navigate = useNavigate();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [error, setError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setError(null);

    try {
      await registerClient({
        ...values,
        phone: values.phone.trim() || undefined,
      });
      navigate(`/n/${businessSlug}/app`, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo crear la cuenta. Intenta nuevamente.",
      );
    }
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">Registro de cliente</p>
      <h1>Crear cuenta</h1>
      <p>Registrate para poder agendar y gestionar tus turnos.</p>

      <form className="form-stack" onSubmit={handleSubmit(onSubmit)}>
        <label>
          Nombre completo
          <input
            autoComplete="name"
            type="text"
            {...register("fullName", {
              required: "Ingresa tu nombre completo.",
            })}
          />
          {errors.fullName ? (
            <span className="field-error">{errors.fullName.message}</span>
          ) : null}
        </label>

        <label>
          Email
          <input
            autoComplete="email"
            type="email"
            {...register("email", {
              required: "Ingresa tu email.",
            })}
          />
          {errors.email ? (
            <span className="field-error">{errors.email.message}</span>
          ) : null}
        </label>

        <label>
          Password
          <input
            autoComplete="new-password"
            type="password"
            {...register("password", {
              required: "Ingresa tu password.",
              minLength: {
                value: 8,
                message: "La contraseña debe tener al menos 8 caracteres.",
              },
            })}
          />
          {errors.password ? (
            <span className="field-error">{errors.password.message}</span>
          ) : null}
        </label>

        <label>
          Telefono (opcional)
          <input
            autoComplete="tel"
            type="tel"
            {...register("phone")}
          />
          {errors.phone ? (
            <span className="field-error">{errors.phone.message}</span>
          ) : null}
        </label>

        {error ? <div className="form-error">{error}</div> : null}

        <button className="button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="auth-footer">
        Ya tenes cuenta? <Link to={`/n/${businessSlug}/login`}>Ingresar</Link>
      </p>
    </section>
  );
}
