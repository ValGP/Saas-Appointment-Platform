import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Sparkles,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../../shared/api/httpClient";
import {
  addDays,
  formatTime,
  startOfWeek,
} from "../../../shared/utils/date";
import {
  createAppointment,
  createPublicAppointment,
  type AppointmentPayload,
} from "../../appointments/api/appointmentsApi";
import {
  getAvailability,
  getPublicAvailability,
  type AvailabilitySlot,
} from "../../availability/api/availabilityApi";
import {
  getProfessionals,
  getPublicProfessionals,
  type Professional,
} from "../../professionals/api/professionalsApi";
import {
  getServiceCategories,
  getPublicServiceCategories,
  type ServiceCategory,
} from "../../services/api/serviceCategoriesApi";
import {
  getServices,
  getPublicServices,
  type ServiceCatalogItem,
} from "../../services/api/servicesApi";

type DayModel = {
  date: Date;
  dateKey: string;
  label: string;
  shortLabel: string;
};

const currentWeekStart = startOfWeek(new Date());

function toDateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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
      shortLabel: new Intl.DateTimeFormat("es-AR", {
        weekday: "short",
        day: "2-digit",
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
  return `${formatter.format(weekStart)} al ${formatter.format(weekEnd)}`;
}

function formatSlotSummary(slot: AvailabilitySlot) {
  const day = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(new Date(slot.startDateTime));

  return `${day}, ${formatTime(slot.startDateTime)} a ${formatTime(slot.endDateTime)}`;
}

function getCreateErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "No pudimos solicitar el turno. Proba nuevamente en unos minutos.";
  }

  const message = error.message.toLowerCase();

  if (message.includes("overlap") || message.includes("availability")) {
    return "Ese horario dejo de estar disponible. Elegi otro turno y volve a intentarlo.";
  }

  if (message.includes("inactive")) {
    return "El servicio, profesional o cliente ya no esta disponible para nuevos turnos.";
  }

  return error.message || "No pudimos solicitar el turno. Proba nuevamente.";
}

