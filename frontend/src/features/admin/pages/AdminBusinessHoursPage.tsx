import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Power, PowerOff, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "../../../shared/api/httpClient";
import { usePersistentState } from "../../../shared/hooks/usePersistentState";
import { AdminActionsMenu } from "../components/AdminActionsMenu";
import { AdminConfirmDialog } from "../components/AdminConfirmDialog";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminInactiveItemsModal } from "../components/AdminInactiveItemsModal";
import { AdminModal } from "../components/AdminModal";
import { AdminToast } from "../components/AdminToast";
import { useAdminToast } from "../hooks/useAdminToast";
import {
  createBusinessHours,
  getBusinessHours,
  setBusinessHoursActive,
  updateBusinessHours,
  type BusinessHours,
  type BusinessHoursPayload,
  type DayOfWeek,
} from "../../business-hours/api/businessHoursApi";
import { getProfessionals } from "../../professionals/api/professionalsApi";

const days: Array<{ label: string; value: DayOfWeek }> = [
  { label: "Lunes", value: "MONDAY" },
  { label: "Martes", value: "TUESDAY" },
  { label: "Miercoles", value: "WEDNESDAY" },
  { label: "Jueves", value: "THURSDAY" },
  { label: "Viernes", value: "FRIDAY" },
  { label: "Sabado", value: "SATURDAY" },
  { label: "Domingo", value: "SUNDAY" },
];

const dayLabels = Object.fromEntries(days.map((day) => [day.value, day.label]));

type BusinessHoursFormValues = {
  professionalId: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
};

