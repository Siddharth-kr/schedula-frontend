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

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: AssistantAction[];
};

// General AI Knowledge Base Mock
const GENERAL_KNOWLEDGE: Record<string, string> = {
  "diabetes": "Diabetes is a chronic health condition that affects how your body turns food into energy. It occurs when your blood glucose, also called blood sugar, is too high.",
  "blood pressure": "Blood pressure is the force of your blood pushing against the walls of your arteries. High blood pressure (hypertension) can lead to serious health issues like heart disease.",
  "cold and flu": "Both the common cold and the flu are respiratory illnesses, but they are caused by different viruses. Flu symptoms are usually more severe and come on suddenly, while a cold is generally milder.",
  "before visiting": "Before visiting a doctor, you should: 1. Write down your symptoms and when they started. 2. Bring a list of all medications you take. 3. Prepare any questions you have.",
  "write an email": "Subject: Follow-up regarding my recent appointment\n\nDear Doctor,\n\nI hope this email finds you well. I am writing to follow up on my recent visit and ask a quick question regarding my treatment plan... [Please customize this draft]",
  "api": "An API (Application Programming Interface) is a set of rules and protocols that lets different software applications communicate with each other.",
  "machine learning": "Machine learning is a branch of artificial intelligence (AI) and computer science which focuses on the use of data and algorithms to imitate the way that humans learn, gradually improving its accuracy.",
  "sleep habits": "Healthy sleep habits (sleep hygiene) include maintaining a consistent sleep schedule, avoiding screens 1-2 hours before bed, keeping your room cool and dark, and avoiding caffeine late in the day.",
  "hypertension": "Hypertension, or high blood pressure, is a common condition in which the long-term force of the blood against your artery walls is high enough that it may eventually cause health problems, such as heart disease."
};

export async function processAssistantQuery(
  query: string,
  role: "patient" | "doctor",
  userNameOrId: string,
  history: ChatMessage[] = []
): Promise<AssistantResponse> {
  const q = query.toLowerCase().trim();

  // Artificial delay to simulate AI thinking
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
  
  // MEDICAL SAFETY CHECKS
  if (q.includes("do i have") && (q.includes("hypertension") || q.includes("diabetes") || q.includes("cancer"))) {
    return { text: "I cannot diagnose medical conditions. Please consult with a qualified healthcare professional. If you'd like, I can help you book an appointment with a doctor.", actions: [{ type: "LINK", label: "Find a Doctor", href: "/doctors" }] };
  }
  if (q.includes("what medicines should i take") || q.includes("what medication")) {
    return { text: "I cannot prescribe medication or offer specific medical advice. Please consult a qualified healthcare professional regarding any treatments." };
  }

  if (role === "patient") {
    return handlePatientQuery(q, userNameOrId);
  } else {
    return handleDoctorQuery(q, userNameOrId, history);
  }
}

function handlePatientQuery(q: string, patientName: string): AssistantResponse {
  // MIXED: Explain prescription
  if (q.includes("explain my prescription")) {
    const rx = getPrescriptionsForPatient(patientName);
    if (rx.length === 0) return { text: "You don't have any prescriptions on file to explain." };
    const latest = rx.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const medNames = latest.medicines.map((m) => m.name).join(", ");
    return {
      text: `Your latest prescription is for ${latest.diagnosis}. It includes ${medNames}. Generally, these medications are used to manage symptoms and treat the underlying cause of ${latest.diagnosis}. Always follow the exact dosage instructions provided by your doctor.`,
      actions: [{ type: "LINK", label: "View Prescriptions", href: "/profile" }]
    };
  }
  
  // MIXED: What to prepare for Dr. Rao
  if (q.includes("prepare") && q.includes("rao")) {
    return {
      text: "You have an upcoming appointment with Dr. Anika Rao. Before visiting, you should write down any symptoms you are experiencing, bring a list of your current medications, and have your insurance information ready.",
      actions: [{ type: "LINK", label: "View Appointment", href: "/appointments" }]
    };
  }

  // 1. "When is my next appointment?"
  if (q.includes("next appointment") || (q.includes("what is my next appointment"))) {
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
  if ((q.includes("find") || q.includes("which")) && q.includes("doctor")) {
    const docs = getRegisteredDoctors();
    return {
      text: `We have several great doctors available, including ${docs.slice(0, 3).map(d => d.name).join(", ")}.`,
      actions: [{ type: "LINK", label: "View Doctors", href: "/doctors" }]
    };
  }

  // 3. "When is Dr. Anika Rao free?" / "Show me her available slots."
  if (q.includes("anika") || q.includes("rao") || q.includes("her available") || q.includes("free") || q.includes("available slots")) {
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
      text: `Your latest prescription was for diagnosis: "${latest.diagnosis}". Medications include: ${latest.medicines.map((m) => m.name).join(", ")}.`,
      actions: [{ type: "LINK", label: "View Prescriptions", href: "/profile" }]
    };
  }

  // 9. "How can I rebook?" / "How do I book an appointment?"
  if (q.includes("rebook") || (q.includes("how") && q.includes("book"))) {
    return {
      text: "You can book an appointment by finding a doctor in our directory and clicking on an available time slot.",
      actions: [{ type: "LINK", label: "Find a Doctor", href: "/doctors" }]
    };
  }

  // General Knowledge Fallback
  for (const [key, val] of Object.entries(GENERAL_KNOWLEDGE)) {
    if (q.includes(key)) {
      return { text: val };
    }
  }

  return {
    text: "I am a simulated AI assistant powered by advanced language models. However, I can also securely access your Schedula context. You can ask me to find doctors, manage your appointments, or ask general healthcare and knowledge questions!"
  };
}

