import { getAppointmentsForDoctor, getAppointmentsForPatient, rescheduleAppointment } from "./appointment-store";
import { getAvailableSlotsForDoctor, getRegisteredDoctors, getDoctorById } from "./availability-store";
import { getPrescriptionsForPatient, getPrescriptionsForDoctor } from "./prescription-store";
import { getUserProfile } from "./user-profile-store";
import { format, isSameDay, isTomorrow, isAfter, isBefore, addDays, parseISO, startOfDay } from "date-fns";

export type AssistantAction =
  | { type: "LINK"; label: string; href: string }
  | { type: "BOOK_SLOT"; label: string; doctorId: string; date: string; startTime: string; endTime: string }
  | { type: "RESCHEDULE_PROMPT"; label: string; appointmentId: string; doctorId: string; newDate: string; newStartTime: string }
  | { type: "CANCEL"; label: string };

export type AssistantResponse = {
  text: string;
  actions?: AssistantAction[];
};

export async function processAssistantQuery(
  query: string,
  role: "patient" | "doctor",
  userNameOrId: string // For patient it's their name (from mock_user), for doctor it's their doctorId
): Promise<AssistantResponse> {
  const q = query.toLowerCase().trim();

  // Artificial delay to simulate AI thinking
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

  if (role === "patient") {
    return handlePatientQuery(q, userNameOrId);
  } else {
    return handleDoctorQuery(q, userNameOrId);
  }
}

function handlePatientQuery(q: string, patientName: string): AssistantResponse {
  // 1. "When is my next appointment?"
  if (q.includes("next appointment") || (q.includes("appointment") && q.includes("tomorrow"))) {
    const apts = getAppointmentsForPatient(patientName)
      .filter(a => a.status === "confirmed" || a.status === "pending")
      .filter(a => isAfter(new Date(a.startsAt), new Date()))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    if (apts.length === 0) {
      return { text: "You don't have any upcoming appointments." };
    }
    const next = apts[0];
    const doc = getDoctorById(next.doctorId);
    return {
      text: `Your next appointment is with Dr. ${doc?.name || "Unknown"} on ${format(new Date(next.startsAt), "MMMM do, yyyy 'at' h:mm a")}.`,
      actions: [{ type: "LINK", label: "View Appointment", href: `/appointments` }]
    };
  }

  // 2. "Find available doctors." / "Find a doctor"
  if (q.includes("find") && q.includes("doctor")) {
    const docs = getRegisteredDoctors();
    return {
      text: `We have several great doctors available, including ${docs.slice(0, 3).map(d => d.name).join(", ")}.`,
      actions: [{ type: "LINK", label: "View Doctors", href: "/doctors" }]
    };
  }

  // 3. "When is Dr. Anika Rao free?" / "Show me her available slots."
  if (q.includes("anika") || q.includes("rao") || q.includes("her available") || q.includes("free")) {
    const docs = getRegisteredDoctors();
    const doc = docs.find(d => d.name.toLowerCase().includes("anika") || d.name.toLowerCase().includes("rao")) || docs[0];
    const slots = getAvailableSlotsForDoctor(doc.id).filter(s => isAfter(new Date(`${s.date}T${s.startTime}:00`), new Date()));
    
    if (slots.length === 0) {
      return { text: `Dr. ${doc.name} currently has no available slots.` };
    }

    const first = slots[0];
    return {
      text: `Dr. ${doc.name}'s next available slot is on ${format(new Date(`${first.date}T${first.startTime}:00`), "MMMM do 'at' h:mm a")}.`,
      actions: [
        { type: "BOOK_SLOT", label: `Book ${format(new Date(`${first.date}T${first.startTime}:00`), "h:mm a")}`, doctorId: doc.id, date: first.date, startTime: first.startTime, endTime: first.endTime },
        { type: "LINK", label: "View Doctor", href: `/booking/${doc.id}` }
      ]
    };
  }

  // 7. "Show my completed appointments."
  if (q.includes("completed") && q.includes("appointment")) {
    const apts = getAppointmentsForPatient(patientName).filter(a => a.status === "completed");
    if (apts.length === 0) return { text: "You have no completed appointments yet." };
    return {
      text: `You have ${apts.length} completed appointments.`,
      actions: [{ type: "LINK", label: "View History", href: "/appointments" }]
    };
  }

  // 8. "What prescription did my doctor give me?" / "Show my prescriptions"
  if (q.includes("prescription") || q.includes("medicine") || q.includes("diagnosis")) {
    const rx = getPrescriptionsForPatient(patientName);
    if (rx.length === 0) return { text: "You don't have any prescriptions on file." };
    const latest = rx.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return {
      text: `Your latest prescription was for diagnosis: "${latest.diagnosis}". Medications include: ${latest.medicines.map(m => m.name).join(", ")}.`,
      actions: [{ type: "LINK", label: "View Prescriptions", href: "/profile" }]
    };
  }

  // 9. "How can I rebook?" / "How do I book an appointment?"
  if (q.includes("rebook") || q.includes("how") || q.includes("book")) {
    return {
      text: "You can book an appointment by finding a doctor in our directory and clicking on an available time slot.",
      actions: [{ type: "LINK", label: "Find a Doctor", href: "/doctors" }]
    };
  }

  // Profile check
  if (q.includes("profile") || q.includes("emergency")) {
    return {
      text: "You can manage your profile, medical history, and emergency contacts in your profile settings.",
      actions: [{ type: "LINK", label: "View Profile", href: "/profile" }]
    };
  }

  return {
    text: "I can help you find doctors, check their availability, manage your appointments, and review your prescriptions. How can I assist you today?"
  };
}

