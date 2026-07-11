import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { ApiError } from "../../../shared/api/httpClient";
import {
  addDays,
  endOfDay,
  formatShortDateTime,
  formatTime,
  startOfWeek,
  toLocalDateTimeParam,
} from "../../../shared/utils/date";
import { usePersistentState } from "../../../shared/hooks/usePersistentState";
import { getAppointments, createAppointment, type Appointment, type AppointmentPayload } from "../../appointments/api/appointmentsApi";
import { getAvailability, type AvailabilitySlot } from "../../availability/api/availabilityApi";
import {
  createClient,
  getClients,
  type ClientPayload,
} from "../../clients/api/clientsApi";
import { getProfessionals } from "../../professionals/api/professionalsApi";
import { getServiceCategories } from "../../services/api/serviceCategoriesApi";
import { getServices } from "../../services/api/servicesApi";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminToast } from "../components/AdminToast";
import { useAdminToast } from "../hooks/useAdminToast";

type AppointmentFormValues = {
  clientId: number;
  clientMode: "existing" | "new";
  newClientEmail: string;
  newClientFullName: string;
  newClientPassword: string;
  newClientPhone: string;
  notes: string;
};

type SelectedSlot = {
  startDateTime: string;
  endDateTime: string;
};

type DayModel = {
  date: Date;
  dateKey: string;
  label: string;
};

const currentWeekStart = startOfWeek(new Date());

function toDateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeKey(value: string) {
  return value.slice(11, 16);
}

function getWeekDays(weekStart: Date): DayModel[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      date,
      dateKey: toDateKey(date),
      label: new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      }).format(date),
    };
  });
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  const formatter = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `Semana del ${formatter.format(weekStart)} al ${formatter.format(weekEnd)}`;
}

function isActiveAppointment(appointment: Appointment) {
  return appointment.status === "PENDING" || appointment.status === "CONFIRMED";
}

