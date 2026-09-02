"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Event } from "react-big-calendar";
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

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar as any);

type CalendarEvent = Event & {
  type: "appointment" | "available" | "unavailable";
  resourceId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
};

export function DashboardCalendar() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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
      const start = new Date(`${s.date}T${s.startTime}:00`);
      const end = new Date(`${s.date}T${s.endTime}:00`);
      newEvents.push({
        title: "Unavailable",
        start,
        end,
        type: "unavailable",
        resourceId: s.id,
      });
    });

    // Map available slots
    docSlots.filter(s => !s.isBooked && !s.isUnavailable).forEach(s => {
      const start = new Date(`${s.date}T${s.startTime}:00`);
      const end = new Date(`${s.date}T${s.endTime}:00`);
      newEvents.push({
        title: "Available",
        start,
        end,
        type: "available",
        resourceId: s.id,
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

    setEvents(newEvents);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData();
    });
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

  const eventPropGetter = (event: CalendarEvent) => {
    let backgroundColor = "#3174ad"; // default
    let border = "none";
    let color = "white";

    if (event.type === "unavailable") {
      backgroundColor = "#f1f5f9";
      color = "#94a3b8";
      border = "1px dashed #cbd5e1";
    } else if (event.type === "available") {
      backgroundColor = "#ecfdf5";
      color = "#059669";
      border = "1px solid #a7f3d0";
    } else if (event.type === "appointment") {
      const apt = event.data as Appointment;
      if (apt.status === "cancelled") {
        backgroundColor = "#fee2e2";
        color = "#b91c1c";
        border = "1px solid #fecaca";
      } else if (apt.status === "missed") {
        backgroundColor = "#ffedd5";
        color = "#c2410c";
        border = "1px solid #fed7aa";
      } else if (apt.status === "completed") {
        backgroundColor = "#f3f4f6";
        color = "#4b5563";
        border = "1px solid #e5e7eb";
      } else {
        backgroundColor = "var(--brand)";
      }
    }
    return { style: { backgroundColor, color, border, borderRadius: "6px", fontWeight: "600", fontSize: "0.85em", padding: "2px 6px" } };
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
    <div className="h-[600px] w-full bg-white rounded-2xl border border-[var(--line)] shadow-sm p-4 overflow-hidden">
      <style>{`
        .rbc-calendar { font-family: var(--font-inter), sans-serif; }
        .rbc-toolbar button { border-radius: 8px; font-weight: 500; }
        .rbc-toolbar button.rbc-active { background-color: var(--brand); color: white; border-color: var(--brand); }
        .rbc-event { transition: opacity 0.2s; }
        .rbc-event:hover { opacity: 0.9; }
        .rbc-today { background-color: #f8fafc; }
        .rbc-time-view { border-radius: 12px; overflow: hidden; border-color: var(--line); }
      `}</style>
      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor={(e) => (e as CalendarEvent).start as Date}
        endAccessor={(e) => (e as CalendarEvent).end as Date}
        style={{ height: "100%" }}
        defaultView="week"
        views={["day", "week", "month"]}
        eventPropGetter={eventPropGetter as any /* eslint-disable-line @typescript-eslint/no-explicit-any */}
        onEventDrop={onEventDrop}
        resizable={false}
        step={30}
        timeslots={1}
        min={new Date(0, 0, 0, 8, 0, 0)}
        max={new Date(0, 0, 0, 20, 0, 0)}
        onSelectEvent={(e) => {
          const ev = e as CalendarEvent;
          if (ev.type === "appointment") {
            router.push(`/doctor/appointments/${ev.resourceId}`);
          }
        }}
      />
    </div>
  );
}