function handleDoctorQuery(q: string, doctorId: string): AssistantResponse {
  const myApts = getAppointmentsForDoctor(doctorId);
  const mySlots = getAvailableSlotsForDoctor(doctorId);

  // 1. "How many appointments do I have today?" / "What's my schedule today?"
  if (q.includes("today") && q.includes("appointment")) {
    const todayApts = myApts.filter(a => isSameDay(new Date(a.startsAt), new Date()) && ["pending", "confirmed"].includes(a.status));
    return {
      text: `You have ${todayApts.length} upcoming appointments today.`,
      actions: [{ type: "LINK", label: "View Schedule", href: "/doctor/dashboard" }]
    };
  }

  // 2. "Who is my next patient?"
  if (q.includes("next patient") || q.includes("first appointment") || q.includes("next appointment")) {
    const upcoming = myApts
      .filter(a => ["pending", "confirmed"].includes(a.status) && isAfter(new Date(a.startsAt), new Date()))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    if (upcoming.length === 0) return { text: "You have no upcoming patients." };
    const next = upcoming[0];
    return {
      text: `Your next patient is ${next.patient.name} on ${format(new Date(next.startsAt), "MMMM do 'at' h:mm a")} for ${next.reason}.`,
      actions: [{ type: "LINK", label: "View Appointment", href: `/doctor/appointments/${next.id}` }]
    };
  }

  // 3. "When am I free tomorrow?"
  if (q.includes("free") && (q.includes("tomorrow") || q.includes("friday"))) {
    const targetDate = q.includes("tomorrow") ? addDays(new Date(), 1) : addDays(new Date(), 2);
    const targetDateStr = format(targetDate, "yyyy-MM-dd");
    const freeSlots = mySlots.filter(s => s.date === targetDateStr);
    
    if (freeSlots.length === 0) return { text: `You have no free slots on ${format(targetDate, "EEEE")}.` };
    
    return {
      text: `You have ${freeSlots.length} free periods on ${format(targetDate, "EEEE, MMMM do")}, starting with ${freeSlots[0].startTime}.`,
      actions: [{ type: "LINK", label: "View Availability", href: "/doctor/availability" }]
    };
  }

  // 5. "When can I reschedule Rahul?" / "Find a free slot for Rahul tomorrow." / "Can I move Rahul to 2 PM?"
  if (q.includes("reschedule") || (q.includes("rahul") && q.includes("slot"))) {
    const rahulApt = myApts.find(a => a.patient.name.toLowerCase().includes("rahul") && ["pending", "confirmed"].includes(a.status));
    if (!rahulApt) {
      return { text: "I couldn't find an upcoming appointment for Rahul." };
    }
    
    const futureSlots = mySlots.filter(s => isAfter(new Date(`${s.date}T${s.startTime}:00`), new Date()));
    if (futureSlots.length === 0) return { text: "You don't have any future availability to reschedule this appointment." };
    
    const nextFree = futureSlots[0];
    return {
      text: `${rahulApt.patient.name} currently has an appointment on ${format(new Date(rahulApt.startsAt), "MMM do 'at' h:mm a")}. Would you like to reschedule them to your next available slot on ${format(new Date(`${nextFree.date}T${nextFree.startTime}:00`), "MMM do 'at' h:mm a")}?`,
      actions: [
        { type: "RESCHEDULE_PROMPT", label: "Confirm Reschedule", appointmentId: rahulApt.id, doctorId, newDate: nextFree.date, newStartTime: nextFree.startTime },
        { type: "CANCEL", label: "Cancel" }
      ]
    };
  }

  // 8. "When is Rahul's appointment now?"
  if (q.includes("rahul") && q.includes("when")) {
    const rahulApt = myApts.find(a => a.patient.name.toLowerCase().includes("rahul"));
    if (!rahulApt) return { text: "I couldn't find an appointment for Rahul." };
    return {
      text: `Rahul's appointment is scheduled for ${format(new Date(rahulApt.startsAt), "MMMM do 'at' h:mm a")}.`,
      actions: [{ type: "LINK", label: "View Appointment", href: `/doctor/appointments/${rahulApt.id}` }]
    };
  }

  // 10. "How many pending appointments do I have?"
  if (q.includes("pending")) {
    const pending = myApts.filter(a => a.status === "pending");
    return {
      text: `You have ${pending.length} pending appointments requiring confirmation.`,
      actions: [{ type: "LINK", label: "View Appointments", href: "/doctor/appointments" }]
    };
  }

  // Prescriptions check
  if (q.includes("prescription")) {
    return {
      text: "You can view and manage prescriptions by navigating to a patient's completed appointment.",
      actions: [{ type: "LINK", label: "View Appointments", href: "/doctor/appointments" }]
    };
  }

  return {
    text: "I can help you manage your schedule, find your next patient, locate free slots, and reschedule appointments. What do you need?"
  };
}
