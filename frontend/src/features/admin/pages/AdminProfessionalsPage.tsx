import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Power, PowerOff, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "../../../shared/api/httpClient";
import { getBusinessHours } from "../../business-hours/api/businessHoursApi";
import { AdminActionsMenu } from "../components/AdminActionsMenu";
import { AdminConfirmDialog } from "../components/AdminConfirmDialog";
import { AdminConflictBadge } from "../components/AdminConflictBadge";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminInactiveItemsModal } from "../components/AdminInactiveItemsModal";
import { AdminModal } from "../components/AdminModal";
import { AdminToast } from "../components/AdminToast";
import { useAdminToast } from "../hooks/useAdminToast";
import {
  createProfessional,
  getProfessionalServicesAssignment,
  getProfessionals,
  setProfessionalActive,
  updateProfessional,
  updateProfessionalServicesAssignment,
  type Professional,
  type ProfessionalPayload,
  type ServiceAssignmentMode,
} from "../../professionals/api/professionalsApi";
import { getServiceCategories } from "../../services/api/serviceCategoriesApi";
import { getServices } from "../../services/api/servicesApi";

type ProfessionalFormValues = {
  fullName: string;
  email: string;
  phone: string;
};

const emptyValues: ProfessionalFormValues = {
  fullName: "",
  email: "",
  phone: "",
};