export function AdminBusinessHoursPage() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<BusinessHours | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<BusinessHours | null>(null);
  const [isInactiveOpen, setIsInactiveOpen] = useState(false);
  const [hoursSort, setHoursSort] = useState("day-asc");
  const [selectedProfessionalId, setSelectedProfessionalId] = usePersistentState(
    "admin:business-hours:professionalId",
    0,
  );
  const { showToast, toast } = useAdminToast();

  const hoursQuery = useQuery({
    queryKey: ["business-hours"],
    queryFn: getBusinessHours,
  });
  const professionalsQuery = useQuery({
    queryKey: ["professionals"],
    queryFn: () => getProfessionals(),
  });

  const hours = hoursQuery.data ?? [];
  const professionals = professionalsQuery.data ?? [];
  const activeProfessionals = professionals.filter(
    (professional) => professional.active,
  );
  const selectedProfessional = activeProfessionals.find(
    (professional) => professional.id === selectedProfessionalId,
  );
  const hoursForSelectedProfessional =
    selectedProfessionalId > 0
      ? hours.filter((item) => item.professionalId === selectedProfessionalId)
      : [];
  const activeHours = hoursForSelectedProfessional.filter((item) => item.active);
  const inactiveHours = hoursForSelectedProfessional.filter((item) => !item.active);
  const visibleActiveHours = useMemo(() => {
    const dayOrder = new Map(days.map((day, index) => [day.value, index]));

    return [...activeHours].sort((a, b) => {
      if (hoursSort === "time-asc") {
        return a.startTime.localeCompare(b.startTime);
      }
      if (hoursSort === "time-desc") {
        return b.startTime.localeCompare(a.startTime);
      }

      return (
        (dayOrder.get(a.dayOfWeek) ?? 0) - (dayOrder.get(b.dayOfWeek) ?? 0) ||
        a.startTime.localeCompare(b.startTime)
      );
    });
  }, [activeHours, hoursSort]);

  const form = useForm<BusinessHoursFormValues>({
    defaultValues: {
      professionalId: 0,
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "17:00",
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: BusinessHoursPayload) =>
      editingItem
        ? updateBusinessHours(editingItem.id, payload)
        : createBusinessHours(payload),
    onSuccess: async () => {
      const message = editingItem ? "Horario actualizado." : "Horario creado.";
      await queryClient.invalidateQueries({ queryKey: ["business-hours"] });
      closeForm();
      showToast(message);
    },
    onError: (error) =>
      setFormError(
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar el horario.",
      ),
  });

  const statusMutation = useMutation({
    mutationFn: ({ active, id }: { active: boolean; id: number }) =>
      setBusinessHoursActive(id, active),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["business-hours"] });
      setStatusTarget(null);
      showToast(variables.active ? "Horario reactivado." : "Horario desactivado.");
    },
  });

  function openCreateForm() {
    setEditingItem(null);
    setFormError(null);
    form.reset({
      professionalId: selectedProfessionalId,
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "17:00",
    });
    setIsFormOpen(true);
  }

  function openEditForm(item: BusinessHours) {
    setEditingItem(item);
    setFormError(null);
    form.reset({
      professionalId: item.professionalId,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime.slice(0, 5),
      endTime: item.endTime.slice(0, 5),
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingItem(null);
    setFormError(null);
    setIsFormOpen(false);
  }

  function onSubmit(values: BusinessHoursFormValues) {
    setFormError(null);
    saveMutation.mutate({
      professionalId: Number(values.professionalId),
      dayOfWeek: values.dayOfWeek,
      startTime: values.startTime,
      endTime: values.endTime,
    });
  }

  return (
    <section className="catalog-page">
      <AdminToast toast={toast} />
      <div className="catalog-header">
        <div>
          <p className="admin-kicker">Agenda</p>
          <h2>Horarios laborales</h2>
          <p>Define los dias y rangos en los que cada profesional atiende.</p>
        </div>
        <button
          className="admin-primary-button"
          type="button"
          onClick={openCreateForm}
          disabled={selectedProfessionalId === 0}
        >
          <Plus aria-hidden="true" size={16} />
          Nuevo horario
        </button>
      </div>

      <article className="admin-card calendar-toolbar">
        <div className="calendar-filters">
          <label>
            Profesional
            <select
              value={selectedProfessionalId}
              onChange={(event) => setSelectedProfessionalId(Number(event.target.value))}
            >
              <option value={0}>Seleccionar profesional</option>
              {activeProfessionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.fullName}
                </option>
              ))}
            </select>
          </label>
          <button
            className="admin-soft-button"
            type="button"
            onClick={() => setSelectedProfessionalId(0)}
          >
            <RotateCcw aria-hidden="true" size={16} />
            Restablecer
          </button>
        </div>
      </article>

      {isFormOpen ? (
        <AdminModal
          kicker={editingItem ? "Editar" : "Crear"}
          title={editingItem ? "Editar horario" : "Nuevo horario"}
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
              Dia
              <select {...form.register("dayOfWeek")}>
                {days.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Inicio
              <input type="time" {...form.register("startTime", { required: true })} />
            </label>

            <label>
              Fin
              <input type="time" {...form.register("endTime", { required: true })} />
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
                {saveMutation.isPending ? "Guardando..." : "Guardar horario"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      <div className="catalog-summary-grid">
        <SummaryCard label="Horarios" value={hoursForSelectedProfessional.length} />
        <SummaryCard label="Activos" value={activeHours.length} />
        <SummaryCard
          label="Inactivos"
          value={inactiveHours.length}
          onClick={() => setIsInactiveOpen(true)}
        />
      </div>

      <article className="admin-card catalog-list-card">
        <div className="card-heading">
          <div>
            <p className="admin-kicker">Listado</p>
            <h3>
              {selectedProfessional
                ? `Horarios de ${selectedProfessional.fullName}`
                : "Horarios por profesional"}
            </h3>
          </div>
        </div>

        <div className="catalog-list-controls is-compact">
          <label>
            Orden
            <select value={hoursSort} onChange={(event) => setHoursSort(event.target.value)}>
              <option value="day-asc">Dia y hora</option>
              <option value="time-asc">Hora inicio menor</option>
              <option value="time-desc">Hora inicio mayor</option>
            </select>
          </label>
        </div>

        {selectedProfessionalId === 0 ? (
          <AdminEmptyState
            label="Selecciona un profesional para ver sus horarios."
            supportingText="Los horarios se gestionan por profesional para evitar listas mezcladas."
          />
        ) : null}
        {hoursQuery.isLoading ? <CatalogState label="Cargando horarios..." /> : null}
        {hoursQuery.isError ? (
          <CatalogState label="No se pudieron cargar los horarios." />
        ) : null}
        {selectedProfessionalId > 0 &&
        !hoursQuery.isLoading &&
        !hoursQuery.isError &&
        activeHours.length === 0 ? (
          <AdminEmptyState
            label="No hay horarios activos para este profesional."
            supportingText="Crea un horario para que este profesional genere disponibilidad en Agenda."
            action={
              <button className="admin-primary-button" type="button" onClick={openCreateForm}>
                <Plus aria-hidden="true" size={16} />
                Crear horario
              </button>
            }
          />
        ) : null}

        {visibleActiveHours.length > 0 ? (
          <div className="catalog-table business-hours-table">
            <div className="catalog-table-head">
              <span>Profesional</span>
              <span>Dia</span>
              <span>Horario</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {visibleActiveHours.map((item) => (
              <div className="catalog-row" key={item.id}>
                <div className="catalog-main-cell">
                  <strong>{item.professionalName}</strong>
                  <span>ID #{item.id}</span>
                </div>
                <span>{dayLabels[item.dayOfWeek]}</span>
                <span>
                  {item.startTime.slice(0, 5)} - {item.endTime.slice(0, 5)}
                </span>
                <span className={`status-badge tone-${item.active ? "success" : "muted"}`}>
                  {item.active ? "Activo" : "Inactivo"}
                </span>
                <CatalogActions
                  active={item.active}
                  disabled={statusMutation.isPending}
                  label={item.professionalName}
                  onEdit={() => openEditForm(item)}
                  onToggle={() => setStatusTarget(item)}
                />
              </div>
            ))}
          </div>
        ) : null}
      </article>
      {statusTarget ? (
        <AdminConfirmDialog
          title={statusTarget.active ? "Desactivar horario" : "Reactivar horario"}
          message={
            statusTarget.active
              ? `Este horario de ${statusTarget.professionalName} dejara de generar disponibilidad. Los turnos existentes no se borran.`
              : `Este horario de ${statusTarget.professionalName} volvera a generar disponibilidad.`
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
          title="Horarios inactivos"
          emptyLabel="No hay horarios inactivos."
          items={inactiveHours.map((item) => ({
            id: item.id,
            title: item.professionalName,
            description: `${dayLabels[item.dayOfWeek]} ${item.startTime.slice(0, 5)} - ${item.endTime.slice(0, 5)}`,
          }))}
          onClose={() => setIsInactiveOpen(false)}
          onReactivate={(id) => {
            const item = inactiveHours.find((hour) => hour.id === id);
            if (item) {
              setStatusTarget(item);
            }
          }}
        />
      ) : null}
    </section>
  );
}

function CatalogActions({
  active,
  disabled,
  label,
  onEdit,
  onToggle,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <AdminActionsMenu
      label={`Acciones de ${label}`}
      items={[
        {
          icon: Edit3,
          label: "Editar horario",
          onClick: onEdit,
        },
        {
          disabled,
          icon: active ? PowerOff : Power,
          label: active ? "Desactivar horario" : "Reactivar horario",
          onClick: onToggle,
          tone: active ? "danger" : "default",
        },
      ]}
    />
  );
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
