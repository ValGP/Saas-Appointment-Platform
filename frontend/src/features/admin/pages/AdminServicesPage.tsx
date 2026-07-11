import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Power, PowerOff, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "../../../shared/api/httpClient";
import { formatCurrency } from "../../../shared/utils/format";
import { AdminActionsMenu } from "../components/AdminActionsMenu";
import { AdminConfirmDialog } from "../components/AdminConfirmDialog";
import { AdminConflictBadge } from "../components/AdminConflictBadge";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminInactiveItemsModal } from "../components/AdminInactiveItemsModal";
import { AdminModal } from "../components/AdminModal";
import { AdminToast } from "../components/AdminToast";
import { useAdminToast } from "../hooks/useAdminToast";
import { getProfessionals } from "../../professionals/api/professionalsApi";
import {
  createServiceCategory,
  getServiceCategories,
  setServiceCategoryActive,
  updateServiceCategory,
  type ServiceCategory,
  type ServiceCategoryPayload,
} from "../../services/api/serviceCategoriesApi";
import {
  createService,
  getServiceProfessionalsAssignment,
  getServices,
  setServiceActive,
  updateService,
  updateServiceProfessionalsAssignment,
  type ServiceCatalogItem,
  type ServiceProfessionalAssignmentMode,
  type ServicePayload,
} from "../../services/api/servicesApi";

type ServiceFormValues = {
  name: string;
  categoryId: number;
  description: string;
  durationMinutes: number;
  onlineBookable: boolean;
  price: number;
  requiresEvaluation: boolean;
};

type CategoryFormValues = {
  description: string;
  displayOrder: number;
  name: string;
  slug: string;
};

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

const emptyValues: ServiceFormValues = {
  name: "",
  categoryId: 0,
  description: "",
  durationMinutes: 30,
  onlineBookable: true,
  price: 0,
  requiresEvaluation: false,
};

const emptyCategoryValues: CategoryFormValues = {
  description: "",
  displayOrder: 0,
  name: "",
  slug: "",
};