export function AdminProfessionalsPage() {
  const queryClient = useQueryClient();
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [assignmentMode, setAssignmentMode] =
    useState<ServiceAssignmentMode>("ALL_SERVICES");
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [statusTarget, setStatusTarget] = useState<Professional | null>(null);
  const [isInactiveOpen, setIsInactiveOpen] = useState(false);
  const [professionalSearch, setProfessionalSearch] = useState("");
  const [professionalSort, setProfessionalSort] = useState("name-asc");
  const [assignmentCategoryId, setAssignmentCategoryId] = useState(0);
  const { showToast, toast } = useAdminToast();

  const professionalsQuery = useQuery({
    queryKey: ["professionals"],
    queryFn: () => getProfessionals(),
  });
  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: () => getServices(),
  });
  const categoriesQuery = useQuery({
    queryKey: ["service-categories"],
    queryFn: getServiceCategories,
  });
  const hoursQuery = useQuery({
    queryKey: ["business-hours"],
    queryFn: getBusinessHours,
  });
  const assignmentQuery = useQuery({
    queryKey: ["professional-services-assignment", editingProfessional?.id],
    enabled: isFormOpen && Boolean(editingProfessional),
    queryFn: () => getProfessionalServicesAssignment(editingProfessional!.id),
  });

  const professionals = professionalsQuery.data ?? [];
  const activeProfessionals = professionals.filter(
    (professional) => professional.active,
  );
  const visibleProfessionals = useMemo(() => {
    const search = professionalSearch.trim().toLowerCase();
    const filteredProfessionals = search
      ? activeProfessionals.filter((professional) =>
          [
            professional.fullName,
            professional.email,
            professional.phone ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(search),
        )
      : activeProfessionals;

    return [...filteredProfessionals].sort((a, b) => {
      if (professionalSort === "email-asc") {
        return a.email.localeCompare(b.email);
      }
      if (professionalSort === "name-desc") {
        return b.fullName.localeCompare(a.fullName);
      }
      return a.fullName.localeCompare(b.fullName);
    });
  }, [activeProfessionals, professionalSearch, professionalSort]);
  const inactiveProfessionals = professionals.filter(
    (professional) => !professional.active,
  );
  const services = servicesQuery.data ?? [];
  const activeCategories = (categoriesQuery.data ?? []).filter(
    (category) => category.active,
  );
  const activeServices = services.filter((service) => service.active);
  const assignableServices = activeServices.filter(
    (service) =>
      assignmentCategoryId === 0 || service.categoryId === assignmentCategoryId,
  );
  const activeHours = hoursQuery.data?.filter((item) => item.active) ?? [];
  const professionalsWithoutHours = new Set(
    activeProfessionals
      .filter(
        (professional) =>
          !activeHours.some((item) => item.professionalId === professional.id),
      )
      .map((professional) => professional.id),
  );
  const activeCount = useMemo(
    () => activeProfessionals.length,
    [activeProfessionals.length],
  );

  const form = useForm<ProfessionalFormValues>({
    defaultValues: emptyValues,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: ProfessionalPayload) => {
      if (assignmentMode === "SELECTED_SERVICES" && selectedServiceIds.length === 0) {
        throw new Error("Selecciona al menos un servicio.");
      }

      const savedProfessional = editingProfessional
        ? await updateProfessional(editingProfessional.id, payload)
        : await createProfessional(payload);

      await updateProfessionalServicesAssignment(savedProfessional.id, {
        mode: assignmentMode,
        serviceIds:
          assignmentMode === "SELECTED_SERVICES" ? selectedServiceIds : [],
      });

      return savedProfessional;
    },
    onSuccess: async () => {
      const message = editingProfessional
        ? "Profesional actualizado."
        : "Profesional creado.";
      await queryClient.invalidateQueries({ queryKey: ["professionals"] });
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      closeForm();
      showToast(message);
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "No se pudo guardar el profesional.",
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ active, id }: { active: boolean; id: number }) =>
      setProfessionalActive(id, active),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["professionals"] });
      setStatusTarget(null);
      showToast(
        variables.active ? "Profesional reactivado." : "Profesional desactivado.",
      );
    },
  });

  function openCreateForm() {
    setEditingProfessional(null);
    setFormError(null);
    setAssignmentMode("ALL_SERVICES");
    setSelectedServiceIds([]);
    setAssignmentCategoryId(0);
    form.reset(emptyValues);
    setIsFormOpen(true);
  }

  function openEditForm(professional: Professional) {
    setEditingProfessional(professional);
    setFormError(null);
    form.reset({
      fullName: professional.fullName,
      email: professional.email,
      phone: professional.phone ?? "",
    });
    setAssignmentMode("ALL_SERVICES");
    setSelectedServiceIds([]);
    setAssignmentCategoryId(0);
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingProfessional(null);
    setFormError(null);
    setAssignmentMode("ALL_SERVICES");
    setSelectedServiceIds([]);
    setAssignmentCategoryId(0);
    form.reset(emptyValues);
    setIsFormOpen(false);
  }

  useEffect(() => {
    if (!assignmentQuery.data) {
      return;
    }

    setAssignmentMode(assignmentQuery.data.mode);
    setSelectedServiceIds(assignmentQuery.data.services.map((service) => service.id));
  }, [assignmentQuery.data]);

  function onSubmit(values: ProfessionalFormValues) {
    setFormError(null);
    saveMutation.mutate({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || undefined,
    });
  }

  return (
    <section className="catalog-page">
      <AdminToast toast={toast} />
      <div className="catalog-header">
        <div>
          <p className="admin-kicker">Catalogos</p>
          <h2>Profesionales</h2>
          <p>
            Administra el equipo que atiende turnos y despues recibira horarios
            y bloqueos.
          </p>
        </div>
        <button className="admin-primary-button" type="button" onClick={openCreateForm}>
          <Plus aria-hidden="true" size={16} />
          Nuevo profesional
        </button>
      </div>

      <div className="catalog-summary-grid">
        <SummaryCard label="Profesionales" value={professionals.length} />
        <SummaryCard label="Activos" value={activeCount} />
        <SummaryCard
          label="Inactivos"
          value={inactiveProfessionals.length}
          onClick={() => setIsInactiveOpen(true)}
        />
      </div>

      {isFormOpen ? (
        <AdminModal
          kicker={editingProfessional ? "Editar" : "Crear"}
          title={
            editingProfessional
              ? editingProfessional.fullName
              : "Nuevo profesional"
          }
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

            <div className="assignment-panel form-span-2">
              <div>
                <p className="admin-kicker">Servicios</p>
                <strong>Servicios que puede atender</strong>
              </div>
              <div className="segmented-control" role="group">
                <button
                  type="button"
                  className={assignmentMode === "ALL_SERVICES" ? "active" : ""}
                  onClick={() => setAssignmentMode("ALL_SERVICES")}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={assignmentMode === "SELECTED_SERVICES" ? "active" : ""}
                  onClick={() => setAssignmentMode("SELECTED_SERVICES")}
                >
                  Seleccionar
                </button>
              </div>
              {assignmentMode === "SELECTED_SERVICES" ? (
                <>
                  <label className="assignment-filter">
                    Categoria
                    <select
                      value={assignmentCategoryId}
                      onChange={(event) =>
                        setAssignmentCategoryId(Number(event.target.value))
                      }
                    >
                      <option value={0}>Todas</option>
                      {activeCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Checklist
                    emptyLabel="No hay servicios activos para asignar en esta categoria."
                    items={assignableServices.map((service) => ({
                      id: service.id,
                      label: `${service.name}${service.categoryName ? ` - ${service.categoryName}` : ""}`,
                    }))}
                    selectedIds={selectedServiceIds}
                    onChange={setSelectedServiceIds}
                  />
                </>
              ) : (
                <p className="assignment-hint">
                  El profesional queda habilitado para todos los servicios activos.
                </p>
              )}
            </div>

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
                {saveMutation.isPending
                  ? "Guardando..."
                  : "Guardar profesional"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      <article className="admin-card catalog-list-card">
        <div className="card-heading">
          <div>
            <p className="admin-kicker">Listado</p>
            <h3>Profesionales cargados</h3>
          </div>
        </div>

        <div className="catalog-list-controls">
          <label className="catalog-search-field">
            <Search aria-hidden="true" size={16} />
            <input
              type="search"
              placeholder="Buscar profesional"
              value={professionalSearch}
              onChange={(event) => setProfessionalSearch(event.target.value)}
            />
          </label>
          <label>
            Orden
            <select
              value={professionalSort}
              onChange={(event) => setProfessionalSort(event.target.value)}
            >
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
              <option value="email-asc">Email A-Z</option>
            </select>
          </label>
        </div>

        {professionalsQuery.isLoading ? (
          <CatalogState label="Cargando profesionales..." />
        ) : null}
        {professionalsQuery.isError ? (
          <CatalogState label="No se pudieron cargar los profesionales." />
        ) : null}
        {!professionalsQuery.isLoading &&
        !professionalsQuery.isError &&
        activeProfessionals.length === 0 ? (
          <AdminEmptyState
            label="No hay profesionales activos cargados."
            supportingText="Crea un profesional para poder asignarle servicios, horarios y disponibilidad."
            action={
              <button className="admin-primary-button" type="button" onClick={openCreateForm}>
                <Plus aria-hidden="true" size={16} />
                Crear profesional
              </button>
            }
          />
        ) : null}
        {!professionalsQuery.isLoading &&
        !professionalsQuery.isError &&
        activeProfessionals.length > 0 &&
        visibleProfessionals.length === 0 ? (
          <AdminEmptyState
            label="No hay profesionales para esa busqueda."
            supportingText="Limpia el buscador para volver al listado completo."
            action={
              <button
                className="admin-soft-button"
                type="button"
                onClick={() => setProfessionalSearch("")}
              >
                Limpiar busqueda
              </button>
            }
          />
        ) : null}

        {visibleProfessionals.length > 0 ? (
          <div
            className="catalog-table professionals-table"
            role="table"
            aria-label="Profesionales"
          >
            <div className="catalog-table-head" role="row">
              <span>Profesional</span>
              <span>Email</span>
              <span>Telefono</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {visibleProfessionals.map((professional) => (
              <div className="catalog-row" role="row" key={professional.id}>
                <div className="catalog-main-cell">
                  <strong>{professional.fullName}</strong>
                  <span>ID #{professional.id}</span>
                  {professionalsWithoutHours.has(professional.id) ? (
                    <AdminConflictBadge label="Sin horarios" />
                  ) : null}
                </div>
                <span>{professional.email}</span>
                <span>{professional.phone || "Sin telefono"}</span>
                <span
                  className={`status-badge tone-${
                    professional.active ? "success" : "muted"
                  }`}
                >
                  {professional.active ? "Activo" : "Inactivo"}
                </span>
                <AdminActionsMenu
                  label={`Acciones de ${professional.fullName}`}
                  items={[
                    {
                      icon: Edit3,
                      label: "Editar profesional",
                      onClick: () => openEditForm(professional),
                    },
                    {
                      disabled: statusMutation.isPending,
                      icon: professional.active ? PowerOff : Power,
                      label: professional.active
                        ? "Desactivar profesional"
                        : "Reactivar profesional",
                      onClick: () => setStatusTarget(professional),
                      tone: professional.active ? "danger" : "default",
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
          title={
            statusTarget.active
              ? "Desactivar profesional"
              : "Reactivar profesional"
          }
          message={
            statusTarget.active
              ? `${statusTarget.fullName} dejara de aparecer para nuevos turnos y disponibilidad. El historial no se borra.`
              : `${statusTarget.fullName} volvera a poder atender segun sus servicios y horarios.`
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
          title="Profesionales inactivos"
          emptyLabel="No hay profesionales inactivos."
          items={inactiveProfessionals.map((professional) => ({
            id: professional.id,
            title: professional.fullName,
            description: professional.email,
          }))}
          onClose={() => setIsInactiveOpen(false)}
          onReactivate={(id) => {
            const professional = inactiveProfessionals.find((item) => item.id === id);
            if (professional) {
              setStatusTarget(professional);
            }
          }}
        />
      ) : null}
    </section>
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

function Checklist({
  emptyLabel,
  items,
  onChange,
  selectedIds,
}: {
  emptyLabel: string;
  items: Array<{ id: number; label: string }>;
  onChange: (ids: number[]) => void;
  selectedIds: number[];
}) {
  if (items.length === 0) {
    return <p className="assignment-hint">{emptyLabel}</p>;
  }

  return (
    <div className="assignment-checklist">
      {items.map((item) => {
        const checked = selectedIds.includes(item.id);
        return (
          <label key={item.id} className={checked ? "is-selected" : ""}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() =>
                onChange(
                  checked
                    ? selectedIds.filter((id) => id !== item.id)
                    : [...selectedIds, item.id],
                )
              }
            />
            <span>{item.label}</span>
          </label>
        );
      })}
    </div>
  );
}