export function ClientBookPage({ isPublic = false }: { isPublic?: boolean }) {
  const navigate = useNavigate();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(
    null,
  );
  const [weekOffset, setWeekOffset] = useState(0);
  const [firstAvailableWeekOffset, setFirstAvailableWeekOffset] = useState<number | null>(
    null,
  );
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["client-service-categories", isPublic],
    queryFn: () => isPublic ? getPublicServiceCategories() : getServiceCategories(),
  });

  const servicesQuery = useQuery({
    queryKey: ["client-services", selectedCategoryId, isPublic],
    enabled: selectedCategoryId !== null,
    queryFn: () =>
      isPublic
        ? getPublicServices({ categoryId: selectedCategoryId!, onlineBookableOnly: true })
        : getServices({ categoryId: selectedCategoryId!, onlineBookableOnly: true }),
  });

  const professionalsQuery = useQuery({
    queryKey: ["client-professionals", selectedServiceId, isPublic],
    enabled: selectedServiceId !== null,
    queryFn: () =>
      isPublic
        ? getPublicProfessionals({ serviceId: selectedServiceId!, hasAvailability: true })
        : getProfessionals({ serviceId: selectedServiceId!, hasAvailability: true }),
  });

  const activeServices = useMemo(
    () =>
      selectedCategoryId === null
        ? []
        : (servicesQuery.data ?? []).filter((service) => service.active),
    [selectedCategoryId, servicesQuery.data],
  );
  const activeCategories = useMemo(
    () => (categoriesQuery.data ?? []).filter((category) => category.active),
    [categoriesQuery.data],
  );
  const selectedCategory =
    activeCategories.find((category) => category.id === selectedCategoryId) ?? null;
  const selectedService =
    activeServices.find((service) => service.id === selectedServiceId) ?? null;

  const activeProfessionals = useMemo(
    () =>
      (professionalsQuery.data ?? []).filter((professional) => professional.active),
    [professionalsQuery.data],
  );
  const selectedProfessional =
    activeProfessionals.find(
      (professional) => professional.id === selectedProfessionalId,
    ) ?? null;

  const weekStart = useMemo(
    () => addDays(currentWeekStart, weekOffset * 7),
    [weekOffset],
  );
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  useEffect(() => {
    setSelectedServiceId(null);
    setSelectedProfessionalId(null);
    setSelectedSlot(null);
    setIsConfirmOpen(false);
    setFormError(null);
    setWeekOffset(0);
    setFirstAvailableWeekOffset(null);
  }, [selectedCategoryId]);

  useEffect(() => {
    setSelectedProfessionalId(null);
    setSelectedSlot(null);
    setIsConfirmOpen(false);
    setFormError(null);
    setWeekOffset(0);
    setFirstAvailableWeekOffset(null);
  }, [selectedServiceId]);

  useEffect(() => {
    if (activeProfessionals.length === 1 && selectedProfessionalId === null) {
      setSelectedProfessionalId(activeProfessionals[0].id);
    }
  }, [activeProfessionals, selectedProfessionalId]);

  useEffect(() => {
    setWeekOffset(0);
    setFirstAvailableWeekOffset(null);
  }, [selectedProfessionalId]);

  useEffect(() => {
    setSelectedSlot(null);
    setIsConfirmOpen(false);
    setFormError(null);
  }, [selectedProfessionalId, weekOffset]);

  const availabilityQueries = useQueries({
    queries: weekDays.map((day) => ({
      queryKey: [
        "client-availability",
        selectedProfessionalId,
        selectedServiceId,
        day.dateKey,
        isPublic,
      ],
      enabled: selectedProfessionalId !== null && selectedServiceId !== null,
      queryFn: () =>
        isPublic
          ? getPublicAvailability({
              professionalId: selectedProfessionalId!,
              serviceId: selectedServiceId!,
              date: day.dateKey,
            })
          : getAvailability({
              professionalId: selectedProfessionalId!,
              serviceId: selectedServiceId!,
              date: day.dateKey,
            }),
    })),
  });

  const availabilityByDay = weekDays.reduce<Record<string, AvailabilitySlot[]>>(
    (acc, day, index) => {
      acc[day.dateKey] = availabilityQueries[index]?.data ?? [];
      return acc;
    },
    {},
  );
  const hasAvailabilitySelection =
    selectedService !== null && selectedProfessional !== null;
  const isAvailabilityLoading = availabilityQueries.some((query) => query.isLoading);
  const isAvailabilityError = availabilityQueries.some((query) => query.isError);
  const availableSlotCount = Object.values(availabilityByDay).reduce(
    (count, slots) => count + slots.length,
    0,
  );

  useEffect(() => {
    if (
      selectedProfessionalId !== null &&
      selectedServiceId !== null &&
      !isAvailabilityLoading &&
      !isAvailabilityError
    ) {
      if (availableSlotCount > 0) {
        if (firstAvailableWeekOffset === null || weekOffset < firstAvailableWeekOffset) {
          setFirstAvailableWeekOffset(weekOffset);
        }
      } else if (availableSlotCount === 0 && weekOffset === (firstAvailableWeekOffset ?? weekOffset)) {
        if (weekOffset < 8) {
          setWeekOffset((offset) => offset + 1);
        }
      }
    }
  }, [
    selectedProfessionalId,
    selectedServiceId,
    weekOffset,
    isAvailabilityLoading,
    isAvailabilityError,
    availableSlotCount,
    firstAvailableWeekOffset,
  ]);

  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      isPublic
        ? createPublicAppointment(payload)
        : createAppointment(payload),
    onSuccess: async (appointment) => {
      setFormError(null);
      setNotes("");
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
      setSelectedSlot(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-availability"] }),
        queryClient.invalidateQueries({ queryKey: ["appointments"] }),
      ]);
      navigate(isPublic ? `/n/${businessSlug}/book/success` : `/n/${businessSlug}/app/book/success`, { state: { appointment } });
    },
    onError: (error) => {
      setFormError(getCreateErrorMessage(error));
    },
  });

  function handleCreateAppointment() {
    if (!selectedService || !selectedProfessional || !selectedSlot) {
      return;
    }

    setFormError(null);

    if (isPublic) {
      if (!guestName.trim() || !guestEmail.trim()) {
        setFormError("Por favor ingresa tu nombre y email.");
        return;
      }
      createMutation.mutate({
        professionalId: selectedProfessional.id,
        serviceId: selectedService.id,
        startDateTime: selectedSlot.startDateTime,
        clientName: guestName.trim(),
        clientEmail: guestEmail.trim(),
        clientPhone: guestPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      createMutation.mutate({
        professionalId: selectedProfessional.id,
        serviceId: selectedService.id,
        startDateTime: selectedSlot.startDateTime,
        notes: notes.trim() || undefined,
      });
    }
  }

  function handleSelectSlot(slot: AvailabilitySlot) {
    setSelectedSlot(slot);
    setIsConfirmOpen(true);
    setFormError(null);
  }

  function closeConfirmModal() {
    if (createMutation.isPending) {
      return;
    }

    setIsConfirmOpen(false);
    setFormError(null);
  }

  return (
    <section className="client-book-page">
      <div className="client-book-hero">
        <div>
          <p className="public-pill">Reservar turno</p>
          <h1>Elegi el servicio para empezar.</h1>
          <p>
            Selecciona tratamiento, profesional y horario. La solicitud queda
            pendiente hasta que BIBE confirme el turno.
          </p>
        </div>
        <div className="client-book-status">
          <Sparkles aria-hidden="true" size={22} />
          <span>Solicitud simple, confirmacion administrativa.</span>
        </div>
      </div>

      <div className="client-book-grid">
        <div className="client-book-card">
          <div className="client-section-heading">
            <span>Paso 1</span>
            <h2>Selecciona una categoria</h2>
          </div>

          {categoriesQuery.isLoading ? (
            <div className="client-empty-state">
              <strong>Cargando categorias...</strong>
              <p>Estamos ordenando los tratamientos disponibles.</p>
            </div>
          ) : null}

          {categoriesQuery.isError ? (
            <div className="client-empty-state tone-danger">
              <strong>No pudimos cargar las categorias.</strong>
              <p>Proba recargar la pagina o intenta nuevamente en unos minutos.</p>
            </div>
          ) : null}

          {!categoriesQuery.isLoading &&
          !categoriesQuery.isError &&
          activeCategories.length === 0 ? (
            <div className="client-empty-state">
              <strong>Todavia no hay categorias disponibles.</strong>
              <p>Cuando BIBE habilite categorias activas, van a aparecer aca.</p>
            </div>
          ) : null}

          {activeCategories.length > 0 ? (
            <div className="client-service-grid">
              {activeCategories.map((category) => (
                <CategoryOption
                  category={category}
                  key={category.id}
                  selected={category.id === selectedCategoryId}
                  onSelect={() => setSelectedCategoryId(category.id)}
                />
              ))}
            </div>
          ) : null}

          <div className="client-professional-section">
            <div className="client-section-heading">
              <span>Paso 2</span>
            <h2>Selecciona un servicio</h2>
          </div>

          {!selectedCategory ? (
            <div className="client-empty-state">
              <strong>Primero selecciona una categoria.</strong>
              <p>Despues vamos a mostrar solo sus servicios activos.</p>
            </div>
          ) : null}

          {selectedCategory && servicesQuery.isLoading ? (
            <div className="client-empty-state">
              <strong>Cargando servicios...</strong>
              <p>Estamos buscando los tratamientos disponibles para reserva.</p>
            </div>
          ) : null}

          {selectedCategory && servicesQuery.isError ? (
            <div className="client-empty-state tone-danger">
              <strong>No pudimos cargar los servicios.</strong>
              <p>Proba recargar la pagina o intenta nuevamente en unos minutos.</p>
            </div>
          ) : null}

          {selectedCategory &&
          !servicesQuery.isLoading &&
          !servicesQuery.isError &&
          activeServices.length === 0 ? (
            <div className="client-empty-state">
              <strong>
                No hay servicios disponibles para reserva online en esta categoria.
              </strong>
              <p>Consultanos para coordinar una alternativa.</p>
            </div>
          ) : null}

          {activeServices.length > 0 ? (
            <div className="client-service-grid">
              {activeServices.map((service) => (
                <ServiceOption
                  key={service.id}
                  service={service}
                  selected={service.id === selectedServiceId}
                  onSelect={() => setSelectedServiceId(service.id)}
                />
              ))}
            </div>
          ) : null}

          </div>

          <div className="client-professional-section">
            <div className="client-section-heading">
              <span>Paso 3</span>
              <h2>Elegi profesional</h2>
            </div>

            {!selectedService ? (
              <div className="client-empty-state">
                <strong>Primero selecciona un servicio.</strong>
                <p>
                  Despues vamos a mostrar solo los profesionales que realizan ese
                  tratamiento.
                </p>
              </div>
            ) : null}

            {selectedService && professionalsQuery.isLoading ? (
              <div className="client-empty-state">
                <strong>Cargando profesionales...</strong>
                <p>Estamos buscando profesionales compatibles con el servicio.</p>
              </div>
            ) : null}

            {selectedService && professionalsQuery.isError ? (
              <div className="client-empty-state tone-danger">
                <strong>No pudimos cargar profesionales.</strong>
                <p>Proba nuevamente en unos minutos.</p>
              </div>
            ) : null}

            {selectedService &&
            !professionalsQuery.isLoading &&
            !professionalsQuery.isError &&
            activeProfessionals.length === 0 ? (
              <div className="client-empty-state tone-danger">
                <strong>No hay profesionales disponibles para este servicio.</strong>
                <p>Elegi otro servicio o consultanos para coordinar una alternativa.</p>
              </div>
            ) : null}

            {activeProfessionals.length > 0 ? (
              <div className="client-professional-grid">
                {activeProfessionals.map((professional) => (
                  <ProfessionalOption
                    key={professional.id}
                    professional={professional}
                    selected={professional.id === selectedProfessionalId}
                    onSelect={() => setSelectedProfessionalId(professional.id)}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="client-availability-section">
            <div className="client-section-heading">
              <span>Paso 4</span>
              <h2>Elegi un horario</h2>
            </div>

            {!hasAvailabilitySelection ? (
              <div className="client-empty-state">
                <strong>Selecciona servicio y profesional para ver horarios.</strong>
                <p>
                  La disponibilidad se calcula con la agenda real, por eso aparece
                  despues de completar los pasos anteriores.
                </p>
              </div>
            ) : null}

            {hasAvailabilitySelection ? (
              <>
                <div className="client-week-toolbar">
                  <button
                    type="button"
                    onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
                    disabled={weekOffset <= (firstAvailableWeekOffset ?? 0)}
                    aria-label="Ver semana anterior"
                  >
                    <ChevronLeft aria-hidden="true" size={18} />
                  </button>
                  <div>
                    <span>Semana visible</span>
                    <strong>{formatWeekRange(weekStart)}</strong>
                    <small>
                      {weekOffset === 0
                        ? "Semana actual"
                        : weekOffset === 1
                          ? "Semana proxima"
                          : `En ${weekOffset} semanas`}
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWeekOffset((w) => Math.min(8, w + 1))}
                    disabled={weekOffset >= 8}
                    aria-label="Ver semana siguiente"
                  >
                    <ChevronRight aria-hidden="true" size={18} />
                  </button>
                </div>

                {isAvailabilityLoading ? (
                  <div className="client-empty-state">
                    <strong>Cargando horarios...</strong>
                    <p>Estamos revisando la semana seleccionada.</p>
                  </div>
                ) : null}

                {isAvailabilityError ? (
                  <div className="client-empty-state tone-danger">
                    <strong>No pudimos cargar la disponibilidad.</strong>
                    <p>Proba nuevamente o elegi otra combinacion.</p>
                  </div>
                ) : null}

                {!isAvailabilityLoading &&
                !isAvailabilityError &&
                availableSlotCount === 0 ? (
                  <div className="client-empty-state">
                    <strong>No hay horarios disponibles esta semana.</strong>
                    <p>
                      Proba buscando en las siguientes semanas usando la flecha.
                      Si tampoco hay horarios, consultanos para coordinar una alternativa.
                    </p>
                  </div>
                ) : null}

                {!isAvailabilityLoading && !isAvailabilityError ? (
                  <div className="client-week-grid" aria-label="Disponibilidad semanal">
                    {weekDays.map((day) => (
                      <DayAvailability
                        key={day.dateKey}
                        day={day}
                        selectedSlot={selectedSlot}
                        slots={availabilityByDay[day.dateKey] ?? []}
                        onSelectSlot={handleSelectSlot}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <aside className="client-next-panel">
          <p className="public-pill">Tu solicitud</p>
          <h2>Resumen inicial</h2>

          {selectedService ? (
            <div className="client-selected-service">
              <span>Categoria seleccionada</span>
              <strong>{selectedCategory?.name ?? "Sin categoria"}</strong>
            </div>
          ) : selectedCategory ? (
            <div className="client-selected-service">
              <span>Categoria seleccionada</span>
              <strong>{selectedCategory.name}</strong>
              <small>Ahora elegi un servicio de esta categoria.</small>
            </div>
          ) : null}

          {selectedService ? (
            <div className="client-selected-service">
              <span>Servicio seleccionado</span>
              <strong>{selectedService.name}</strong>
              <small>
                {selectedService.durationMinutes} min
                {selectedService.description ? ` - ${selectedService.description}` : ""}
              </small>
            </div>
          ) : (
            <div className="client-empty-summary">
              <CalendarDays aria-hidden="true" size={24} />
              <strong>Selecciona un servicio para continuar.</strong>
              <p>
                Este panel va a mostrar profesional, disponibilidad y horario a
                medida que avances.
              </p>
            </div>
          )}

          {selectedProfessional ? (
            <div className="client-selected-service">
              <span>Profesional seleccionado</span>
              <strong>{selectedProfessional.fullName}</strong>
              <small>{selectedProfessional.email}</small>
            </div>
          ) : null}

          {selectedSlot ? (
            <div className="client-selected-service">
              <span>Horario seleccionado</span>
              <strong>{formatSlotSummary(selectedSlot)}</strong>
              <small>El turno queda pendiente hasta que BIBE lo confirme.</small>
            </div>
          ) : null}

          <div className="client-flow-preview">
            <span className={selectedCategory ? "is-ready" : ""}>Categoria</span>
            <span className={selectedService ? "is-ready" : ""}>Servicio</span>
            <span className={selectedProfessional ? "is-ready" : ""}>Profesional</span>
            <span className={selectedSlot ? "is-ready" : ""}>Horario</span>
            <span>Confirmacion</span>
          </div>

          <button
            className="client-primary-action"
            type="button"
            disabled={!selectedService || !selectedProfessional || !selectedSlot}
            onClick={() => setIsConfirmOpen(true)}
          >
            Revisar solicitud
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </aside>
      </div>

      {selectedService && selectedProfessional && selectedSlot && isConfirmOpen ? (
        <div
          className="client-modal-backdrop"
          role="presentation"
          onClick={closeConfirmModal}
        >
          <section
            aria-modal="true"
            aria-labelledby="client-confirm-title"
            className="client-confirm-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label="Cerrar confirmacion"
              className="client-modal-close"
              type="button"
              onClick={closeConfirmModal}
            >
              <X aria-hidden="true" size={20} />
            </button>

            <span>Confirmacion</span>
            <h2 id="client-confirm-title">Revisa tu solicitud</h2>
            <p className="client-confirmation-hint">
              <Info aria-hidden="true" size={16} />
              BIBE debe confirmar la solicitud antes de que el turno quede cerrado.
            </p>

            <dl>
                <div>
                  <dt>Categoria</dt>
                  <dd>{selectedCategory?.name ?? "Sin categoria"}</dd>
                </div>
                <div>
                  <dt>Servicio</dt>
                <dd>{selectedService.name}</dd>
              </div>
              <div>
                <dt>Profesional</dt>
                <dd>{selectedProfessional.fullName}</dd>
              </div>
              <div>
                <dt>Dia y horario</dt>
                <dd>{formatSlotSummary(selectedSlot)}</dd>
              </div>
            </dl>

            {isPublic ? (
              <div className="guest-contact-fields" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px", textAlign: "left" }}>
                <label className="client-field">
                  <span style={{ fontWeight: 500, fontSize: "14px", display: "block", marginBottom: "4px" }}>Nombre completo *</span>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border-color, #ccc)", borderRadius: "6px", background: "var(--background-color, #fff)", color: "inherit" }}
                    placeholder="Tu nombre y apellido"
                  />
                </label>
                <label className="client-field">
                  <span style={{ fontWeight: 500, fontSize: "14px", display: "block", marginBottom: "4px" }}>Email *</span>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border-color, #ccc)", borderRadius: "6px", background: "var(--background-color, #fff)", color: "inherit" }}
                    placeholder="ejemplo@correo.com"
                  />
                </label>
                <label className="client-field">
                  <span style={{ fontWeight: 500, fontSize: "14px", display: "block", marginBottom: "4px" }}>Teléfono (opcional)</span>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border-color, #ccc)", borderRadius: "6px", background: "var(--background-color, #fff)", color: "inherit" }}
                    placeholder="Código de área + número"
                  />
                </label>
              </div>
            ) : null}

            <label className="client-notes-field">
              <span>Notas para BIBE (opcional)</span>
              <textarea
                maxLength={500}
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Contanos si queres agregar alguna aclaracion."
              />
              <small>{notes.length}/500 caracteres</small>
            </label>

            {formError ? <p className="client-form-error">{formError}</p> : null}

            <div className="client-modal-actions">
              <button
                className="client-secondary-action"
                disabled={createMutation.isPending}
                type="button"
                onClick={closeConfirmModal}
              >
                Elegir otro horario
              </button>
              <button
                className="client-primary-action"
                type="button"
                disabled={createMutation.isPending}
                onClick={handleCreateAppointment}
              >
                {createMutation.isPending ? "Solicitando..." : "Solicitar turno"}
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function ServiceOption({
  onSelect,
  selected,
  service,
}: {
  onSelect: () => void;
  selected: boolean;
  service: ServiceCatalogItem;
}) {
  return (
    <button
      className={`client-service-option ${selected ? "is-selected" : ""}`}
      type="button"
      onClick={onSelect}
    >
      <span>
        <Sparkles aria-hidden="true" size={20} />
      </span>
      <strong>{service.name}</strong>
      <p>{service.description || "Tratamiento disponible para solicitar turno."}</p>
      <small>
        <Clock aria-hidden="true" size={14} />
        {service.durationMinutes} minutos
      </small>
    </button>
  );
}

function CategoryOption({
  category,
  onSelect,
  selected,
}: {
  category: ServiceCategory;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <button
      className={`client-service-option ${selected ? "is-selected" : ""}`}
      type="button"
      onClick={onSelect}
    >
      <span>
        <Sparkles aria-hidden="true" size={20} />
      </span>
      <strong>{category.name}</strong>
      <p>{category.description || "Categoria de tratamientos disponibles."}</p>
    </button>
  );
}

function ProfessionalOption({
  onSelect,
  professional,
  selected,
}: {
  onSelect: () => void;
  professional: Professional;
  selected: boolean;
}) {
  return (
    <button
      className={`client-professional-option ${selected ? "is-selected" : ""}`}
      type="button"
      onClick={onSelect}
    >
      <span>
        <UserRoundCheck aria-hidden="true" size={18} />
      </span>
      <strong>{professional.fullName}</strong>
      <small>{professional.email}</small>
    </button>
  );
}

function DayAvailability({
  day,
  onSelectSlot,
  selectedSlot,
  slots,
}: {
  day: DayModel;
  onSelectSlot: (slot: AvailabilitySlot) => void;
  selectedSlot: AvailabilitySlot | null;
  slots: AvailabilitySlot[];
}) {
  return (
    <section className="client-day-card">
      <div className="client-day-heading">
        <span>{day.shortLabel}</span>
        <strong>{day.label}</strong>
      </div>

      {slots.length === 0 ? (
        <p className="client-day-empty">Sin horarios.</p>
      ) : (
        <div className="client-slot-list">
          {slots.map((slot) => {
            const selected = selectedSlot?.startDateTime === slot.startDateTime;

            return (
              <button
                className={`client-slot-button ${selected ? "is-selected" : ""}`}
                key={slot.startDateTime}
                type="button"
                onClick={() => onSelectSlot(slot)}
              >
                <strong>{formatTime(slot.startDateTime)}</strong>
                <span>{formatTime(slot.endDateTime)}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