export function AdminServicesPage() {
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [assignmentMode, setAssignmentMode] =
    useState<ServiceProfessionalAssignmentMode>("ALL_PROFESSIONALS");
  const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<number[]>(
    [],
  );
  const [statusTarget, setStatusTarget] = useState<ServiceCatalogItem | null>(null);
  const [isInactiveOpen, setIsInactiveOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceSort, setServiceSort] = useState("name-asc");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(0);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [categoryStatusTarget, setCategoryStatusTarget] =
    useState<ServiceCategory | null>(null);
  const { showToast, toast } = useAdminToast();

  const categoriesQuery = useQuery({
    queryKey: ["service-categories"],
    queryFn: getServiceCategories,
  });
  const servicesQuery = useQuery({
    queryKey: ["services", selectedCategoryFilter],
    queryFn: () =>
      getServices({
        categoryId: selectedCategoryFilter > 0 ? selectedCategoryFilter : undefined,
      }),
  });
  const professionalsQuery = useQuery({
    queryKey: ["professionals"],
    queryFn: () => getProfessionals(),
  });
  const assignmentQuery = useQuery({
    queryKey: ["service-professionals-assignment", editingService?.id],
    enabled: isFormOpen && Boolean(editingService),
    queryFn: () => getServiceProfessionalsAssignment(editingService!.id),
  });

  const services = servicesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const activeCategories = categories.filter((category) => category.active);
  const inactiveCategories = categories.filter((category) => !category.active);
  const activeServices = services.filter((service) => service.active);
  const inactiveServices = services.filter((service) => !service.active);
  const visibleServices = useMemo(() => {
    const search = serviceSearch.trim().toLowerCase();
    const filteredServices = search
      ? activeServices.filter((service) =>
          [service.name, service.description ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(search),
        )
      : activeServices;

    return [...filteredServices].sort((a, b) => {
      if (serviceSort === "duration-asc") {
        return a.durationMinutes - b.durationMinutes;
      }
      if (serviceSort === "duration-desc") {
        return b.durationMinutes - a.durationMinutes;
      }
      if (serviceSort === "category-asc") {
        return (
          (a.categoryName ?? "").localeCompare(b.categoryName ?? "") ||
          a.name.localeCompare(b.name)
        );
      }
      if (serviceSort === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [activeServices, serviceSearch, serviceSort]);
  const professionals = professionalsQuery.data ?? [];
  const activeProfessionals = professionals.filter(
    (professional) => professional.active,
  );
  const serviceProfessionalQueries = useQueries({
    queries: activeServices.map((service) => ({
      queryKey: ["professionals", "compatible-service", service.id],
      queryFn: () => getProfessionals({ serviceId: service.id }),
    })),
  });
  const servicesWithoutProfessionals = new Set(
    activeServices
      .filter((service, index) => {
        const compatibleProfessionals = serviceProfessionalQueries[index]?.data ?? [];
        return (
          serviceProfessionalQueries[index]?.isSuccess &&
          compatibleProfessionals.filter((professional) => professional.active)
            .length === 0
        );
      })
      .map((service) => service.id),
  );
  const activeCount = useMemo(() => activeServices.length, [activeServices.length]);

  const form = useForm<ServiceFormValues>({
    defaultValues: emptyValues,
  });
  const requiresEvaluation = form.watch("requiresEvaluation");
  const categoryForm = useForm<CategoryFormValues>({
    defaultValues: emptyCategoryValues,
  });
  const categoryName = categoryForm.watch("name");

  useEffect(() => {
    if (categoryName !== undefined) {
      categoryForm.setValue("slug", slugify(categoryName));
    }
  }, [categoryForm, categoryName]);

  const saveMutation = useMutation({
    mutationFn: async (payload: ServicePayload) => {
      if (
        assignmentMode === "SELECTED_PROFESSIONALS" &&
        selectedProfessionalIds.length === 0
      ) {
        throw new Error("Selecciona al menos un profesional.");
      }

      const savedService = editingService
        ? await updateService(editingService.id, payload)
        : await createService(payload);

      await updateServiceProfessionalsAssignment(savedService.id, {
        mode: assignmentMode,
        professionalIds:
          assignmentMode === "SELECTED_PROFESSIONALS"
            ? selectedProfessionalIds
            : [],
      });

      return savedService;
    },
    onSuccess: async () => {
      const message = editingService
        ? "Servicio actualizado."
        : "Servicio creado.";
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      await queryClient.invalidateQueries({ queryKey: ["professionals"] });
      closeForm();
      showToast(message);
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "No se pudo guardar el servicio.",
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ active, id }: { active: boolean; id: number }) =>
      setServiceActive(id, active),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      setStatusTarget(null);
      showToast(variables.active ? "Servicio reactivado." : "Servicio desactivado.");
    },
  });

  const saveCategoryMutation = useMutation({
    mutationFn: (payload: ServiceCategoryPayload) =>
      editingCategory
        ? updateServiceCategory(editingCategory.id, payload)
        : createServiceCategory(payload),
    onSuccess: async () => {
      const message = editingCategory
        ? "Categoria actualizada."
        : "Categoria creada.";
      await queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      closeCategoryForm();
      showToast(message);
    },
    onError: (error) =>
      setCategoryFormError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "No se pudo guardar la categoria.",
      ),
  });

  const categoryStatusMutation = useMutation({
    mutationFn: ({ active, id }: { active: boolean; id: number }) =>
      setServiceCategoryActive(id, active),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["service-categories"] }),
        queryClient.invalidateQueries({ queryKey: ["services"] }),
      ]);
      setCategoryStatusTarget(null);
      showToast(
        variables.active ? "Categoria reactivada." : "Categoria desactivada.",
      );
    },
    onError: (error) =>
      showToast(
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar la categoria.",
        "danger",
      ),
  });

  function openCreateForm() {
    setEditingService(null);
    setFormError(null);
    setAssignmentMode("ALL_PROFESSIONALS");
    setSelectedProfessionalIds([]);
    form.reset({
      ...emptyValues,
      categoryId: activeCategories[0]?.id ?? 0,
    });
    setIsFormOpen(true);
  }

  function openEditForm(service: ServiceCatalogItem) {
    setEditingService(service);
    setFormError(null);
    form.reset({
      name: service.name,
      categoryId: service.categoryId ?? 0,
      description: service.description ?? "",
      durationMinutes: service.durationMinutes,
      onlineBookable: service.onlineBookable,
      price: service.price,
      requiresEvaluation: service.requiresEvaluation,
    });
    setAssignmentMode("ALL_PROFESSIONALS");
    setSelectedProfessionalIds([]);
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingService(null);
    setFormError(null);
    setAssignmentMode("ALL_PROFESSIONALS");
    setSelectedProfessionalIds([]);
    form.reset(emptyValues);
    setIsFormOpen(false);
  }

  useEffect(() => {
    if (!assignmentQuery.data) {
      return;
    }

    setAssignmentMode(assignmentQuery.data.mode);
    setSelectedProfessionalIds(
      assignmentQuery.data.professionals.map((professional) => professional.id),
    );
  }, [assignmentQuery.data]);

  const onlineBookable = form.watch("onlineBookable");

  useEffect(() => {
    if (requiresEvaluation && onlineBookable) {
      form.setValue("onlineBookable", false);
    }
  }, [form, requiresEvaluation, onlineBookable]);

  useEffect(() => {
    if (onlineBookable && requiresEvaluation) {
      form.setValue("requiresEvaluation", false);
    }
  }, [form, onlineBookable, requiresEvaluation]);

  function onSubmit(values: ServiceFormValues) {
    setFormError(null);
    saveMutation.mutate({
      name: values.name.trim(),
      categoryId: Number(values.categoryId),
      description: values.description.trim() || undefined,
      durationMinutes: Number(values.durationMinutes),
      onlineBookable: values.requiresEvaluation ? false : values.onlineBookable,
      price: Number(values.price),
      requiresEvaluation: values.requiresEvaluation,
    });
  }

  function openCreateCategoryForm() {
    setEditingCategory(null);
    setCategoryFormError(null);
    categoryForm.reset({
      ...emptyCategoryValues,
      displayOrder: categories.length * 10 + 10,
    });
    setIsCategoryFormOpen(true);
  }

  function openEditCategoryForm(category: ServiceCategory) {
    setEditingCategory(category);
    setCategoryFormError(null);
    categoryForm.reset({
      description: category.description ?? "",
      displayOrder: category.displayOrder,
      name: category.name,
      slug: category.slug,
    });
    setIsCategoryFormOpen(true);
  }

  function closeCategoryForm() {
    setEditingCategory(null);
    setCategoryFormError(null);
    categoryForm.reset(emptyCategoryValues);
    setIsCategoryFormOpen(false);
  }

  function onCategorySubmit(values: CategoryFormValues) {
    setCategoryFormError(null);
    saveCategoryMutation.mutate({
      description: values.description.trim() || undefined,
      displayOrder: Number(values.displayOrder),
      name: values.name.trim(),
      slug: values.slug.trim(),
    });
  }

  return (
    <section className="catalog-page">
      <AdminToast toast={toast} />
      <div className="catalog-header">
        <div>
          <p className="admin-kicker">Catalogos</p>
          <h2>Servicios</h2>
          <p>
            Carga y ajusta los servicios que despues se usan para turnos y
            disponibilidad.
          </p>
        </div>
        <button className="admin-primary-button" type="button" onClick={openCreateForm}>
          <Plus aria-hidden="true" size={16} />
          Nuevo servicio
        </button>
      </div>

      <div className="catalog-summary-grid">
        <SummaryCard label="Servicios totales" value={services.length} />
        <SummaryCard label="Activos" value={activeCount} />
        <SummaryCard
          label="Inactivos"
          value={inactiveServices.length}
          onClick={() => setIsInactiveOpen(true)}
        />
      </div>

      <article className="admin-card catalog-list-card">
        <div className="card-heading">
          <div>
            <p className="admin-kicker">Categorias</p>
            <h3>Categorias de servicios</h3>
          </div>
          <button
            className="admin-primary-button"
            type="button"
            onClick={openCreateCategoryForm}
          >
            <Plus aria-hidden="true" size={16} />
            Nueva categoria
          </button>
        </div>

        {categoriesQuery.isLoading ? (
          <CatalogState label="Cargando categorias..." />
        ) : null}
        {categoriesQuery.isError ? (
          <CatalogState label="No se pudieron cargar las categorias." />
        ) : null}
        {!categoriesQuery.isLoading &&
        !categoriesQuery.isError &&
        categories.length === 0 ? (
          <AdminEmptyState
            label="No hay categorias cargadas."
            supportingText="Crea categorias para ordenar los servicios en agenda y reserva online."
            action={
              <button className="admin-primary-button" type="button" onClick={openCreateCategoryForm}>
                <Plus aria-hidden="true" size={16} />
                Crear categoria
              </button>
            }
          />
        ) : null}

        {categories.length > 0 ? (
          <div className="category-chip-list">
            {categories.map((category) => (
              <div
                className={`category-chip ${category.active ? "" : "is-muted"}`}
                key={category.id}
              >
                <div>
                  <strong>{category.name}</strong>
                </div>
                <AdminActionsMenu
                  label={`Acciones de categoria ${category.name}`}
                  items={[
                    {
                      icon: Edit3,
                      label: "Editar categoria",
                      onClick: () => openEditCategoryForm(category),
                    },
                    {
                      disabled: categoryStatusMutation.isPending,
                      icon: category.active ? PowerOff : Power,
                      label: category.active
                        ? "Desactivar categoria"
                        : "Reactivar categoria",
                      onClick: () => setCategoryStatusTarget(category),
                      tone: category.active ? "danger" : "default",
                    },
                  ]}
                />
              </div>
            ))}
          </div>
        ) : null}
      </article>

      {isCategoryFormOpen ? (
        <AdminModal
          kicker={editingCategory ? "Editar" : "Crear"}
          title={editingCategory ? editingCategory.name : "Nueva categoria"}
          onClose={closeCategoryForm}
        >
          <form className="admin-form-grid" onSubmit={categoryForm.handleSubmit(onCategorySubmit)}>
            <label>
              Nombre
              <input
                {...categoryForm.register("name", {
                  required: "Ingresa el nombre.",
                  maxLength: {
                    value: 120,
                    message: "Maximo 120 caracteres.",
                  },
                })}
              />
              <FieldError message={categoryForm.formState.errors.name?.message} />
            </label>

            <input type="hidden" {...categoryForm.register("slug")} />

            <label>
              Orden
              <input
                type="number"
                min={0}
                {...categoryForm.register("displayOrder", {
                  min: { value: 0, message: "No puede ser negativo." },
                  valueAsNumber: true,
                })}
              />
              <FieldError
                message={categoryForm.formState.errors.displayOrder?.message}
              />
            </label>

            <label className="form-span-2">
              Descripcion
              <textarea
                rows={3}
                {...categoryForm.register("description", {
                  maxLength: {
                    value: 500,
                    message: "Maximo 500 caracteres.",
                  },
                })}
              />
              <FieldError
                message={categoryForm.formState.errors.description?.message}
              />
            </label>

            {categoryFormError ? (
              <div className="admin-form-error">{categoryFormError}</div>
            ) : null}

            <div className="form-actions">
              <button className="admin-soft-button" type="button" onClick={closeCategoryForm}>
                Cancelar
              </button>
              <button
                className="admin-primary-button"
                type="submit"
                disabled={saveCategoryMutation.isPending}
              >
                {saveCategoryMutation.isPending
                  ? "Guardando..."
                  : "Guardar categoria"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      {isFormOpen ? (
        <AdminModal
          kicker={editingService ? "Editar" : "Crear"}
          title={editingService ? editingService.name : "Nuevo servicio"}
          onClose={closeForm}
        >
          <form className="admin-form-grid" onSubmit={form.handleSubmit(onSubmit)}>
            <label>
              Nombre
              <input
                {...form.register("name", {
                  required: "Ingresa el nombre.",
                  maxLength: {
                    value: 120,
                    message: "Maximo 120 caracteres.",
                  },
                })}
              />
              <FieldError message={form.formState.errors.name?.message} />
            </label>

            <label>
              Categoria
              <select
                {...form.register("categoryId", {
                  required: "Selecciona una categoria.",
                  valueAsNumber: true,
                  min: { value: 1, message: "Selecciona una categoria." },
                })}
              >
                <option value={0}>Seleccionar</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <FieldError message={form.formState.errors.categoryId?.message} />
            </label>

            <label>
              Duracion en minutos
              <input
                type="number"
                min={1}
                {...form.register("durationMinutes", {
                  required: "Ingresa la duracion.",
                  min: { value: 1, message: "Debe ser mayor a 0." },
                  valueAsNumber: true,
                })}
              />
              <FieldError
                message={form.formState.errors.durationMinutes?.message}
              />
            </label>

            <label>
              Precio
              <input
                type="number"
                min={0}
                step="0.01"
                {...form.register("price", {
                  required: "Ingresa el precio.",
                  min: { value: 0, message: "No puede ser negativo." },
                  valueAsNumber: true,
                })}
              />
              <FieldError message={form.formState.errors.price?.message} />
            </label>

            <label className="form-span-2">
              Descripcion
              <textarea
                rows={3}
                {...form.register("description", {
                  maxLength: {
                    value: 500,
                    message: "Maximo 500 caracteres.",
                  },
                })}
              />
              <FieldError
                message={form.formState.errors.description?.message}
              />
            </label>

            <div className="assignment-panel form-span-2">
              <div>
                <p className="admin-kicker">Reserva online</p>
                <strong>Uso en el flujo de turnos del cliente</strong>
              </div>
              <div className="booking-options">
                <label>
                  <input
                    type="checkbox"
                    {...form.register("onlineBookable")}
                  />
                  <span>
                    <strong>Permitir reserva online</strong>
                    <small>Los clientes pueden elegir este servicio al sacar turno.</small>
                  </span>
                </label>
                <label>
                  <input type="checkbox" {...form.register("requiresEvaluation")} />
                  <span>
                    <strong>Requiere evaluacion previa</strong>
                    <small>
                      Se coordina por administracion y no aparece en reserva online.
                    </small>
                  </span>
                </label>
              </div>
            </div>

            <div className="assignment-panel form-span-2">
              <div>
                <p className="admin-kicker">Profesionales</p>
                <strong>Disponibilidad del servicio</strong>
              </div>
              <div className="segmented-control" role="group">
                <button
                  type="button"
                  className={assignmentMode === "ALL_PROFESSIONALS" ? "active" : ""}
                  onClick={() => setAssignmentMode("ALL_PROFESSIONALS")}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={
                    assignmentMode === "SELECTED_PROFESSIONALS" ? "active" : ""
                  }
                  onClick={() => setAssignmentMode("SELECTED_PROFESSIONALS")}
                >
                  Seleccionar
                </button>
              </div>
              {assignmentMode === "SELECTED_PROFESSIONALS" ? (
                <Checklist
                  emptyLabel="No hay profesionales activos para asignar."
                  items={activeProfessionals.map((professional) => ({
                    id: professional.id,
                    label: professional.fullName,
                  }))}
                  selectedIds={selectedProfessionalIds}
                  onChange={setSelectedProfessionalIds}
                />
              ) : (
                <p className="assignment-hint">
                  El servicio queda disponible para todos los profesionales activos.
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
                {saveMutation.isPending ? "Guardando..." : "Guardar servicio"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      <article className="admin-card catalog-list-card">
        <div className="card-heading">
          <div>
            <p className="admin-kicker">Listado</p>
            <h3>Servicios cargados</h3>
          </div>
        </div>

        <div className="catalog-list-controls">
          <label>
            Categoria
            <select
              value={selectedCategoryFilter}
              onChange={(event) =>
                setSelectedCategoryFilter(Number(event.target.value))
              }
            >
              <option value={0}>Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="catalog-search-field">
            <Search aria-hidden="true" size={16} />
            <input
              type="search"
              placeholder="Buscar servicio"
              value={serviceSearch}
              onChange={(event) => setServiceSearch(event.target.value)}
            />
          </label>
          <label>
            Orden
            <select
              value={serviceSort}
              onChange={(event) => setServiceSort(event.target.value)}
            >
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
              <option value="category-asc">Categoria A-Z</option>
              <option value="duration-asc">Duracion menor</option>
              <option value="duration-desc">Duracion mayor</option>
            </select>
          </label>
        </div>

        {servicesQuery.isLoading ? (
          <CatalogState label="Cargando servicios..." />
        ) : null}
        {servicesQuery.isError ? (
          <CatalogState label="No se pudieron cargar los servicios." />
        ) : null}
        {!servicesQuery.isLoading &&
        !servicesQuery.isError &&
        activeServices.length === 0 ? (
          <AdminEmptyState
            label="No hay servicios activos cargados."
            supportingText="Crea un servicio para que pueda aparecer en Agenda y en la creacion de turnos."
            action={
              <button className="admin-primary-button" type="button" onClick={openCreateForm}>
                <Plus aria-hidden="true" size={16} />
                Crear servicio
              </button>
            }
          />
        ) : null}
        {!servicesQuery.isLoading &&
        !servicesQuery.isError &&
        activeServices.length > 0 &&
        visibleServices.length === 0 ? (
          <AdminEmptyState
            label="No hay servicios para esa busqueda."
            supportingText="Limpia el buscador para volver al listado completo."
            action={
              <button
                className="admin-soft-button"
                type="button"
                onClick={() => setServiceSearch("")}
              >
                Limpiar busqueda
              </button>
            }
          />
        ) : null}

        {visibleServices.length > 0 ? (
          <div className="catalog-table services-table" role="table" aria-label="Servicios">
            <div className="catalog-table-head" role="row">
              <span>Servicio</span>
              <span>Categoria</span>
              <span>Duracion</span>
              <span>Precio</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {visibleServices.map((service) => (
              <div className="catalog-row" role="row" key={service.id}>
                <div className="catalog-main-cell">
                  <strong>{service.name}</strong>
                  <span>{service.description || "Sin descripcion"}</span>
                  <div className="service-booking-badges">
                    {service.requiresEvaluation ? (
                      <span className="status-badge tone-warning">
                        Evaluacion previa
                      </span>
                    ) : service.onlineBookable ? (
                      <span className="status-badge tone-success">
                        Reserva online
                      </span>
                    ) : (
                      <span className="status-badge tone-muted">Solo admin</span>
                    )}
                  </div>
                  {servicesWithoutProfessionals.has(service.id) ? (
                    <AdminConflictBadge label="Sin profesionales" tone="danger" />
                  ) : null}
                </div>
                <span>{service.categoryName ?? "Sin categoria"}</span>
                <span>{service.durationMinutes} min</span>
                <span>{formatCurrency(service.price)}</span>
                <span
                  className={`status-badge tone-${
                    service.active ? "success" : "muted"
                  }`}
                >
                  {service.active ? "Activo" : "Inactivo"}
                </span>
                <AdminActionsMenu
                  label={`Acciones de ${service.name}`}
                  items={[
                    {
                      icon: Edit3,
                      label: "Editar servicio",
                      onClick: () => openEditForm(service),
                    },
                    {
                      disabled: statusMutation.isPending,
                      icon: service.active ? PowerOff : Power,
                      label: service.active
                        ? "Desactivar servicio"
                        : "Reactivar servicio",
                      onClick: () => setStatusTarget(service),
                      tone: service.active ? "danger" : "default",
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
          title={statusTarget.active ? "Desactivar servicio" : "Reactivar servicio"}
          message={
            statusTarget.active
              ? `El servicio ${statusTarget.name} no podra usarse para nuevos turnos mientras este inactivo. El historial no se borra.`
              : `El servicio ${statusTarget.name} volvera a estar disponible segun sus profesionales asignados.`
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
          title="Servicios inactivos"
          emptyLabel="No hay servicios inactivos."
          items={inactiveServices.map((service) => ({
            id: service.id,
            title: service.name,
            description: service.description || `${service.durationMinutes} min`,
          }))}
          onClose={() => setIsInactiveOpen(false)}
          onReactivate={(id) => {
            const service = inactiveServices.find((item) => item.id === id);
            if (service) {
              setStatusTarget(service);
            }
          }}
        />
      ) : null}
      {categoryStatusTarget ? (
        <AdminConfirmDialog
          title={
            categoryStatusTarget.active
              ? "Desactivar categoria"
              : "Reactivar categoria"
          }
          message={
            categoryStatusTarget.active
              ? `${categoryStatusTarget.name} dejara de estar disponible para nuevos servicios. Si tiene servicios activos, el backend rechazara la accion.`
              : `${categoryStatusTarget.name} volvera a poder usarse en servicios.`
          }
          confirmLabel={categoryStatusTarget.active ? "Desactivar" : "Reactivar"}
          tone={categoryStatusTarget.active ? "danger" : "primary"}
          isPending={categoryStatusMutation.isPending}
          onCancel={() => setCategoryStatusTarget(null)}
          onConfirm={() =>
            categoryStatusMutation.mutate({
              id: categoryStatusTarget.id,
              active: !categoryStatusTarget.active,
            })
          }
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
