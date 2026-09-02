"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, addMinutes, isBefore } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import { getDoctorSession, getSlotsForDoctor, markSlotBooked, freeSlot } from "@/lib/availability-store";
import { getAppointmentsForDoctor, rescheduleAppointment } from "@/lib/appointment-store";
import type { Appointment } from "@/types/appointment";
import type { AvailabilitySlot, DoctorProfile } from "@/types/availability";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar as any);

export type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  type: "appointment" | "available" | "unavailable";
  resourceId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
};

export interface CalendarFilters {
  appointments: boolean;
  available: boolean;
  unavailable: boolean;
  cancelled: boolean;
}

interface Props {
  date: Date;
  view: View;
  filters: CalendarFilters;
  onNavigate: (newDate: Date) => void;
  onView: (newView: View) => void;
  onSelectEmptySlot: (start: Date, end: Date) => void;
  onSelectAvailableSlot: (slot: AvailabilitySlot) => void;
}

export function DashboardCalendar({ date, view, filters, onNavigate, onView, onSelectEmptySlot, onSelectAvailableSlot }: Props) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  useEffect(() => {
    const session = getDoctorSession();
    if (!session) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDoctor(session);
  }, []);

  const loadData = useCallback(() => {
    const session = getDoctorSession();
    if (!session) return;
    
    const docSlots = getSlotsForDoctor(session.id);
    const docAppointments = getAppointmentsForDoctor(session.id);
    setSlots(docSlots);

    const newEvents: CalendarEvent[] = [];

    // Map unavailable slots
    docSlots.filter(s => s.isUnavailable).forEach(s => {
      newEvents.push({
        title: "Unavailable",
        start: new Date(`${s.date}T${s.startTime}:00`),
        end: new Date(`${s.date}T${s.endTime}:00`),
        type: "unavailable",
        resourceId: s.id,
        data: s
      });
    });

    // Map available slots
    docSlots.filter(s => !s.isBooked && !s.isUnavailable).forEach(s => {
      newEvents.push({
        title: "Available",
        start: new Date(`${s.date}T${s.startTime}:00`),
        end: new Date(`${s.date}T${s.endTime}:00`),
        type: "available",
        resourceId: s.id,
        data: s
      });
    });

    // Map appointments
    docAppointments.forEach(apt => {
      const start = new Date(apt.startsAt);
      const end = addMinutes(start, apt.durationMinutes || 30);
      newEvents.push({
        title: `${apt.patient.name} - ${apt.status}`,
        start,
        end,
        type: "appointment",
        resourceId: apt.id,
        data: apt,
      });
    });

    setAllEvents(newEvents);
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadData);
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_appointments" || e.key === "schedula_slots") loadData();
    };
    const handleCustomChange = () => loadData();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("schedula_appointments_updated", handleCustomChange);
    window.addEventListener("schedula_slots_updated", handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("schedula_appointments_updated", handleCustomChange);
      window.removeEventListener("schedula_slots_updated", handleCustomChange);
    };
  }, [loadData]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(ev => {
      if (ev.type === "unavailable" && !filters.unavailable) return false;
      if (ev.type === "available" && !filters.available) return false;
      if (ev.type === "appointment") {
        if (!filters.appointments) return false;
        const apt = ev.data as Appointment;
        if (apt.status === "cancelled" && !filters.cancelled) return false;
      }
      return true;
    });
  }, [allEvents, filters]);

  const eventPropGetter = (event: CalendarEvent) => {
    let backgroundColor = "#3174ad";
    let border = "none";
    let color = "white";

    if (event.type === "unavailable") {
      backgroundColor = "#f1f5f9"; // gray-100
      color = "#64748b"; // gray-500
      border = "1px solid #cbd5e1";
    } else if (event.type === "available") {
      backgroundColor = "#ecfdf5"; // emerald-50
      color = "#059669"; // emerald-600
      border = "1px solid #6ee7b7";
    } else if (event.type === "appointment") {
      const apt = event.data as Appointment;
      if (apt.status === "cancelled") {
        backgroundColor = "#fee2e2"; // red-100
        color = "#b91c1c"; // red-700
        border = "1px solid #fecaca";
      } else if (apt.status === "missed") {
        backgroundColor = "#ffedd5"; // orange-100
        color = "#c2410c"; // orange-700
        border = "1px solid #fed7aa";
      } else if (apt.status === "completed") {
        backgroundColor = "#f3f4f6"; // gray-100
        color = "#374151"; // gray-700
        border = "1px solid #e5e7eb";
      } else if (apt.status === "pending") {
        backgroundColor = "#fffbeb"; // amber-50
        color = "#b45309"; // amber-700
        border = "1px solid #fde68a";
      } else {
        backgroundColor = "var(--color-primary)";
        color = "white";
        border = "1px solid var(--color-primary-dark)";
      }
    }
    return { style: { backgroundColor, color, border, borderRadius: "4px", fontWeight: "600", fontSize: "0.75rem", padding: "2px 4px" } };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEventDrop = (args: any) => {
    const { event, start } = args;
    const evt = event as CalendarEvent;
    
    if (evt.type !== "appointment") return;

    const apt = evt.data as Appointment;
    if (["completed", "cancelled", "missed"].includes(apt.status)) {
      toast.error(`Cannot move a ${apt.status} appointment.`);
      return;
    }

    if (isBefore(start, new Date())) {
      toast.error("Cannot move appointment to the past.");
      return;
    }

    const dateStr = format(start, "yyyy-MM-dd");
    const timeStr = format(start, "HH:mm");
    
    const targetSlot = slots.find(s => s.date === dateStr && s.startTime === timeStr);
    
    if (!targetSlot) {
      toast.error("No availability found for this time.");
      return;
    }
    if (targetSlot.isUnavailable) {
      toast.error("This time period is marked as unavailable.");
      return;
    }
    if (targetSlot.isBooked) {
      toast.error("This slot is already booked.");
      return;
    }

    const currentDateStr = apt.startsAt.split("T")[0];
    const currentTimeStr = apt.startsAt.split("T")[1].substring(0, 5);
    const oldSlot = slots.find(s => s.date === currentDateStr && s.startTime === currentTimeStr && s.appointmentId === apt.id);

    try {
      if (oldSlot) freeSlot(oldSlot.id);
      markSlotBooked(targetSlot.id, apt.id);
      rescheduleAppointment(apt.id, dateStr, timeStr);
      toast.success("Appointment rescheduled successfully.");
      loadData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e.message || "Failed to reschedule.");
    }
  };

  if (!doctor) return null;

  return (
    <div className="h-full w-full bg-white relative">
      <style>{`
        .rbc-calendar { font-family: var(--font-inter), sans-serif; border: none; }
        .rbc-time-view { border: none; }
        .rbc-time-header { border-bottom: 1px solid var(--color-border); }
        .rbc-time-content { border-top: none; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid var(--color-border); }
        .rbc-timeslot-group { border-bottom: 1px solid var(--color-border); min-height: 48px; }
        .rbc-time-slot { border-top: 1px solid #f1f5f9; }
        .rbc-time-gutter .rbc-timeslot-group { border-bottom: none; border-right: 1px solid var(--color-border); }
        .rbc-header { padding: 12px 0; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; color: var(--color-text-secondary); border-bottom: none; border-left: 1px solid var(--color-border); }
        .rbc-header + .rbc-header { border-left: 1px solid var(--color-border); }
        .rbc-allday-cell { display: none; }
        .rbc-time-view .rbc-header { border-bottom: none; }
        .rbc-today { background-color: #f8fafc; }
        .rbc-event { transition: opacity 0.2s; border-radius: 4px; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
        .rbc-event:hover { opacity: 0.9; }
        .rbc-current-time-indicator { background-color: #ef4444; height: 2px; }
        .rbc-current-time-indicator::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background-color: #ef4444; position: absolute; left: -4px; top: -3px; }
      `}</style>
      <DnDCalendar
        localizer={localizer}
        events={filteredEvents}
        startAccessor={(e) => (e as CalendarEvent).start as Date}
        endAccessor={(e) => (e as CalendarEvent).end as Date}
        style={{ height: "100%", width: "100%" }}
        toolbar={false}
        date={date}
        view={view}
        onNavigate={onNavigate}
        onView={onView}
        views={["day", "week", "month"]}
        eventPropGetter={eventPropGetter as any /* eslint-disable-line @typescript-eslint/no-explicit-any */}
        onEventDrop={onEventDrop}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        draggableAccessor={(e: any) => {
          const ev = e as CalendarEvent;
          if (ev.type !== "appointment") return false;
          const apt = ev.data as Appointment;
          return ["pending", "confirmed", "upcoming"].includes(apt.status);
        }}
        resizable={false}
        selectable={true}
        step={30}
        timeslots={1}
        min={new Date(0, 0, 0, 8, 0, 0)}
        max={new Date(0, 0, 0, 20, 0, 0)}
        onSelectEvent={(e) => {
          const ev = e as CalendarEvent;
          if (ev.type === "appointment") {
            router.push(`/doctor/appointments/${ev.resourceId}`);
          } else if (ev.type === "available") {
            onSelectAvailableSlot(ev.data as AvailabilitySlot);
          }
        }}
        onSelectSlot={(slotInfo) => {
          if (slotInfo.action === "click" || slotInfo.action === "select") {
            // Only allow creating if in the future
            if (isBefore(slotInfo.start, new Date())) {
              toast.error("Cannot create availability in the past.");
              return;
            }
            onSelectEmptySlot(slotInfo.start, slotInfo.end);
          }
        }}
      />
    </div>
  );
}
