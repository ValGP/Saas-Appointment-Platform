import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  MoreHorizontal,
  Search,
  Sparkles,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  getAvailableSlots,
  getPublicAvailableSlots,
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
  const fmtDay = new Intl.DateTimeFormat("es-AR", { day: "numeric" });
  const fmtDayMonth = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });
  return `${fmtDay.format(weekStart)} – ${fmtDayMonth.format(weekEnd)}`;
}

function getDayLabel(date: Date): string {
  const todayKey = toDateKey(new Date());
  const tomorrowKey = toDateKey(addDays(new Date(), 1));
  const key = toDateKey(date);
  if (key === todayKey) return "Hoy";
  if (key === tomorrowKey) return "Mañana";
  return new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "short" }).format(date);
}

function formatSlotSummary(slot: AvailabilitySlot) {
  const day = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(new Date(slot.startDateTime));

  return `${day}, ${formatTime(slot.startDateTime)}`;
}

function getCreateErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "No pudimos solicitar el turno. Probá nuevamente en unos minutos.";
  }

  const message = error.message.toLowerCase();

  if (message.includes("overlap") || message.includes("availability")) {
    return "Ese horario dejó de estar disponible. Elegí otro turno y volvé a intentarlo.";
  }

  if (message.includes("inactive")) {
    return "El servicio, profesional o cliente ya no está disponible para nuevos turnos.";
  }

  let friendlyMsg = error.message;
  friendlyMsg = friendlyMsg.replace(/email: email is required/gi, "El correo electrónico es obligatorio.");
  friendlyMsg = friendlyMsg.replace(/fullName: fullName is required/gi, "El nombre completo es obligatorio.");
  friendlyMsg = friendlyMsg.replace(/email: Invalid email format/gi, "El formato de correo electrónico es inválido.");

  return friendlyMsg || "No pudimos solicitar el turno. Probá nuevamente.";
}