function handleDoctorQuery(q: string, doctorId: string, history: ChatMessage[]): AssistantResponse {
  const myApts = getAppointmentsForDoctor(doctorId);
  const mySlots = getAvailableSlotsForDoctor(doctorId);

  // MEMORY: "Can I move Rahul there?" (Context: free tomorrow)
  if (q.includes("move rahul there") || (q.includes("move") && q.includes("there"))) {
    // Look back in history for mention of Rahul
    const hasRahul = history.some(m => m.text.toLowerCase().includes("rahul")) || q.includes("rahul");
    if (!hasRahul) return { text: "I'm not sure who you want to move. Could you specify the patient's name?" };
    
    const rahulApt = myApts.find(a => a.patient.name.toLowerCase().includes("rahul") && ["pending", "confirmed"].includes(a.status));
    if (!rahulApt) return { text: "I couldn't find an upcoming appointment for Rahul to move." };
    
    // Assume "there" refers to the next free slot discussed
    const futureSlots = mySlots.filter(s => isAfter(new Date(`${s.date}T${s.startTime}:00`), new Date()));
    if (futureSlots.length === 0) return { text: "You don't have any future availability to reschedule this appointment." };
    const nextFree = futureSlots[0];
    
    return {
      text: `I understand you want to move Rahul to your next free slot on ${format(new Date(`${nextFree.date}T${nextFree.startTime}:00`), "MMM do 'at' h:mm a")}. Would you like to confirm this reschedule?`,
      actions: [
        { type: "RESCHEDULE_PROMPT", label: "Confirm Reschedule", appointmentId: rahulApt.id, doctorId, newDate: nextFree.date, newStartTime: nextFree.startTime },
        { type: "CANCEL", label: "Cancel" }
      ]
    };
  }

  // 1. "How many appointments do I have today?" / "What's my schedule today?"
  if (q.includes("today") && (q.includes("appointment") || q.includes("schedule"))) {
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

  // 3. "When am I free tomorrow?" / "Do I have availability Friday afternoon?"
  if (q.includes("free") || q.includes("availability") || q.includes("free slots")) {
    const targetDate = q.includes("tomorrow") ? addDays(new Date(), 1) : q.includes("friday") ? addDays(new Date(), 2) : new Date();
    const targetDateStr = format(targetDate, "yyyy-MM-dd");
    const freeSlots = mySlots.filter(s => s.date === targetDateStr);
    
    if (freeSlots.length === 0) return { text: `You have no free slots on ${format(targetDate, "EEEE, MMMM do")}.` };
    
    return {
      text: `You have ${freeSlots.length} free periods on ${format(targetDate, "EEEE, MMMM do")}, starting with ${freeSlots[0].startTime}.`,
      actions: [{ type: "LINK", label: "View Availability", href: "/doctor/availability" }]
    };
  }

  // 5. "When can I reschedule Rahul?" / "Find a free slot for Rahul tomorrow." / "Can I move Rahul to 2 PM?"
  if (q.includes("reschedule") || (q.includes("rahul") && q.includes("slot")) || (q.includes("move rahul"))) {
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
  if (q.includes("rahul") && (q.includes("when") || q.includes("appointment"))) {
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

  // General Knowledge Fallback
  for (const [key, val] of Object.entries(GENERAL_KNOWLEDGE)) {
    if (q.includes(key)) {
      return { text: val };
    }
  }

  return {
    text: "I am a simulated AI assistant powered by advanced language models. However, I can also securely access your Schedula context. I can help you manage your schedule, find your next patient, locate free slots, reschedule appointments, and answer general knowledge questions! What do you need?"
  };
}
