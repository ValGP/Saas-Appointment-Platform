import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, History, Plus, Power, PowerOff, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "../../../shared/api/httpClient";
import { formatShortDateTime } from "../../../shared/utils/date";
import { AdminActionsMenu } from "../components/AdminActionsMenu";
import { AdminConfirmDialog } from "../components/AdminConfirmDialog";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminInactiveItemsModal } from "../components/AdminInactiveItemsModal";
import { AdminModal } from "../components/AdminModal";
import { AdminToast } from "../components/AdminToast";
import { useAdminToast } from "../hooks/useAdminToast";
import {
  getAppointments,
  type Appointment,
  type AppointmentStatus,
} from "../../appointments/api/appointmentsApi";
import {
  createClient,
  getClients,
  setClientActive,
  updateClient,
  type Client,
  type ClientPayload,
} from "../../clients/api/clientsApi";

type ClientFormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

const emptyValues: ClientFormValues = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
};

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

export function AdminClientsPage() {
  const queryClient = useQueryClient();
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<Client | null>(null);
  const [isInactiveOpen, setIsInactiveOpen] = useState(false);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [clientSort, setClientSort] = useState("created-desc");
  const { showToast, toast } = useAdminToast();

  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  });
  const historyQuery = useQuery({
    queryKey: ["client-appointments-history", historyClient?.id],
    enabled: Boolean(historyClient),
    queryFn: () =>
      getAppointments({
        clientId: historyClient!.id,
        page: 0,
        size: 100,
        sort: "startDateTime,desc",
      }),
  });

  const clients = clientsQuery.data ?? [];
  const activeClients = clients.filter((client) => client.active);
  const inactiveClients = clients.filter((client) => !client.active);
  const visibleClients = useMemo(() => {
    const search = clientSearch.trim().toLowerCase();
    const filteredClients = search
      ? activeClients.filter((client) =>
          [client.fullName, client.email, client.phone ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(search),
        )
      : activeClients;

    return [...filteredClients].sort((a, b) => {
      if (clientSort === "name-asc") {
        return a.fullName.localeCompare(b.fullName);
      }
      if (clientSort === "name-desc") {
        return b.fullName.localeCompare(a.fullName);
      }
      if (clientSort === "created-asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [activeClients, clientSearch, clientSort]);
  const activeCount = useMemo(
    () => activeClients.length,
    [activeClients.length],
  );

  const form = useForm<ClientFormValues>({
    defaultValues: emptyValues,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: ClientPayload) =>
      editingClient ? updateClient(editingClient.id, payload) : createClient(payload),
    onSuccess: async () => {
      const message = editingClient ? "Cliente actualizado." : "Cliente creado.";
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      closeForm();
      showToast(message);
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar el cliente.",
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ active, id }: { active: boolean; id: number }) =>
      setClientActive(id, active),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      setStatusTarget(null);
      showToast(variables.active ? "Cliente reactivado." : "Cliente desactivado.");
    },
  });

  function openCreateForm() {
    setEditingClient(null);
    setFormError(null);
    form.reset(emptyValues);
    setIsFormOpen(true);
  }

  function openEditForm(client: Client) {
    setEditingClient(client);
    setFormError(null);
    form.reset({
      fullName: client.fullName,
      email: client.email,
      phone: client.phone ?? "",
      password: "",
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingClient(null);
    setFormError(null);
    form.reset(emptyValues);
    setIsFormOpen(false);
  }

  function onSubmit(values: ClientFormValues) {
    setFormError(null);
    saveMutation.mutate({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || undefined,
      password: values.password.trim() || undefined,
    });
  }

  return (
    <section className="catalog-page">
      <AdminToast toast={toast} />
      <div className="catalog-header">
        <div>
          <p className="admin-kicker">Catalogos</p>
          <h2>Clientes</h2>
          <p>
            Gestiona las personas que pueden pedir turnos y mantener su cuenta
            activa.
          </p>
        </div>
        <button className="admin-primary-button" type="button" onClick={openCreateForm}>
          <Plus aria-hidden="true" size={16} />
          Nuevo cliente
        </button>
      </div>

      <div className="catalog-summary-grid">
        <SummaryCard label="Clientes" value={clients.length} />
        <SummaryCard label="Activos" value={activeCount} />
        <SummaryCard
          label="Inactivos"
          value={inactiveClients.length}
          onClick={() => setIsInactiveOpen(true)}
        />
      </div>

      {isFormOpen ? (
        <AdminModal
          kicker={editingClient ? "Editar" : "Crear"}
          title={editingClient ? editingClient.fullName : "Nuevo cliente"}
          onClose={closeForm}
        >
          <form className="admin-form-grid" onSubmit={form.handleSubmit(onSubmit)}>
            <label>
              Nombre completo
              <input
                {...form.register("fullName", {
                  required: "Ingresa el nombre.",
                  maxLength: {
                    value: 120,
                    message: "Maximo 120 caracteres.",
                  },
                })}
              />
              <FieldError message={form.formState.errors.fullName?.message} />
            </label>

            <label>
              Email
              <input
                type="email"
                {...form.register("email", {
                  required: "Ingresa el email.",
                  maxLength: {
                    value: 160,
                    message: "Maximo 160 caracteres.",
                  },
                })}
              />
              <FieldError message={form.formState.errors.email?.message} />
            </label>

            <label>
              Telefono
              <input
                {...form.register("phone", {
                  maxLength: {
                    value: 40,
                    message: "Maximo 40 caracteres.",
                  },
                })}
              />
              <FieldError message={form.formState.errors.phone?.message} />
            </label>

            <label>
              {editingClient ? "Nueva password" : "Password"}
              <input
                type="password"
                autoComplete="new-password"
                {...form.register("password", {
                  required: editingClient ? false : "Ingresa una password.",
                  validate: (value) => {
                    if (!value && editingClient) {
                      return true;
                    }
                    if (value.length < 8) {
                      return "Minimo 8 caracteres.";
                    }
                    if (value.length > 100) {
                      return "Maximo 100 caracteres.";
                    }
                    return true;
                  },
                })}
              />
              <FieldError message={form.formState.errors.password?.message} />
            </label>

            {formError ? <div className="admin-form-error">{formError}</div> : null}

            <div className="form-actions">
              <button className="admin-soft-button" type="button" onClick={closeForm}>
                Cancelar
              </button>
              <button
                className="admin-primary-button"
                type="submit"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Guardando..." : "Guardar cliente"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      <article className="admin-card catalog-list-card">
        <div className="card-heading">
          <div>
            <p className="admin-kicker">Listado</p>
            <h3>Clientes cargados</h3>
          </div>
        </div>

        <div className="catalog-list-controls">
          <label className="catalog-search-field">
            <Search aria-hidden="true" size={16} />
            <input
              type="search"
              placeholder="Buscar por nombre, email o telefono"
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
            />
          </label>
          <label>
            Orden
            <select
              value={clientSort}
              onChange={(event) => setClientSort(event.target.value)}
            >
              <option value="created-desc">Ultimos creados</option>
              <option value="created-asc">Primeros creados</option>
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
            </select>
          </label>
        </div>

        {clientsQuery.isLoading ? <CatalogState label="Cargando clientes..." /> : null}
        {clientsQuery.isError ? (
          <CatalogState label="No se pudieron cargar los clientes." />
        ) : null}
        {!clientsQuery.isLoading && !clientsQuery.isError && activeClients.length === 0 ? (
          <AdminEmptyState
            label="No hay clientes activos cargados."
            supportingText="Crea un cliente para poder asociarlo a turnos y consultar su historial."
            action={
              <button className="admin-primary-button" type="button" onClick={openCreateForm}>
                <Plus aria-hidden="true" size={16} />
                Crear cliente
              </button>
            }
          />
        ) : null}
        {!clientsQuery.isLoading &&
        !clientsQuery.isError &&
        activeClients.length > 0 &&
        visibleClients.length === 0 ? (
          <AdminEmptyState
            label="No hay clientes para esa busqueda."
            supportingText="Revisa el texto buscado o limpia el filtro para volver al listado completo."
            action={
              <button
                className="admin-soft-button"
                type="button"
                onClick={() => setClientSearch("")}
              >
                Limpiar busqueda
              </button>
            }
          />
        ) : null}

        {visibleClients.length > 0 ? (
          <div className="catalog-table clients-table" role="table" aria-label="Clientes">
            <div className="catalog-table-head" role="row">
              <span>Cliente</span>
              <span>Email</span>
              <span>Telefono</span>
              <span>Alta</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {visibleClients.map((client) => (
              <div className="catalog-row" role="row" key={client.id}>
                <div className="catalog-main-cell">
                  <strong>{client.fullName}</strong>
                  <span>ID #{client.id}</span>
                </div>
                <span>{client.email}</span>
                <span>{client.phone || "Sin telefono"}</span>
                <span>{formatCreatedAt(client.createdAt)}</span>
                <span
                  className={`status-badge tone-${
                    client.active ? "success" : "muted"
                  }`}
                >
                  {client.active ? "Activo" : "Inactivo"}
                </span>
                <AdminActionsMenu
                  label={`Acciones de ${client.fullName}`}
                  items={[
                    {
                      icon: History,
                      label: "Ver historial",
                      onClick: () => setHistoryClient(client),
                    },
                    {
                      icon: Edit3,
                      label: "Editar cliente",
                      onClick: () => openEditForm(client),
                    },
                    {
                      disabled: statusMutation.isPending,
                      icon: client.active ? PowerOff : Power,
                      label: client.active
                        ? "Desactivar cliente"
                        : "Reactivar cliente",
                      onClick: () => setStatusTarget(client),
                      tone: client.active ? "danger" : "default",
                    },
                  ]}
                />
              </div>
            ))}
          </div>
        ) : null}
      </article>
      {statusTarget ? (
        <AdminConfirmDialog
          title={statusTarget.active ? "Desactivar cliente" : "Reactivar cliente"}
          message={
            statusTarget.active
              ? `${statusTarget.fullName} no podra operar como cliente activo mientras este desactivado. Sus turnos e historial no se borran.`
              : `${statusTarget.fullName} volvera a quedar disponible como cliente activo.`
          }
          confirmLabel={statusTarget.active ? "Desactivar" : "Reactivar"}
          tone={statusTarget.active ? "danger" : "primary"}
          isPending={statusMutation.isPending}
          onCancel={() => setStatusTarget(null)}
          onConfirm={() =>
            statusMutation.mutate({
              id: statusTarget.id,
              active: !statusTarget.active,
            })
          }
        />
      ) : null}
      {isInactiveOpen ? (
        <AdminInactiveItemsModal
          title="Clientes inactivos"
          emptyLabel="No hay clientes inactivos."
          items={inactiveClients.map((client) => ({
            id: client.id,
            title: client.fullName,
            description: client.email,
          }))}
          onClose={() => setIsInactiveOpen(false)}
          onReactivate={(id) => {
            const client = inactiveClients.find((item) => item.id === id);
            if (client) {
              setStatusTarget(client);
            }
          }}
        />
      ) : null}
      {historyClient ? (
        <ClientHistoryModal
          appointments={historyQuery.data?.content ?? []}
          client={historyClient}
          isError={historyQuery.isError}
          isLoading={historyQuery.isLoading}
          onClose={() => setHistoryClient(null)}
        />
      ) : null}
    </section>
  );
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function SummaryCard({
  label,
  onClick,
  value,
}: {
  label: string;
  onClick?: () => void;
  value: number;
}) {
  if (onClick) {
    return (
      <button
        className="admin-card catalog-summary-card is-action"
        type="button"
        onClick={onClick}
      >
        <span>{label}</span>
        <strong>{value}</strong>
      </button>
    );
  }

  return (
    <article className="admin-card catalog-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="field-error">{message}</span> : null;
}

function CatalogState({ label }: { label: string }) {
  return <div className="dashboard-state">{label}</div>;
}

function ClientHistoryModal({
  appointments,
  client,
  isError,
  isLoading,
  onClose,
}: {
  appointments: Appointment[];
  client: Client;
  isError: boolean;
  isLoading: boolean;
  onClose: () => void;
}) {
  return (
    <AdminModal
      kicker="Historial"
      title={`Turnos de ${client.fullName}`}
      onClose={onClose}
    >
      {isLoading ? <CatalogState label="Cargando historial..." /> : null}
      {isError ? <CatalogState label="No se pudo cargar el historial." /> : null}
      {!isLoading && !isError && appointments.length === 0 ? (
        <CatalogState label="Este cliente todavia no tiene turnos registrados." />
      ) : null}

      {appointments.length > 0 ? (
        <div className="client-history-list">
          {appointments.map((appointment) => (
            <article className="client-history-row" key={appointment.id}>
              <div>
                <strong>{formatShortDateTime(appointment.startDateTime)}</strong>
                <span>{appointment.serviceName}</span>
              </div>
              <div>
                <strong>{appointment.professionalName}</strong>
                <span>{appointment.notes || "Sin notas"}</span>
              </div>
              <span className={`status-badge tone-${statusTone[appointment.status]}`}>
                {statusLabels[appointment.status]}
              </span>
            </article>
          ))}
        </div>
      ) : null}
    </AdminModal>
  );
}