export function ClientBookPage({ isPublic = false }: { isPublic?: boolean }) {
  const navigate = useNavigate();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | "any" | null>(
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
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const categoriesQuery = useQuery({
    queryKey: ["client-service-categories", isPublic],
    queryFn: () => isPublic ? getPublicServiceCategories() : getServiceCategories(),
  });

  const servicesQuery = useQuery({
    queryKey: ["client-services", isPublic],
    queryFn: () =>
      isPublic
        ? getPublicServices({ onlineBookableOnly: true })
        : getServices({ onlineBookableOnly: true }),
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
    () => (servicesQuery.data ?? []).filter((service) => service.active),
    [servicesQuery.data],
  );

  const activeCategories = useMemo(
    () => (categoriesQuery.data ?? []).filter((category) => category.active),
    [categoriesQuery.data],
  );

  const filteredCategories = useMemo(() => {
    return activeCategories.filter(
      (c) =>
        c.name.toLowerCase() !== "sin categoria" &&
        c.name.toLowerCase() !== "sin categoría" &&
        c.name.toLowerCase() !== "sin categorias" &&
        c.name.toLowerCase() !== "sin categorías"
    );
  }, [activeCategories]);

  const selectedCategory =
    filteredCategories.find((category) => category.id === selectedCategoryId) ?? null;

  const selectedService =
    activeServices.find((service) => service.id === selectedServiceId) ?? null;

  const filteredServices = useMemo(() => {
    let list = activeServices;

    if (selectedCategoryId !== null) {
      list = list.filter((service) => service.categoryId === selectedCategoryId);
    }

    if (searchTerm.trim() !== "") {
      const normalizedSearch = searchTerm.toLowerCase();
      list = list.filter((service) =>
        service.name.toLowerCase().includes(normalizedSearch)
      );
    }

    return list;
  }, [activeServices, selectedCategoryId, searchTerm]);

  const groupedServices = useMemo(() => {
    const groups: { categoryName: string; services: ServiceCatalogItem[] }[] = [];

    // "Sin categoría" goes first
    const categoryIds = filteredCategories.map((c) => c.id);
    const uncategorizedServices = filteredServices.filter(
      (s) => s.categoryId === null || !categoryIds.includes(s.categoryId)
    );
    if (uncategorizedServices.length > 0) {
      groups.push({
        categoryName: "Sin categoría",
        services: uncategorizedServices,
      });
    }

    filteredCategories.forEach((cat) => {
      const catServices = filteredServices.filter((s) => s.categoryId === cat.id);
      if (catServices.length > 0) {
        groups.push({
          categoryName: cat.name,
          services: catServices,
        });
      }
    });

    return groups;
  }, [filteredServices, filteredCategories]);

  const activeProfessionals = useMemo(
    () =>
      (professionalsQuery.data ?? []).filter((professional) => professional.active),
    [professionalsQuery.data],
  );
  const selectedProfessional = useMemo(() => {
    if (selectedProfessionalId === "any") {
      return {
        id: 0,
        fullName: "Cualquiera disponible",
        email: "Asignación automática",
        active: true,
      } as any;
    }
    return activeProfessionals.find(
      (professional) => professional.id === selectedProfessionalId,
    ) ?? null;
  }, [activeProfessionals, selectedProfessionalId]);

  const weekStart = useMemo(
    () => addDays(currentWeekStart, weekOffset * 7),
    [weekOffset],
  );
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  useEffect(() => {
    if (selectedServiceId === null) {
      setSelectedProfessionalId(null);
      return;
    }

    if (!professionalsQuery.isLoading && professionalsQuery.data) {
      const activeList = professionalsQuery.data.filter((p) => p.active);
      if (activeList.length === 1) {
        setSelectedProfessionalId(activeList[0].id);
      } else {
        setSelectedProfessionalId(null);
      }
    }
  }, [selectedServiceId, professionalsQuery.isLoading, professionalsQuery.data]);

  useEffect(() => {
    setWeekOffset(0);
    setFirstAvailableWeekOffset(null);
    setSelectedDateKey(null);
  }, [selectedProfessionalId]);

  useEffect(() => {
    setSelectedSlot(null);
    setIsConfirmOpen(false);
    setFormError(null);
  }, [selectedProfessionalId, selectedDateKey, weekOffset]);

  useEffect(() => {
    setSelectedDateKey(null);
  }, [weekOffset]);

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
      queryFn: () => {
        const profId = selectedProfessionalId === "any" ? undefined : (selectedProfessionalId as number);
        return isPublic
          ? getPublicAvailableSlots({
              serviceId: selectedServiceId!,
              date: day.dateKey,
              professionalId: profId,
            })
          : getAvailableSlots({
              serviceId: selectedServiceId!,
              date: day.dateKey,
              professionalId: profId,
            });
      },
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

  useEffect(() => {
    if (selectedDateKey === null && availableSlotCount > 0) {
      const dayWithSlots = weekDays.find((day) => (availabilityByDay[day.dateKey] ?? []).length > 0);
      if (dayWithSlots) {
        setSelectedDateKey(dayWithSlots.dateKey);
      }
    }
  }, [availableSlotCount, weekDays, availabilityByDay, selectedDateKey]);

  const handleOpenCalendar = () => {
    // Seed calendar to selected date month, or today
    const seed = selectedDateKey ? new Date(selectedDateKey + "T00:00:00") : new Date();
    setCalendarMonth(new Date(seed.getFullYear(), seed.getMonth(), 1));
    setIsCalendarOpen(true);
  };

  const handleCalendarSelect = (dateKey: string) => {
    const selectedDate = new Date(dateKey + "T00:00:00");
    const diffTime = selectedDate.getTime() - currentWeekStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const newOffset = Math.floor(diffDays / 7);
    if (newOffset >= 0 && newOffset <= 8) {
      setWeekOffset(newOffset);
    }
    setSelectedDateKey(dateKey);
    setIsCalendarOpen(false);
  };

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

    const payloadProfessionalId = selectedProfessional.id === 0 ? undefined : selectedProfessional.id;

    if (isPublic) {
      if (!guestName.trim() || !guestEmail.trim()) {
        setFormError("Por favor ingresa tu nombre y email.");
        return;
      }
      createMutation.mutate({
        professionalId: payloadProfessionalId,
        serviceId: selectedService.id,
        startDateTime: selectedSlot.startDateTime,
        fullName: guestName.trim(),
        email: guestEmail.trim(),
        phone: guestPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      createMutation.mutate({
        professionalId: payloadProfessionalId,
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
      <div className="client-book-grid">
        <div className="client-book-card">
          {/* Top progress indicator (visible on mobile only) */}
          <div className="client-mobile-progress">
            <div className={`progress-step ${selectedService ? "is-done" : "is-active"}`}>
              <span className="step-badge">{selectedService ? "✓" : "1"}</span>
              <span className="step-text">Servicio</span>
            </div>
            <div className="progress-divider" />
            <div className={`progress-step ${!selectedService ? "is-locked" : selectedProfessional ? "is-done" : "is-active"}`}>
              <span className="step-badge">{selectedProfessional ? "✓" : "2"}</span>
              <span className="step-text">Profesional</span>
            </div>
            <div className="progress-divider" />
            <div className={`progress-step ${!selectedProfessional ? "is-locked" : selectedSlot ? "is-done" : "is-active"}`}>
              <span className="step-badge">{selectedSlot ? "✓" : "3"}</span>
              <span className="step-text">Horario</span>
            </div>
          </div>

          <div className="client-section-heading">
            <span>Paso 1</span>
            <h2>Selecciona un servicio</h2>
          </div>

          <div className="client-service-filters" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "14px" }}>
            {/* Buscador */}
            <div className="client-search-wrapper">
              <input
                type="text"
                className="client-search-input"
                placeholder="Buscar servicio por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    padding: "4px"
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Categorías (Todas + seleccionada + botón de puntos) */}
            {filteredCategories.length > 0 && (
              <div className="client-category-bar">
                <button
                  type="button"
                  className={`client-pill-button ${selectedCategoryId === null ? "is-active" : ""}`}
                  onClick={() => setSelectedCategoryId(null)}
                >
                  Todas
                </button>

                {selectedCategoryId !== null && selectedCategory && (
                  <button
                    type="button"
                    className="client-pill-button is-active"
                    onClick={() => setSelectedCategoryId(null)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {selectedCategory.name}
                    <X size={13} />
                  </button>
                )}

                <div className="client-category-dropdown-wrapper" ref={dropdownRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className={`client-dots-button ${selectedCategoryId !== null ? "has-selection" : ""}`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    title="Ver categorías"
                    aria-label="Ver categorías"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {isDropdownOpen && (
                    <div className="client-category-dropdown-panel">
                      {filteredCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          className={`dropdown-item ${selectedCategoryId === category.id ? "is-selected" : ""}`}
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            setIsDropdownOpen(false);
                          }}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {servicesQuery.isLoading ? (
            <div className="client-empty-state">
              <strong>Cargando servicios...</strong>
              <p>Estamos buscando los tratamientos disponibles para reserva.</p>
            </div>
          ) : null}

          {servicesQuery.isError ? (
            <div className="client-empty-state tone-danger">
              <strong>No pudimos cargar los servicios.</strong>
              <p>Proba recargar la pagina o intenta nuevamente en unos minutos.</p>
            </div>
          ) : null}

          {!servicesQuery.isLoading && !servicesQuery.isError && activeServices.length === 0 ? (
            <div className="client-empty-state">
              <strong>Todavia no hay servicios disponibles.</strong>
              <p>Cuando habiliten servicios activos, van a aparecer aca.</p>
            </div>
          ) : null}

          {!servicesQuery.isLoading && !servicesQuery.isError && activeServices.length > 0 ? (
            groupedServices.length === 0 ? (
              <div className="client-empty-state">
                <strong>No se encontraron servicios.</strong>
                <p>Probá buscando con otro nombre o seleccionando otra categoría.</p>
              </div>
            ) : (
              <div className="client-grouped-services" style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "8px" }}>
                {groupedServices.map((group) => (
                  <div key={group.categoryName} className="client-service-group">
                    {group.categoryName !== "Sin categoría" && (
                      <h3 className="client-group-title" style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "var(--text)",
                        borderLeft: "3px solid var(--primary)",
                        paddingLeft: "10px",
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {group.categoryName}
                      </h3>
                    )}
                    <div className="client-service-grid">
                      {group.services.map((service) => (
                        <ServiceOption
                          key={service.id}
                          service={service}
                          selected={service.id === selectedServiceId}
                          onSelect={() => setSelectedServiceId(service.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}

          <div className="client-professional-section">
            <div className="client-section-heading">
              <span>Paso 2</span>
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
                {activeProfessionals.length > 1 && (
                  <button
                    className={`client-professional-option ${selectedProfessionalId === "any" ? "is-selected" : ""}`}
                    type="button"
                    onClick={() => setSelectedProfessionalId("any")}
                  >
                    <span>
                      <Sparkles aria-hidden="true" size={18} />
                    </span>
                    <strong>Cualquiera disponible</strong>
                    <small>Se asignará el profesional disponible</small>
                  </button>
                )}
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
              <span>Paso 3</span>
              <h2>Elegi una fecha</h2>
            </div>

            {!hasAvailabilitySelection ? (
              <div className="client-empty-state">
                <strong>Selecciona servicio y profesional para ver fechas.</strong>
                <p>
                  La disponibilidad se calcula con la agenda real, por eso aparece
                  despues de completar los pasos anteriores.
                </p>
              </div>
            ) : null}

            {hasAvailabilitySelection ? (
              <>
                {/* Desktop week navigation */}
                <div className="client-week-nav">
                  <button
                    type="button"
                    className="client-week-nav-btn"
                    onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
                    disabled={weekOffset <= (firstAvailableWeekOffset ?? 0)}
                    aria-label="Ver semana anterior"
                  >
                    <ChevronLeft aria-hidden="true" size={16} />
                  </button>
                  <span className="client-week-nav-label">
                    {formatWeekRange(weekStart)}
                  </span>
                  <button
                    type="button"
                    className="client-week-nav-btn"
                    onClick={() => setWeekOffset((w) => Math.min(8, w + 1))}
                    disabled={weekOffset >= 8}
                    aria-label="Ver semana siguiente"
                  >
                    <ChevronRight aria-hidden="true" size={16} />
                  </button>
                </div>

                {/* Desktop: 7 day cards — days without slots are disabled */}
                <div className="client-week-card-grid">
                  {weekDays.map((day) => {
                    const todayDate = new Date(toDateKey(new Date()) + "T00:00:00");
                    const isPast = day.date < todayDate;
                    const slots = availabilityByDay[day.dateKey] ?? [];
                    const hasSlots = slots.length > 0;
                    const isDisabled = isPast || (!isAvailabilityLoading && !hasSlots);
                    const isSelected = selectedDateKey === day.dateKey;
                    return (
                      <button
                        key={day.dateKey}
                        type="button"
                        className={`client-day-card-btn${isSelected ? " is-selected" : ""}${isDisabled ? " is-disabled" : ""}`}
                        disabled={isDisabled}
                        onClick={() => setSelectedDateKey(day.dateKey)}
                      >
                        <span className="day-name">
                          {new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(day.date).replace(".", "")}
                        </span>
                        <strong className="day-num">{day.date.getDate()}</strong>
                      </button>
                    );
                  })}
                </div>

                {/* Mobile: only next 3 days WITH available slots */}
                {(() => {
                  const todayDate = new Date(toDateKey(new Date()) + "T00:00:00");
                  const mobileDays = weekDays
                    .filter((day) => {
                      if (day.date < todayDate) return false;
                      const slots = availabilityByDay[day.dateKey] ?? [];
                      return !isAvailabilityLoading && slots.length > 0;
                    })
                    .slice(0, 3);

                  if (isAvailabilityLoading) {
                    return (
                      <div className="client-day-list">
                        <div className="client-day-list-row" style={{ justifyContent: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
                          Buscando disponibilidad...
                        </div>
                      </div>
                    );
                  }

                  if (mobileDays.length === 0) return null;

                  return (
                    <div className="client-day-list">
                      {mobileDays.map((day) => {
                        const isSelected = selectedDateKey === day.dateKey;
                        return (
                          <button
                            key={day.dateKey}
                            type="button"
                            className={`client-day-list-row${isSelected ? " is-selected" : ""}`}
                            onClick={() => setSelectedDateKey(day.dateKey)}
                          >
                            <span className="row-label">{getDayLabel(day.date)}</span>
                            <ChevronRight aria-hidden="true" size={16} className="row-chevron" />
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Loading / Error / Empty states (desktop only — mobile handles its own) */}
                {isAvailabilityLoading ? (
                  <div className="client-empty-state" style={{ display: "none" }} aria-hidden="true" />
                ) : null}

                {isAvailabilityError ? (
                  <div className="client-empty-state tone-danger">
                    <strong>No pudimos cargar la disponibilidad.</strong>
                    <p>Probá nuevamente o elegí otra combinación.</p>
                  </div>
                ) : null}

                {!isAvailabilityLoading && !isAvailabilityError && availableSlotCount === 0 ? (
                  <div className="client-empty-state">
                    <strong>No hay horarios disponibles esta semana.</strong>
                    <p>Usá las flechas para ver otras semanas.</p>
                  </div>
                ) : null}


                {/* "Elegir otra fecha" trigger */}
                <button
                  type="button"
                  className="client-cal-trigger"
                  onClick={handleOpenCalendar}
                >
                  <CalendarDays size={14} />
                  <span>Elegir otra fecha</span>
                </button>

                {/* Slots section */}
                {selectedDateKey && !isAvailabilityLoading && !isAvailabilityError && (() => {
                  const slots = availabilityByDay[selectedDateKey] ?? [];
                  const selectedDay = weekDays.find((d) => d.dateKey === selectedDateKey);
                  const dayLabel = selectedDay
                    ? new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(selectedDay.date)
                    : selectedDateKey;

                  return (
                    <div>
                      <div className="client-slots-header">
                        <h3>Horarios para</h3>
                        <span style={{ textTransform: "capitalize" }}>{dayLabel}</span>
                      </div>
                      {slots.length === 0 ? (
                        <div className="client-empty-state">
                          <strong>Sin horarios disponibles para este día.</strong>
                          <p>Seleccioná otro día o usá las flechas para ver más fechas.</p>
                        </div>
                      ) : (
                        <div className="client-slot-grid">
                          {slots.map((slot) => {
                            const isSelected = selectedSlot?.startDateTime === slot.startDateTime;
                            return (
                              <button
                                key={slot.startDateTime}
                                type="button"
                                className={`client-slot-btn${isSelected ? " is-selected" : ""}`}
                                onClick={() => handleSelectSlot(slot)}
                              >
                                {formatTime(slot.startDateTime)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            ) : null}

          </div>
        </div>


        <aside className="client-next-panel">
          {/* Progress checklist */}
          <div className="cpanel-checklist">
            <div className={`cpanel-step ${selectedService ? "is-done" : "is-active"}`}>
              <span className="cpanel-step-indicator">
                {selectedService ? "✓" : "1"}
              </span>
              <div className="cpanel-step-body">
                <strong>Servicio</strong>
                {selectedService ? (
                  <span>{selectedService.name}</span>
                ) : (
                  <span className="cpanel-step-hint">Elegí un servicio para continuar</span>
                )}
              </div>
            </div>

            <div className={`cpanel-step ${!selectedService ? "is-locked" : selectedProfessional ? "is-done" : "is-active"}`}>
              <span className="cpanel-step-indicator">
                {selectedProfessional ? "✓" : "2"}
              </span>
              <div className="cpanel-step-body">
                <strong>Profesional</strong>
                {selectedProfessional ? (
                  <span>{selectedProfessional.fullName}</span>
                ) : (
                  <span className="cpanel-step-hint">
                    {selectedService ? "Elegí un profesional" : "Primero elegí un servicio"}
                  </span>
                )}
              </div>
            </div>

            <div className={`cpanel-step ${!selectedProfessional ? "is-locked" : selectedSlot ? "is-done" : "is-active"}`}>
              <span className="cpanel-step-indicator">
                {selectedSlot ? "✓" : "3"}
              </span>
              <div className="cpanel-step-body">
                <strong>Fecha y horario</strong>
                {selectedSlot ? (
                  <span>{formatSlotSummary(selectedSlot)}</span>
                ) : (
                  <span className="cpanel-step-hint">
                    {selectedProfessional ? "Elegí una fecha y horario" : "Primero elegí un profesional"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summary card — only visible once there's something to show */}
          {(selectedProfessional || selectedSlot) && (
            <div className="cpanel-summary">
              {selectedProfessional && (
                <div className="cpanel-summary-row">
                  <span>Profesional</span>
                  <strong>{selectedProfessional.fullName}</strong>
                </div>
              )}
              {selectedSlot && (
                <div className="cpanel-summary-row">
                  <span>Turno</span>
                  <strong style={{ textTransform: "capitalize" }}>
                    {new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" })
                      .format(new Date(selectedSlot.startDateTime))}
                    {" · "}
                    {formatTime(selectedSlot.startDateTime)}
                  </strong>
                </div>
              )}
            </div>
          )}

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

            <dl>
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
              <span>Notas adicionales (opcional)</span>
              <textarea
                maxLength={500}
                rows={1}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Contanos si queres agregar alguna aclaracion."
                style={{ resize: "none" }}
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

      {/* Calendar modal — shared between desktop and mobile */}
      {isCalendarOpen ? (
        <CalendarModal
          month={calendarMonth}
          selectedDateKey={selectedDateKey}
          todayKey={toDateKey(new Date())}
          maxDateKey={toDateKey(addDays(new Date(), 56))}
          onNavigateMonth={(delta) =>
            setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
          }
          onSelect={handleCalendarSelect}
          onClose={() => setIsCalendarOpen(false)}
        />
      ) : null}

      {/* Sticky bottom bar with accordion summary (visible on mobile only) */}
      {selectedService && (
        <div className={`client-mobile-bar ${isMobileSummaryOpen ? "is-open" : ""}`}>
          <div
            className="mobile-bar-header"
            onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
          >
            <div className="mobile-bar-info">
              <strong>Tu solicitud</strong>
              <span>
                {selectedSlot
                  ? "Listo para reservar"
                  : selectedProfessional
                  ? "Elegí fecha y horario"
                  : "Elegí profesional"}
              </span>
            </div>
            <button type="button" className="mobile-bar-toggle" aria-label="Expandir resumen">
              <ChevronRight size={18} className="toggle-chevron" />
            </button>
          </div>

          <div className="mobile-bar-content">
            <div className="cpanel-summary" style={{ background: "transparent", border: "none" }}>
              <div className="cpanel-summary-row" style={{ padding: "8px 0" }}>
                <span>Servicio</span>
                <strong>{selectedService.name}</strong>
              </div>
              {selectedProfessional && (
                <div className="cpanel-summary-row" style={{ padding: "8px 0" }}>
                  <span>Profesional</span>
                  <strong>{selectedProfessional.fullName}</strong>
                </div>
              )}
              {selectedSlot && (
                <div className="cpanel-summary-row" style={{ padding: "8px 0" }}>
                  <span>Turno</span>
                  <strong style={{ textTransform: "capitalize" }}>
                    {new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" })
                      .format(new Date(selectedSlot.startDateTime))}
                    {" · "}
                    {formatTime(selectedSlot.startDateTime)}
                  </strong>
                </div>
              )}
            </div>
          </div>

          <div className="mobile-bar-action">
            <button
              className="client-primary-action"
              style={{ width: "100%" }}
              type="button"
              disabled={!selectedService || !selectedProfessional || !selectedSlot}
              onClick={() => setIsConfirmOpen(true)}
            >
              Revisar solicitud
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          </div>
        </div>
      )}
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
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "stretch",
        minHeight: "85px",
        padding: "10px 12px",
        textAlign: "left",
        border: "1px solid rgba(143, 73, 99, 0.14)",
        borderRadius: "12px",
        background: "var(--surface)",
        color: "var(--text)",
        cursor: "pointer",
        transition: "all 0.2s ease"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexGrow: 1 }}>
        <strong style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-strong)" }}>
          {service.name}
        </strong>
        {service.description ? (
          <p style={{
            margin: 0,
            fontSize: "12.5px",
            color: "var(--muted)",
            lineHeight: "1.35",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {service.description}
          </p>
        ) : null}
      </div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginTop: "6px",
        fontSize: "11.5px",
        fontWeight: 650,
        color: "var(--primary-strong)"
      }}>
        <Clock aria-hidden="true" size={13} />
        <span>{service.durationMinutes} minutos</span>
      </div>
    </button>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
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
  const initials = getInitials(professional.fullName);
  return (
    <button
      className={`client-professional-option ${selected ? "is-selected" : ""}`}
      type="button"
      onClick={onSelect}
    >
      <span>
        {initials}
      </span>
      <strong>{professional.fullName}</strong>
      <small>{professional.email}</small>
    </button>
  );
}

type CalendarModalProps = {
  month: Date;
  selectedDateKey: string | null;
  todayKey: string;
  maxDateKey: string;
  onNavigateMonth: (delta: number) => void;
  onSelect: (dateKey: string) => void;
  onClose: () => void;
};

function CalendarModal({ month, selectedDateKey, todayKey, maxDateKey, onNavigateMonth, onSelect, onClose }: CalendarModalProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const monthLabel = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(month);

  // Number of days in this month
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // Day of week for the 1st (0=Sun, 1=Mon... adjust to Mon-first)
  const firstDow = new Date(year, monthIndex, 1).getDay();
  const fillersBefore = (firstDow + 6) % 7; // shift so Mon=0

  const weekdayNames = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

  // Disable "next month" if the first day of next month is already beyond maxDateKey
  const nextMonthFirstKey = (() => {
    const pad = (v: number) => String(v).padStart(2, "0");
    const nm = new Date(year, monthIndex + 1, 1);
    return `${nm.getFullYear()}-${pad(nm.getMonth() + 1)}-01`;
  })();
  const isNextMonthDisabled = nextMonthFirstKey > maxDateKey;

  // Disable "prev month" if it would go before today's month
  const prevMonthLastKey = (() => {
    const pad = (v: number) => String(v).padStart(2, "0");
    const pm = new Date(year, monthIndex, 0); // last day of prev month
    return `${pm.getFullYear()}-${pad(pm.getMonth() + 1)}-${pad(pm.getDate())}`;
  })();
  const isPrevMonthDisabled = prevMonthLastKey < todayKey;

  function buildKey(day: number) {
    const pad = (v: number) => String(v).padStart(2, "0");
    return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
  }

  return (
    <div
      className="client-cal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="client-cal-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Seleccioná una fecha"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="client-cal-header">
          <div className="client-cal-nav">
            <button
              type="button"
              className="client-cal-nav-btn"
              aria-label="Mes anterior"
              disabled={isPrevMonthDisabled}
              onClick={() => onNavigateMonth(-1)}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="client-cal-nav-btn"
              aria-label="Mes siguiente"
              disabled={isNextMonthDisabled}
              onClick={() => onNavigateMonth(1)}
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <h3>{monthLabel}</h3>
          <button
            type="button"
            className="client-cal-close"
            aria-label="Cerrar calendario"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="client-cal-grid-wrap">
          {/* Weekday headers */}
          <div className="client-cal-weekdays">
            {weekdayNames.map((wd) => (
              <span key={wd} className="client-cal-weekday">{wd}</span>
            ))}
          </div>

          {/* Day cells */}
          <div className="client-cal-days">
            {Array.from({ length: fillersBefore }, (_, i) => (
              <span key={`f${i}`} className="client-cal-day is-filler" aria-hidden="true" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const key = buildKey(day);
              const isPast = key < todayKey;
              const isBeyondMax = key > maxDateKey;
              const isToday = key === todayKey;
              const isSelected = key === selectedDateKey;
              return (
                <button
                  key={key}
                  type="button"
                  className={[
                    "client-cal-day",
                    isToday ? "is-today" : "",
                    isSelected ? "is-selected" : "",
                  ].join(" ").trim()}
                  disabled={isPast || isBeyondMax}
                  onClick={() => onSelect(key)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
