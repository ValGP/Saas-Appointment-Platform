import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="centered-page">
      <section className="panel compact-panel">
        <p className="eyebrow">404</p>
        <h1>Pagina no encontrada</h1>
        <p>La ruta que intentaste abrir todavia no existe.</p>
        <Link className="button" to="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
