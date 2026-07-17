import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../../shared/api/httpClient";
import { useAuth } from "../context/AuthProvider";

type LoginFormValues = {
  email: string;
  password: string;
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [error, setError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);

    try {
      const user = await login(values);
      const from = location.state?.from?.pathname as string | undefined;

      navigate(from ?? (user.role === "ADMIN" ? `/n/${businessSlug}/admin` : `/n/${businessSlug}/app`), {
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo iniciar sesion. Revisa los datos e intenta nuevamente.",
      );
    }
  }

  return (
    <div className="auth-page-wrapper">
      <section className="auth-card">
        <p className="eyebrow">Autenticacion</p>
        <h1>Ingresar</h1>

        <form className="form-stack" onSubmit={handleSubmit(onSubmit)}>
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
              autoComplete="current-password"
              type="password"
              {...register("password", {
                required: "Ingresa tu password.",
              })}
            />
            {errors.password ? (
              <span className="field-error">{errors.password.message}</span>
            ) : null}
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          <button className="public-primary-button" style={{ width: "100%" }} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="auth-footer">
          No tenes cuenta? <Link to={`/n/${businessSlug}/register`}>Registrarse</Link>
        </p>
      </section>
    </div>
  );
}