export function AdminCalendarPage() {
  const queryClient = useQueryClient();
  const [weekStartKey, setWeekStartKey] = usePersistentState(
    "admin:calendar:weekStart",
    toDateKey(currentWeekStart),
  );
  const [professionalId, setProfessionalId] = usePersistentState<number>(
    "admin:calendar:professionalId",
    0,
  );
  const [categoryId, setCategoryId] = usePersistentState<number>(
    "admin:calendar:categoryId",
    0,
  );
  const [serviceId, setServiceId] = usePersistentState<number>(
    "admin:calendar:serviceId",
    0,
  );
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { showToast, toast } = useAdminToast();

  const professionalsQuery = useQuery({
    queryKey: ["professionals"],
    queryFn: () => getProfessionals(),
  });
  const categoriesQuery = useQuery({
    queryKey: ["service-categories"],
    queryFn: getServiceCategories,
  });
  const activeCategories = (categoriesQuery.data ?? []).filter(
    (category) => category.active,
  );
  const selectedCategoryId =
    categoryId && activeCategories.some((category) => category.id === categoryId)
      ? categoryId
      : 0;
  const servicesQuery = useQuery({
    queryKey: ["services", "category", selectedCategoryId],
    enabled: selectedCategoryId > 0,
    queryFn: () => getServices({ categoryId: selectedCategoryId }),
  });
  const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: getClients });

  const allProfessionals = professionalsQuery.data ?? [];
  const allServices = selectedCategoryId > 0 ? servicesQuery.data ?? [] : [];
  const clients = clientsQuery.data ?? [];
  const allActiveProfessionals = allProfessionals.filter(
    (professional) => professional.active,
  );
  const allActiveServices = allServices.filter((service) => service.active);
  const serviceOptions = allActiveServices;
  const selectedServiceId = serviceOptions.some((service) => service.id === serviceId)
    ? serviceId
    : 0;

  const compatibleProfessionalsQuery = useQuery({
    queryKey: ["professionals", "compatible-service", selectedServiceId],
    enabled: selectedServiceId > 0,
    queryFn: () => getProfessionals({ serviceId: selectedServiceId }),
  });

  const professionalOptions = (
    compatibleProfessionalsQuery.data ?? allActiveProfessionals
  ).filter((professional) => professional.active);
  const selectedProfessionalId =
    professionalId &&
    professionalOptions.some((professional) => professional.id === professionalId)
      ? professionalId
      : 0;
  const activeClients = clients.filter((client) => client.active);
  const selectedProfessional = professionalOptions.find(
    (professional) => professional.id === selectedProfessionalId,
  );
  const selectedService = serviceOptions.find(
    (service) => service.id === selectedServiceId,
  );
  const weekStart = useMemo(
    () => new Date(`${weekStartKey}T00:00:00`),
    [weekStartKey],
  );
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  useEffect(() => {
    if (professionalId > 0 && selectedProfessionalId === 0) {
      setProfessionalId(0);
    }
  }, [professionalId, selectedProfessionalId]);

  useEffect(() => {
    if (serviceId > 0 && selectedServiceId === 0) {
      setServiceId(0);
    }
  }, [serviceId, selectedServiceId]);

  useEffect(() => {
    if (categoryId > 0 && selectedCategoryId === 0) {
      setCategoryId(0);
    }
  }, [categoryId, selectedCategoryId]);

  const appointmentsQuery = useQuery({
    queryKey: ["calendar-appointments", selectedProfessionalId, weekStart],
    enabled: selectedProfessionalId > 0,
    queryFn: () =>
      getAppointments({
        professionalId: selectedProfessionalId,
        from: toLocalDateTimeParam(weekStart),
        to: toLocalDateTimeParam(endOfDay(addDays(weekStart, 6))),
        page: 0,
        size: 200,
        sort: "startDateTime,asc",
      }),
  });

  const availabilityQueries = useQueries({
    queries: weekDays.map((day) => ({
      queryKey: [
        "availability",
        selectedProfessionalId,
        selectedServiceId,
        day.dateKey,
      ],
      enabled: selectedProfessionalId > 0 && selectedServiceId > 0,
      queryFn: () =>
        getAvailability({
          professionalId: selectedProfessionalId,
          serviceId: selectedServiceId,
          date: day.dateKey,
        }),
    })),
  });

  const appointments = appointmentsQuery.data?.content ?? [];
  const activeAppointments = appointments.filter(isActiveAppointment);
  const availabilityByDay = weekDays.reduce<Record<string, AvailabilitySlot[]>>(
    (acc, day, index) => {
      acc[day.dateKey] = availabilityQueries[index]?.data ?? [];
      return acc;
    },
    {},
  );
  const appointmentsByDay = activeAppointments.reduce<Record<string, Appointment[]>>(
    (acc, appointment) => {
      const key = appointment.startDateTime.slice(0, 10);
      acc[key] = acc[key] ?? [];
      acc[key].push(appointment);
      return acc;
    },
    {},
  );
  const timeRows = useMemo(() => {
    const times = new Set<string>();

    weekDays.forEach((day) => {
      availabilityByDay[day.dateKey]?.forEach((slot) =>
        times.add(toTimeKey(slot.startDateTime)),
      );
      appointmentsByDay[day.dateKey]?.forEach((appointment) =>
        times.add(toTimeKey(appointment.startDateTime)),
      );
    });

    return Array.from(times).sort();
  }, [availabilityByDay, appointmentsByDay, weekDays]);

  const createForm = useForm<AppointmentFormValues>({
    defaultValues: {
      clientId: 0,
      clientMode: "existing",
      newClientEmail: "",
      newClientFullName: "",
      newClientPassword: "",
      newClientPhone: "",
      notes: "",
    },
  });
  const clientMode = createForm.watch("clientMode");
  const selectedClientId = createForm.watch("clientId");
  const newClientFullName = createForm.watch("newClientFullName");
  const selectedClient = activeClients.find(
    (client) => client.id === Number(selectedClientId),
  );

  const createMutation = useMutation({
    mutationFn: (payload: AppointmentPayload) => createAppointment(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["calendar-appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard-appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["availability"] }),
      ]);
      closeSlotModal();
      showToast("Turno creado.");
    },
    onError: (error) =>
      setFormError(
        error instanceof ApiError ? error.message : "No se pudo crear el turno.",
      ),
  });

  const createClientAndAppointmentMutation = useMutation({
    mutationFn: async ({
      client,
      notes,
    }: {
      client: ClientPayload;
      notes: string;
    }) => {
      const createdClient = await createClient(client);

      await createAppointment({
        clientId: createdClient.id,
        professionalId: selectedProfessionalId,
        serviceId: selectedServiceId,
        startDateTime: selectedSlot!.startDateTime,
        notes: notes.trim() || undefined,
      });

      return createdClient;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["clients"] }),
        queryClient.invalidateQueries({ queryKey: ["calendar-appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard-appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["availability"] }),
      ]);
      closeSlotModal();
      showToast("Cliente y turno creados.");
    },
    onError: (error) =>
      setFormError(
        error instanceof ApiError
          ? error.message
          : "No se pudo crear el cliente y el turno.",
      ),
  });

  function moveWeek(offset: number) {
    setWeekStartKey(toDateKey(addDays(weekStart, offset * 7)));
  }

  function resetWeek() {
    setWeekStartKey(toDateKey(currentWeekStart));
  }

  function resetCalendarFilters() {
    setWeekStartKey(toDateKey(currentWeekStart));
    setCategoryId(0);
    setServiceId(0);
    setProfessionalId(0);
  }

  function updateCategoryFilter(nextCategoryId: number) {
    setCategoryId(nextCategoryId);
    setServiceId(0);
    setProfessionalId(0);
  }

  function updateServiceFilter(nextServiceId: number) {
    setServiceId(nextServiceId);
    setProfessionalId(0);
  }

  function openSlotModal(slot: AvailabilitySlot) {
    setSelectedSlot(slot);
    setFormError(null);
    createForm.reset({
      clientId: activeClients[0]?.id ?? 0,
      clientMode: activeClients.length > 0 ? "existing" : "new",
      newClientEmail: "",
      newClientFullName: "",
      newClientPassword: "",
      newClientPhone: "",
      notes: "",
    });
  }

  function closeSlotModal() {
    setSelectedSlot(null);
    setFormError(null);
    createForm.reset();
  }

  function createFromSlot(values: AppointmentFormValues) {
    if (!selectedSlot) {
      return;
    }

    setFormError(null);

    if (values.clientMode === "new") {
      createClientAndAppointmentMutation.mutate({
        client: {
          email: values.newClientEmail.trim(),
          fullName: values.newClientFullName.trim(),
          password: values.newClientPassword.trim(),
          phone: values.newClientPhone.trim() || undefined,
        },
        notes: values.notes,
      });
      return;
    }

    createMutation.mutate({
      clientId: Number(values.clientId),
      professionalId: selectedProfessionalId,
      serviceId: selectedServiceId,
      startDateTime: selectedSlot.startDateTime,
      notes: values.notes.trim() || undefined,
    });
  }

  const isLoading =
    servicesQuery.isLoading ||
    categoriesQuery.isLoading ||
    professionalsQuery.isLoading ||
    compatibleProfessionalsQuery.isLoading ||
    appointmentsQuery.isLoading ||
    availabilityQueries.some((query) => query.isLoading);
  const hasError =
    servicesQuery.isError ||
    categoriesQuery.isError ||
    professionalsQuery.isError ||
    compatibleProfessionalsQuery.isError ||
    appointmentsQuery.isError ||
    availabilityQueries.some((query) => query.isError);
  const emptyStateLabel = getCalendarEmptyStateLabel({
    hasActiveServices: allActiveServices.length > 0,
    hasCategorySelection: selectedCategoryId > 0,
    hasCategories: activeCategories.length > 0,
    hasCompatibleProfessionals: professionalOptions.length > 0,
    hasSelection: selectedProfessionalId > 0 && selectedServiceId > 0,
    professionalName: selectedProfessional?.fullName,
    serviceName: selectedService?.name,
  });
  const emptyStateAction = getCalendarEmptyStateAction({
    hasActiveServices: allActiveServices.length > 0,
    hasCompatibleProfessionals: professionalOptions.length > 0,
    hasCategories: activeCategories.length > 0,
    selectedServiceId,
  });

  return (
    <section className="calendar-page">
      <AdminToast toast={toast} />
      <div className="catalog-header">
        <div>
          <p className="admin-kicker">Disponibilidad</p>
          <h2>Agenda</h2>
          <p>
            Revisa horarios disponibles por semana y crea turnos desde un slot
            valido.
          </p>
        </div>
      </div>

      <article className="admin-card calendar-toolbar">
        <div className="calendar-filters">
          <label>
            Categoria
            <select
              value={selectedCategoryId}
              onChange={(event) =>
                updateCategoryFilter(Number(event.target.value))
              }
            >
              <option value={0}>Seleccionar categoria</option>
              {activeCategories.length === 0 ? (
                <option value={0}>Sin categorias activas</option>
              ) : null}
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Servicio
            <select
              value={selectedServiceId}
              onChange={(event) => updateServiceFilter(Number(event.target.value))}
              disabled={selectedCategoryId === 0}
            >
              <option value={0}>
                {selectedCategoryId === 0
                  ? "Primero selecciona categoria"
                  : "Seleccionar servicio"}
              </option>
              {serviceOptions.length === 0 ? (
                <option value={0}>Sin servicios activos</option>
              ) : null}
              {serviceOptions.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Profesional
            <select
              value={selectedProfessionalId}
              onChange={(event) => setProfessionalId(Number(event.target.value))}
              disabled={selectedServiceId === 0}
            >
              <option value={0}>
                {selectedServiceId === 0
                  ? "Primero selecciona servicio"
                  : "Seleccionar profesional"}
              </option>
              {professionalOptions.length === 0 ? (
                <option value={0}>Sin profesionales compatibles</option>
              ) : null}
              {professionalOptions.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.fullName}
                </option>
              ))}
            </select>
          </label>
          <button className="admin-soft-button" type="button" onClick={resetCalendarFilters}>
            <RotateCcw aria-hidden="true" size={16} />
            Restablecer filtros
          </button>
        </div>

        <div className="week-switcher" aria-label="Cambiar semana">
          <button
            className="icon-button"
            type="button"
            onClick={() => moveWeek(-1)}
            aria-label="Semana anterior"
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <strong>{formatWeekRange(weekStart)}</strong>
          <button
            className="icon-button"
            type="button"
            onClick={() => moveWeek(1)}
            aria-label="Semana siguiente"
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
          <button className="admin-soft-button" type="button" onClick={resetWeek}>
            <RotateCcw aria-hidden="true" size={16} />
            Semana actual
          </button>
        </div>
      </article>

      <article className="admin-card calendar-board-card">
        <div className="card-heading">
          <div>
            <p className="admin-kicker">Semana</p>
            <h3>Disponibilidad y turnos ocupados</h3>
          </div>
          <span className="window-pill">{timeRows.length} horarios</span>
        </div>

        {emptyStateLabel && !isLoading && !hasError ? (
          <AdminEmptyState
            label={emptyStateLabel}
            supportingText="La agenda necesita un servicio y un profesional compatible antes de calcular horarios."
            action={emptyStateAction}
          />
        ) : null}
        {isLoading ? <CalendarState label="Calculando disponibilidad..." /> : null}
        {hasError ? (
          <CalendarState label="No se pudo cargar la disponibilidad." />
        ) : null}
        {!isLoading &&
        !hasError &&
        selectedProfessionalId > 0 &&
        selectedServiceId > 0 &&
        timeRows.length === 0 ? (
          <AdminEmptyState
            label={`No hay horarios para ${selectedProfessional?.fullName ?? "este profesional"} con ${selectedService?.name ?? "este servicio"} en esta semana.`}
            supportingText="Revisa horarios laborales, bloqueos, turnos ocupados o la relacion profesional-servicio."
            action={
              <Link className="admin-primary-button" to="/admin/business-hours">
                Revisar horarios
              </Link>
            }
          />
        ) : null}

        {!isLoading &&
        !hasError &&
        selectedProfessionalId > 0 &&
        selectedServiceId > 0 &&
        timeRows.length > 0 ? (
          <>
            <div className="availability-grid" role="table" aria-label="Disponibilidad semanal">
              <div className="availability-grid-head" role="row">
                <span>Hora</span>
                {weekDays.map((day) => (
                  <span key={day.dateKey}>{day.label}</span>
                ))}
              </div>
              {timeRows.map((time) => (
                <div className="availability-grid-row" role="row" key={time}>
                  <span className="availability-time">{time}</span>
                  {weekDays.map((day) => (
                    <AvailabilityCell
                      appointments={appointmentsByDay[day.dateKey] ?? []}
                      dayKey={day.dateKey}
                      key={day.dateKey}
                      onSelectSlot={openSlotModal}
                      slots={availabilityByDay[day.dateKey] ?? []}
                      time={time}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="availability-mobile-list">
              {weekDays.map((day) => (
                <section className="availability-mobile-day" key={day.dateKey}>
                  <h4>{day.label}</h4>
                  {getDayItems(
                    availabilityByDay[day.dateKey] ?? [],
                    appointmentsByDay[day.dateKey] ?? [],
                  ).length === 0 ? (
                    <p className="muted-copy">Sin horarios para este dia.</p>
                  ) : (
                    <div className="availability-mobile-slots">
                      {getDayItems(
                        availabilityByDay[day.dateKey] ?? [],
                        appointmentsByDay[day.dateKey] ?? [],
                      ).map((item) =>
                        item.type === "appointment" ? (
                          <div className="availability-slot is-booked" key={item.key}>
                            <strong>{toTimeKey(item.appointment.startDateTime)}</strong>
                            <span>{item.appointment.clientName}</span>
                            <small>{item.appointment.serviceName}</small>
                          </div>
                        ) : (
                          <button
                            className="availability-slot is-free"
                            type="button"
                            key={item.key}
                            onClick={() => openSlotModal(item.slot)}
                          >
                            <strong>{toTimeKey(item.slot.startDateTime)}</strong>
                            <span>Disponible</span>
                            <small>Crear turno</small>
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </>
        ) : null}
      </article>

      {selectedSlot ? (
        <Modal title="Crear turno" kicker="Slot disponible" onClose={closeSlotModal}>
          <div className="appointment-create-summary">
            <div>
              <span>Cliente</span>
              <strong>
                {clientMode === "new"
                  ? newClientFullName || "Nuevo cliente"
                  : selectedClient?.fullName ?? "Seleccionar cliente"}
              </strong>
            </div>
            <div>
              <span>Servicio</span>
              <strong>{selectedService?.name ?? "Sin servicio"}</strong>
            </div>
            <div>
              <span>Profesional</span>
              <strong>{selectedProfessional?.fullName ?? "Sin profesional"}</strong>
            </div>
            <div>
              <span>Dia y horario</span>
              <strong>{formatShortDateTime(selectedSlot.startDateTime)}</strong>
              <small>
                {formatTime(selectedSlot.startDateTime)} -{" "}
                {formatTime(selectedSlot.endDateTime)}
              </small>
            </div>
          </div>
          <form
            className="admin-form-grid appointment-create-form"
            onSubmit={createForm.handleSubmit(createFromSlot)}
          >
            <div className="appointment-client-mode form-span-2">
              <div className="segmented-control" role="group" aria-label="Tipo de cliente">
                <button
                  type="button"
                  className={clientMode === "existing" ? "active" : ""}
                  onClick={() => createForm.setValue("clientMode", "existing")}
                  disabled={activeClients.length === 0}
                >
                  Cliente existente
                </button>
                <button
                  type="button"
                  className={clientMode === "new" ? "active" : ""}
                  onClick={() => createForm.setValue("clientMode", "new")}
                >
                  Nuevo cliente
                </button>
              </div>
            </div>
            {clientMode === "existing" ? (
            <label className="form-span-2">
              Cliente
              <select
                {...createForm.register("clientId", {
                  valueAsNumber: true,
                  validate: (value) => {
                    if (clientMode !== "existing") {
                      return true;
                    }
                    return Number(value) > 0 || "Selecciona un cliente.";
                  },
                })}
              >
                <option value={0}>Seleccionar</option>
                {activeClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName}
                  </option>
                ))}
              </select>
              <FieldError message={createForm.formState.errors.clientId?.message} />
            </label>
            ) : (
              <>
                <label>
                  Nombre completo
                  <input
                    {...createForm.register("newClientFullName", {
                      required:
                        clientMode === "new" ? "Ingresa el nombre." : false,
                      maxLength: {
                        value: 120,
                        message: "Maximo 120 caracteres.",
                      },
                    })}
                  />
                  <FieldError
                    message={createForm.formState.errors.newClientFullName?.message}
                  />
                </label>
                <label>
                  Telefono
                  <input
                    {...createForm.register("newClientPhone", {
                      maxLength: {
                        value: 40,
                        message: "Maximo 40 caracteres.",
                      },
                    })}
                  />
                  <FieldError
                    message={createForm.formState.errors.newClientPhone?.message}
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    {...createForm.register("newClientEmail", {
                      required:
                        clientMode === "new" ? "Ingresa el email." : false,
                      maxLength: {
                        value: 160,
                        message: "Maximo 160 caracteres.",
                      },
                    })}
                  />
                  <FieldError
                    message={createForm.formState.errors.newClientEmail?.message}
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    autoComplete="new-password"
                    {...createForm.register("newClientPassword", {
                      required:
                        clientMode === "new" ? "Ingresa una password." : false,
                      validate: (value) => {
                        if (clientMode !== "new") {
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
                  <FieldError
                    message={createForm.formState.errors.newClientPassword?.message}
                  />
                </label>
              </>
            )}
            <label className="form-span-2">
              Notas
              <textarea
                rows={3}
                {...createForm.register("notes", {
                  maxLength: {
                    value: 500,
                    message: "Maximo 500 caracteres.",
                  },
                })}
              />
              <FieldError message={createForm.formState.errors.notes?.message} />
            </label>
            {formError ? <div className="admin-form-error">{formError}</div> : null}
            <div className="form-actions">
              <button className="admin-soft-button" type="button" onClick={closeSlotModal}>
                Cancelar
              </button>
              <button
                className="admin-primary-button"
                type="submit"
                disabled={
                  createMutation.isPending ||
                  createClientAndAppointmentMutation.isPending
                }
              >
                {createMutation.isPending ||
                createClientAndAppointmentMutation.isPending
                  ? "Creando..."
                  : "Crear turno"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

function AvailabilityCell({
  appointments,
  dayKey,
  onSelectSlot,
  slots,
  time,
}: {
  appointments: Appointment[];
  dayKey: string;
  onSelectSlot: (slot: AvailabilitySlot) => void;
  slots: AvailabilitySlot[];
  time: string;
}) {
  const appointment = appointments.find(
    (item) => toTimeKey(item.startDateTime) === time,
  );
  const slot = slots.find((item) => toTimeKey(item.startDateTime) === time);

  if (appointment) {
    return (
      <div className="availability-cell is-booked">
        <strong>{appointment.clientName}</strong>
        <span>{appointment.serviceName}</span>
      </div>
    );
  }

  if (slot) {
    return (
      <button
        className="availability-cell is-free"
        type="button"
        onClick={() => onSelectSlot(slot)}
        aria-label={`Crear turno ${dayKey} ${time}`}
      >
        <strong>Disponible</strong>
        <span>Crear turno</span>
      </button>
    );
  }

  return <div className="availability-cell is-empty" aria-label="Sin disponibilidad" />;
}

type DayItem =
  | { key: string; type: "slot"; slot: AvailabilitySlot }
  | { appointment: Appointment; key: string; type: "appointment" };

function getDayItems(slots: AvailabilitySlot[], appointments: Appointment[]) {
  const items: DayItem[] = [
    ...slots.map((slot) => ({
      key: `slot-${slot.startDateTime}`,
      slot,
      type: "slot" as const,
    })),
    ...appointments.map((appointment) => ({
      appointment,
      key: `appointment-${appointment.id}`,
      type: "appointment" as const,
    })),
  ];

  return items.sort((a, b) => {
    const aDate = a.type === "slot" ? a.slot.startDateTime : a.appointment.startDateTime;
    const bDate = b.type === "slot" ? b.slot.startDateTime : b.appointment.startDateTime;
    return new Date(aDate).getTime() - new Date(bDate).getTime();
  });
}

function getCalendarEmptyStateLabel({
  hasActiveServices,
  hasCategories,
  hasCategorySelection,
  hasCompatibleProfessionals,
  hasSelection,
  serviceName,
}: {
  hasActiveServices: boolean;
  hasCategories: boolean;
  hasCategorySelection: boolean;
  hasCompatibleProfessionals: boolean;
  hasSelection: boolean;
  professionalName?: string;
  serviceName?: string;
}) {
  if (!hasCategories) {
    return "No hay categorias activas. Crea o activa una categoria antes de revisar disponibilidad.";
  }

  if (!hasCategorySelection) {
    return "Selecciona una categoria para ver sus servicios disponibles.";
  }

  if (!hasActiveServices) {
    return "No hay servicios activos en esta categoria. Activa o carga un servicio antes de revisar disponibilidad.";
  }

  if (!hasCompatibleProfessionals) {
    return `No hay profesionales activos compatibles con ${serviceName ?? "este servicio"}. Revisa la asignacion profesional-servicio o activa un profesional.`;
  }

  if (!hasSelection) {
    return "Selecciona un servicio y un profesional compatible para revisar disponibilidad.";
  }

  return null;
}

function getCalendarEmptyStateAction({
  hasActiveServices,
  hasCategories,
  hasCompatibleProfessionals,
  selectedServiceId,
}: {
  hasActiveServices: boolean;
  hasCategories: boolean;
  hasCompatibleProfessionals: boolean;
  selectedServiceId: number;
}) {
  if (!hasCategories) {
    return (
      <Link className="admin-primary-button" to="/admin/services">
        Crear categoria
      </Link>
    );
  }

  if (!hasActiveServices) {
    return (
      <Link className="admin-primary-button" to="/admin/services">
        Crear servicio
      </Link>
    );
  }

  if (selectedServiceId > 0 && !hasCompatibleProfessionals) {
    return (
      <Link className="admin-primary-button" to="/admin/professionals">
        Revisar profesionales
      </Link>
    );
  }

  return null;
}

function Modal({
  children,
  kicker,
  onClose,
  title,
}: {
  children: ReactNode;
  kicker: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="admin-modal-backdrop" role="presentation">
      <section className="admin-modal" role="dialog" aria-modal="true">
        <div className="card-heading">
          <div>
            <p className="admin-kicker">{kicker}</p>
            <h3>{title}</h3>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function CalendarState({ label }: { label: string }) {
  return (
    <div className="dashboard-state">
      <CalendarClock aria-hidden="true" size={20} />
      <span>{label}</span>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="field-error">{message}</span> : null;
}
