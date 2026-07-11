import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Power, PowerOff } from "lucide-react";
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
  createAvailabilityBlock,
  getAvailabilityBlocks,
  setAvailabilityBlockActive,
  updateAvailabilityBlock,
  type AvailabilityBlock,
  type AvailabilityBlockPayload,
  type AvailabilityBlockType,
} from "../../availability-blocks/api/availabilityBlocksApi";
import { getProfessionals } from "../../professionals/api/professionalsApi";

const blockTypes: Array<{ label: string; value: AvailabilityBlockType }> = [
  { label: "Vacaciones", value: "VACATION" },
  { label: "Licencia medica", value: "SICK_LEAVE" },
  { label: "Feriado", value: "HOLIDAY" },
  { label: "Bloqueo manual", value: "MANUAL_BLOCK" },
  { label: "Otro", value: "OTHER" },
];

const blockTypeLabels = Object.fromEntries(
  blockTypes.map((type) => [type.value, type.label]),
);

type AvailabilityBlockFormValues = {
  professionalId: number;
  startDateTime: string;
  endDateTime: string;
  reason: string;
  type: AvailabilityBlockType;
};

function toInputDateTime(value: string) {
  return value.slice(0, 16);
}

export function AdminAvailabilityBlocksPage() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<AvailabilityBlock | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<AvailabilityBlock | null>(null);
  const [isInactiveOpen, setIsInactiveOpen] = useState(false);
  const [blockSort, setBlockSort] = useState("start-desc");
  const { showToast, toast } = useAdminToast();

  const blocksQuery = useQuery({
    queryKey: ["availability-blocks"],
    queryFn: getAvailabilityBlocks,
  });
  const professionalsQuery = useQuery({
    queryKey: ["professionals"],
    queryFn: () => getProfessionals(),
  });

  const blocks = blocksQuery.data ?? [];
  const activeBlocks = blocks.filter((item) => item.active);
  const inactiveBlocks = blocks.filter((item) => !item.active);
  const visibleActiveBlocks = useMemo(() => {
    return [...activeBlocks].sort((a, b) => {
      if (blockSort === "professional-asc") {
        return a.professionalName.localeCompare(b.professionalName);
      }
      if (blockSort === "start-asc") {
        return (
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime()
        );
      }
      return (
        new Date(b.startDateTime).getTime() -
        new Date(a.startDateTime).getTime()
      );
    });
  }, [activeBlocks, blockSort]);
  const professionals = professionalsQuery.data ?? [];

  const form = useForm<AvailabilityBlockFormValues>({
    defaultValues: {
      professionalId: 0,
      startDateTime: "",
      endDateTime: "",
      reason: "",
      type: "MANUAL_BLOCK",
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: AvailabilityBlockPayload) =>
      editingItem
        ? updateAvailabilityBlock(editingItem.id, payload)
        : createAvailabilityBlock(payload),
    onSuccess: async () => {
      const message = editingItem ? "Bloqueo actualizado." : "Bloqueo creado.";
      await queryClient.invalidateQueries({ queryKey: ["availability-blocks"] });
      closeForm();
      showToast(message);
    },
    onError: (error) =>
      setFormError(
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar el bloqueo.",
      ),
  });

  const statusMutation = useMutation({
    mutationFn: ({ active, id }: { active: boolean; id: number }) =>
      setAvailabilityBlockActive(id, active),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["availability-blocks"] });
      setStatusTarget(null);
      showToast(variables.active ? "Bloqueo reactivado." : "Bloqueo desactivado.");
    },
  });

  function openCreateForm() {
    setEditingItem(null);
    setFormError(null);
    form.reset({
      professionalId: professionals[0]?.id ?? 0,
      startDateTime: "",
      endDateTime: "",
      reason: "",
      type: "MANUAL_BLOCK",
    });
    setIsFormOpen(true);
  }

  function openEditForm(item: AvailabilityBlock) {
    setEditingItem(item);
    setFormError(null);
    form.reset({
      professionalId: item.professionalId,
      startDateTime: toInputDateTime(item.startDateTime),
      endDateTime: toInputDateTime(item.endDateTime),
      reason: item.reason ?? "",
      type: item.type,
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingItem(null);
    setFormError(null);
    setIsFormOpen(false);
  }

  function onSubmit(values: AvailabilityBlockFormValues) {
    setFormError(null);
    saveMutation.mutate({
      professionalId: Number(values.professionalId),
      startDateTime: values.startDateTime,
      endDateTime: values.endDateTime,
      reason: values.reason.trim() || undefined,
      type: values.type,
    });
  }

  return (
    <section className="catalog-page">
      <AdminToast toast={toast} />
      <div className="catalog-header">
        <div>
          <p className="admin-kicker">Agenda</p>
          <h2>Bloqueos</h2>
          <p>Registra vacaciones, licencias, feriados o bloqueos manuales.</p>
        </div>
        <button
          className="admin-primary-button"
          type="button"
          onClick={openCreateForm}
          disabled={professionals.length === 0}
        >
          <Plus aria-hidden="true" size={16} />
          Nuevo bloqueo
        </button>
      </div>

      {isFormOpen ? (
        <AdminModal
          kicker={editingItem ? "Editar" : "Crear"}
          title={editingItem ? "Editar bloqueo" : "Nuevo bloqueo"}
          onClose={closeForm}
        >
          <form className="admin-form-grid" onSubmit={form.handleSubmit(onSubmit)}>
            <label>
              Profesional
              <select
                {...form.register("professionalId", {
                  required: "Selecciona un profesional.",
                  valueAsNumber: true,
                  min: { value: 1, message: "Selecciona un profesional." },
                })}
              >
                <option value={0}>Seleccionar</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.fullName}
                  </option>
                ))}
              </select>
              <FieldError message={form.formState.errors.professionalId?.message} />
            </label>

            <label>
              Tipo
              <select {...form.register("type")}>
                {blockTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Inicio
              <input
                type="datetime-local"
                {...form.register("startDateTime", {
                  required: "Ingresa inicio.",
                })}
              />
              <FieldError message={form.formState.errors.startDateTime?.message} />
            </label>

            <label>
              Fin
              <input
                type="datetime-local"
                {...form.register("endDateTime", {
                  required: "Ingresa fin.",
                })}
              />
              <FieldError message={form.formState.errors.endDateTime?.message} />
            </label>

            <label className="form-span-2">
              Motivo
              <textarea
                rows={3}
                {...form.register("reason", {
                  maxLength: {
                    value: 300,
                    message: "Maximo 300 caracteres.",
                  },
                })}
              />
              <FieldError message={form.formState.errors.reason?.message} />
            </label>

            {formError ? <div className="admin-form-error">{formError}</div> : null}

            <div className="form-actions">
              <button className="admin-soft-button" type="button" onClick={closeForm}>
                Cancelar
              </button>
              <button className="admin-primary-button" type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Guardando..." : "Guardar bloqueo"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      <div className="catalog-summary-grid">
        <SummaryCard label="Bloqueos" value={blocks.length} />
        <SummaryCard label="Activos" value={activeBlocks.length} />
        <SummaryCard
          label="Inactivos"
          value={inactiveBlocks.length}
          onClick={() => setIsInactiveOpen(true)}
        />
      </div>

      <article className="admin-card catalog-list-card">
        <div className="card-heading">
          <div>
            <p className="admin-kicker">Listado</p>
            <h3>Bloqueos cargados</h3>
          </div>
        </div>

        <div className="catalog-list-controls is-compact">
          <label>
            Orden
            <select value={blockSort} onChange={(event) => setBlockSort(event.target.value)}>
              <option value="start-desc">Inicio mas reciente</option>
              <option value="start-asc">Inicio mas antiguo</option>
              <option value="professional-asc">Profesional A-Z</option>
            </select>
          </label>
        </div>

        {blocksQuery.isLoading ? <CatalogState label="Cargando bloqueos..." /> : null}
        {blocksQuery.isError ? <CatalogState label="No se pudieron cargar los bloqueos." /> : null}
        {!blocksQuery.isLoading && !blocksQuery.isError && activeBlocks.length === 0 ? (
          <AdminEmptyState
            label="No hay bloqueos activos cargados."
            supportingText="Crea bloqueos para vacaciones, licencias, feriados o excepciones de agenda."
            action={
              <button
                className="admin-primary-button"
                type="button"
                onClick={openCreateForm}
                disabled={professionals.length === 0}
              >
                <Plus aria-hidden="true" size={16} />
                Crear bloqueo
              </button>
            }
          />
        ) : null}

        {visibleActiveBlocks.length > 0 ? (
          <div className="catalog-table availability-blocks-table">
            <div className="catalog-table-head">
              <span>Profesional</span>
              <span>Tipo</span>
              <span>Inicio</span>
              <span>Fin</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {visibleActiveBlocks.map((item) => (
              <div className="catalog-row" key={item.id}>
                <div className="catalog-main-cell">
                  <strong>{item.professionalName}</strong>
                  <span>{item.reason || "Sin motivo"}</span>
                </div>
                <span>{blockTypeLabels[item.type]}</span>
                <span>{formatShortDateTime(item.startDateTime)}</span>
                <span>{formatShortDateTime(item.endDateTime)}</span>
                <span className={`status-badge tone-${item.active ? "success" : "muted"}`}>
                  {item.active ? "Activo" : "Inactivo"}
                </span>
                <AdminActionsMenu
                  label={`Acciones de bloqueo ${item.id}`}
                  items={[
                    {
                      icon: Edit3,
                      label: "Editar bloqueo",
                      onClick: () => openEditForm(item),
                    },
                    {
                      disabled: statusMutation.isPending,
                      icon: item.active ? PowerOff : Power,
                      label: item.active
                        ? "Desactivar bloqueo"
                        : "Reactivar bloqueo",
                      onClick: () => setStatusTarget(item),
                      tone: item.active ? "danger" : "default",
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
          title={statusTarget.active ? "Desactivar bloqueo" : "Reactivar bloqueo"}
          message={
            statusTarget.active
              ? `Este bloqueo de ${statusTarget.professionalName} dejara de afectar la disponibilidad.`
              : `Este bloqueo de ${statusTarget.professionalName} volvera a afectar la disponibilidad.`
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
          title="Bloqueos inactivos"
          emptyLabel="No hay bloqueos inactivos."
          items={inactiveBlocks.map((item) => ({
            id: item.id,
            title: item.professionalName,
            description: `${blockTypeLabels[item.type]} - ${formatShortDateTime(item.startDateTime)}`,
          }))}
          onClose={() => setIsInactiveOpen(false)}
          onReactivate={(id) => {
            const item = inactiveBlocks.find((block) => block.id === id);
            if (item) {
              setStatusTarget(item);
            }
          }}
        />
      ) : null}
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="field-error">{message}</span> : null;
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

function CatalogState({ label }: { label: string }) {
  return <div className="dashboard-state">{label}</div>;
}
