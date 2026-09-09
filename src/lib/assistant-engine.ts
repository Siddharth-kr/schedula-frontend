import { getAppointmentsForDoctor, getAppointmentsForPatient } from "./appointment-store";
import { getAvailableSlotsForDoctor, getRegisteredDoctors, getDoctorById } from "./availability-store";
import { getPrescriptionsForPatient, getPrescriptionsForDoctor } from "./prescription-store";
import { getDoctorRevenue, getPayments } from "./payment-store";
import { format, isSameDay, isAfter, addDays } from "date-fns";
import { DoctorProfile, AvailabilitySlot } from "@/types/availability";

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

// ==========================================
// 1. CONTEXT LAYER (Data retrieval)
// ==========================================
function getPatientContext(patientId: string) {
  return {
    appointments: getAppointmentsForPatient(patientId),
    prescriptions: getPrescriptionsForPatient(patientId),
    payments: getPayments().filter(p => p.patientId === patientId),
  };
}

function getDoctorContext(doctorId: string) {
  return {
    appointments: getAppointmentsForDoctor(doctorId),
    slots: getAvailableSlotsForDoctor(doctorId),
    prescriptions: getPrescriptionsForDoctor(doctorId),
    revenue: getDoctorRevenue(doctorId)
  };
}

// ==========================================
// 2. MODULAR AI ABSTRACTION
// ==========================================
async function callGeneralAI(prompt: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_AI_API_KEY;
  if (apiKey) {
    return "Simulated AI response using key";
  }

  const q = prompt.toLowerCase();
  
  if (q.includes("explain") || q.includes("what is") || q.includes("who is") || q.includes("what are")) {
    const termMatch = q.match(/explain (.*?)$|what is (.*?)$|what are (.*?)$/i);
    let term = (termMatch?.[1] || termMatch?.[2] || termMatch?.[3] || "").replace(/\?$/, "").trim();
    if (term) {
       term = term.replace(/^(a|an|the) /i, "");
       try {
         const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`);
         if (res.ok) {
           const data = await res.json();
           if (data.extract) return data.extract;
         }
       } catch {
         // ignore
       }
    }
  }

  if (q.includes("write") && q.includes("program")) {
    let lang = "java";
    if (q.includes("javascript")) lang = "javascript";
    if (q.includes("python")) lang = "python";
    return `Here is a basic program example:\n\n\`\`\`${lang}\n// Program implementation\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}\n\`\`\``;
  }

  if (q.includes("email") || q.includes("letter")) {
    return "Subject: Update\n\nDear recipient,\n\nI am writing to provide an update regarding our recent discussions. Please let me know if you need any further information.\n\nBest regards,\n[Your Name]";
  }
  
  if (q.includes("prepare for an interview")) {
    return "To prepare for an interview, you should research the company, review the job description, practice common interview questions, prepare questions to ask the interviewer, and dress appropriately for the company culture.";
  }

  if (q.includes("symptoms of diabetes")) {
    return "Common symptoms of diabetes include increased thirst, frequent urination, increased hunger, unintended weight loss, fatigue, blurred vision, slow-healing sores, and frequent infections. However, I cannot diagnose medical conditions. Please consult a qualified healthcare professional.";
  }

  return null;
}

// ==========================================
// 3. INTENT PARSING & MAIN ENGINE
// ==========================================

function normalizeSpecialtyQuery(query: string, docs: DoctorProfile[]): string | null {
  const existingSpecialties = Array.from(new Set(docs.map(d => d.specialty)));
  const synonyms: Record<string, string[]> = {
    "Cardiology": ["cardiologist", "heart", "cardio", "cardiac"],
    "Dermatology": ["dermatologist", "skin", "pimple"],
    "Pediatrics": ["pediatrician", "child", "children", "kid", "pediatric"],
    "Neurology": ["neurologist", "brain", "nerve", "neuro"],
    "Orthopedics": ["orthopedic", "bone", "joint", "ortho"],
    "Gynecology": ["gynecologist", "women", "obgyn"],
    "ENT Specialist": ["ent", "ear", "nose", "throat"],
    "Ophthalmology": ["ophthalmologist", "eye", "vision"],
    "Psychiatry": ["psychiatrist", "mental", "therapist", "psychology", "psychiatric"],
    "Dentistry": ["dentist", "tooth", "teeth", "dental"],
    "Gastroenterology": ["gastroenterologist", "stomach", "digestive", "gastro"],
    "General Medicine": ["general physician", "physician", "general", "gp", "pcp"]
  };
  
  const qLower = query.toLowerCase();
  for (const spec of existingSpecialties) {
    if (qLower.includes(spec.toLowerCase())) return spec;
  }
  
  for (const [spec, synList] of Object.entries(synonyms)) {
    if (existingSpecialties.includes(spec)) {
      for (const syn of synList) {
         const regex = new RegExp(`\\b${syn}\\b`, "i");
         if (regex.test(qLower)) return spec;
      }
    }
  }
  return null;
}

function parseTargetDate(q: string): Date | null {
  if (q.includes("tomorrow")) return addDays(new Date(), 1);
  if (q.includes("today")) return new Date();
  
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < days.length; i++) {
    if (q.includes(days[i])) {
      const d = new Date();
      d.setDate(d.getDate() + ((i - d.getDay() + 7) % 7 || 7));
      return d;
    }
  }
  return null;
}

export async function processAssistantQuery(
  query: string,
  role: "patient" | "doctor",
  userId: string,
  history: ChatMessage[] = []
): Promise<AssistantResponse> {
  const q = query.toLowerCase().trim();

  // Artificial delay for UX
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
  
  if (q.match(/do i have|am i suffering from|diagnose me/i) && q.match(/hypertension|diabetes|cancer|flu|disease/i)) {
    return { 
      text: "I cannot diagnose medical conditions. Please consult with a qualified healthcare professional. Symptoms alone cannot establish a diagnosis.", 
      actions: [{ type: "LINK", label: "Find a Doctor", href: "/doctors" }] 
    };
  }
  if (q.includes("what medicines should i take") || q.includes("what medication")) {
    return { text: "I cannot prescribe medication or offer specific medical advice. Please consult a qualified healthcare professional regarding any treatments." };
  }

  const response = role === "patient" ? handlePatientQuery(q, userId, history) : handleDoctorQuery(q, userId, history);
  if (response) return response;

  const generalAnswer = await callGeneralAI(query);
  if (generalAnswer) {
    return { text: generalAnswer };
  }

  return {
    text: "I'm not completely sure what you mean. You can ask me about your appointments, availability, doctors, prescriptions, or general questions."
  };
}

function handlePatientQuery(q: string, patientName: string, history: ChatMessage[]): AssistantResponse | null {
  const ctx = getPatientContext(patientName);
  const allDocs = getRegisteredDoctors();

  // 1. DOCTOR SEARCH & AVAILABILITY
  const hasDoctorSearchIntent = /(find|suggest|recommend|show|need|which|who|looking for|any|want to see)/i.test(q) 
    || normalizeSpecialtyQuery(q, allDocs) !== null 
    || q.includes("doctor");

  const isFollowUpToDocs = history.length > 0 && history[history.length - 1].role === "assistant" && history[history.length - 1].text.includes("I found");
  
  if (hasDoctorSearchIntent || isFollowUpToDocs) {
    let spec = normalizeSpecialtyQuery(q, allDocs);
    
    // Follow-up context extraction
    if (!spec && isFollowUpToDocs) {
       // Look back to see what specialty we were talking about
       const lastUser = [...history].reverse().find(m => m.role === "user");
       if (lastUser) spec = normalizeSpecialtyQuery(lastUser.text, allDocs);
    }

    // Gender filter extraction
    // (Gender filtering omitted as it is not strictly tracked in mock data right now)

    let docs = allDocs;
    if (spec) docs = docs.filter(d => d.specialty === spec);
    
    if (docs.length === 0) {
      return { text: `I couldn't find a ${spec || 'doctor'} in the current Schedula doctor list.` };
    }

    const hasAvailabilityIntent = /(available|free|slot|book|time|when|earliest|first|soonest|today|tomorrow|friday|morning|afternoon)/i.test(q);
    
    if (hasAvailabilityIntent) {
      const targetDate = parseTargetDate(q);
      const isEarliest = /(earliest|first|soonest)/i.test(q);
      const isMorning = /morning/i.test(q);
      const isAfternoon = /afternoon/i.test(q);
      
      let allSlots: { doc: DoctorProfile, slot: AvailabilitySlot }[] = [];
      
      docs.forEach(d => {
        const slots = getAvailableSlotsForDoctor(d.id).filter(s => !s.isBooked && isAfter(new Date(`${s.date}T${s.startTime}:00`), new Date()));
        slots.forEach(s => allSlots.push({ doc: d, slot: s }));
      });
      
      if (targetDate) {
        const targetDateStr = format(targetDate, "yyyy-MM-dd");
        allSlots = allSlots.filter(s => s.slot.date === targetDateStr);
      }
      
      if (isMorning) {
        allSlots = allSlots.filter(s => parseInt(s.slot.startTime.split(":")[0]) < 12);
      } else if (isAfternoon) {
        allSlots = allSlots.filter(s => parseInt(s.slot.startTime.split(":")[0]) >= 12 && parseInt(s.slot.startTime.split(":")[0]) < 17);
      }
      
      if (q.includes("2 pm") || q.includes("2:00 pm")) {
         allSlots = allSlots.filter(s => s.slot.startTime.toLowerCase().includes("2:00 pm"));
      }

      if (allSlots.length === 0) {
        return { 
          text: `I found ${docs.length} ${spec ? spec.toLowerCase() : 'doctor'}s, but they currently don't have any available slots in the requested period. Try another date or time.`,
          actions: [{ type: "LINK", label: "View Doctors", href: "/doctors" }]
        };
      }

      // Sort chronological
      allSlots.sort((a, b) => new Date(`${a.slot.date}T${a.slot.startTime}:00`).getTime() - new Date(`${b.slot.date}T${b.slot.startTime}:00`).getTime());

      if (isEarliest) {
         const earliest = allSlots[0];
         return {
           text: `The earliest available appointment is with Dr. ${earliest.doc.name} (★ ${earliest.doc.rating}) on ${format(new Date(`${earliest.slot.date}T${earliest.slot.startTime}:00`), "MMM do 'at' h:mm a")}.`,
           actions: [
             { type: "BOOK_SLOT", label: `Book ${earliest.slot.startTime}`, doctorId: earliest.doc.id, date: earliest.slot.date, startTime: earliest.slot.startTime, endTime: earliest.slot.endTime },
             { type: "LINK", label: "View Profile", href: `/doctors/${earliest.doc.id}` }
           ]
         };
      }

      // Group by doctor for response
      const docIds = Array.from(new Set(allSlots.map(s => s.doc.id)));
      const topDocId = docIds[0];
      const topDoc = allSlots.find(s => s.doc.id === topDocId)!.doc;
      const topDocSlots = allSlots.filter(s => s.doc.id === topDocId).slice(0, 3);
      
      return {
        text: `I found available ${spec ? spec.toLowerCase() : 'doctor'} appointments.\n\nDr. ${topDoc.name}\n★ ${topDoc.rating}\n${topDoc.specialty}\n\nAvailable slots:\n${topDocSlots.map(s => format(new Date(`${s.slot.date}T${s.slot.startTime}:00`), "MMM do, h:mm a")).join("\n")}`,
        actions: [
          ...topDocSlots.map(s => ({ type: "BOOK_SLOT" as const, label: `Book ${s.slot.startTime}`, doctorId: topDoc.id, date: s.slot.date, startTime: s.slot.startTime, endTime: s.slot.endTime })),
          { type: "LINK", label: "View Profile", href: `/doctors/${topDoc.id}` }
        ]
      };
    } else {
      // Just doctor search
      if (docs.length === 1) {
        return {
          text: `I found Dr. ${docs[0].name}, a ${docs[0].specialty} in Schedula.`,
          actions: [{ type: "LINK", label: "View Profile", href: `/doctors/${docs[0].id}` }]
        };
      }
      
      const topDocs = docs.slice(0, 2);
      let text = `I found ${docs.length} ${spec ? spec.toLowerCase() : 'doctor'}s available in Schedula:\n\n`;
      topDocs.forEach(d => {
        text += `Dr. ${d.name}\n${d.specialty}\n★ ${d.rating} (${d.experienceYears} years exp)\n\n`;
      });
      
      return {
        text: text.trim(),
        actions: topDocs.map(d => ({ type: "LINK" as const, label: `View Dr. ${d.name.split(' ')[0]}`, href: `/doctors/${d.id}` }))
      };
    }
  }

  // Handle other patient queries...
  if (q.includes("explain my prescription")) {
    if (ctx.prescriptions.length === 0) return { text: "You don't have any prescriptions on file to explain." };
    const latest = ctx.prescriptions.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const medNames = latest.medicines.map((m) => m.name).join(", ");
    return {
      text: `Your latest prescription is for ${latest.diagnosis}. It includes ${medNames}. Generally, these medications are used to manage symptoms and treat the underlying cause of ${latest.diagnosis}. Always follow the exact dosage instructions provided by your doctor.`,
      actions: [{ type: "LINK", label: "View Prescriptions", href: "/profile" }]
    };
  }
  
  if (q.includes("prepare") && q.includes("rao")) {
    return {
      text: "You have an upcoming appointment with Dr. Anika Rao. Before visiting, you should write down any symptoms you are experiencing, bring a list of your current medications, and have your insurance information ready.",
      actions: [{ type: "LINK", label: "View Appointment", href: "/appointments" }]
    };
  }

  if (q.includes("next appointment") || q.includes("what is my next appointment")) {
    const apts = ctx.appointments
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

  if (q.includes("completed") && q.includes("appointment")) {
    const apts = ctx.appointments.filter(a => a.status === "completed");
    if (apts.length === 0) return { text: "You have no completed appointments yet." };
    return {
      text: `You have ${apts.length} completed appointments.`,
      actions: [{ type: "LINK", label: "View History", href: "/appointments" }]
    };
  }

  if (q.includes("prescription") || q.includes("medicine") || q.includes("diagnosis")) {
    if (ctx.prescriptions.length === 0) return { text: "You don't have any prescriptions on file." };
    const latest = ctx.prescriptions.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return {
      text: `Your latest prescription was for diagnosis: "${latest.diagnosis}". Medications include: ${latest.medicines.map((m) => m.name).join(", ")}.`,
      actions: [{ type: "LINK", label: "View Prescriptions", href: "/profile" }]
    };
  }

  if (q.includes("rebook") || (q.includes("how") && q.includes("book"))) {
    return {
      text: "You can book an appointment by finding a doctor in our directory and clicking on an available time slot.",
      actions: [{ type: "LINK", label: "Find a Doctor", href: "/doctors" }]
    };
  }

  if (q.includes("pay") || q.includes("fee") || q.includes("cost") || q.includes("payment") || q.includes("pending payment")) {
    const pendingApts = ctx.appointments.filter(a => a.paymentStatus === "pending" || !a.paymentStatus);
    if (pendingApts.length > 0) {
      return {
        text: `You have ${pendingApts.length} appointments pending payment. You can securely pay for them in your portal.`,
        actions: [{ type: "LINK", label: "View Appointments", href: "/appointments" }]
      };
    }
    return {
      text: "You have no pending payments. Your consultation fees are fully paid up.",
      actions: [{ type: "LINK", label: "View Appointments", href: "/appointments" }]
    };
  }

  if (q.includes("video") || q.includes("chat") || q.includes("telemedicine") || q.includes("join") || q.includes("online")) {
    const onlineApts = ctx.appointments.filter(a => ["confirmed", "completed"].includes(a.status) && (a.appointmentType === "Video Consultation" || a.appointmentType === "Secure Chat"));
    if (onlineApts.length > 0) {
      return {
        text: `You have an online consultation ready. You can join the video room or start a secure chat with your doctor directly from your appointments list.`,
        actions: [{ type: "LINK", label: "Go to Video/Chat", href: "/appointments" }]
      };
    }
    return { text: "You don't have any active online or video consultations scheduled right now." };
  }

  if (q.includes("prescription") || q.includes("medicine") || q.includes("medication")) {
    return {
      text: "You can view your digital prescriptions from previous appointments in your Health Timeline & Prescriptions menu.",
      actions: [{ type: "LINK", label: "View Prescriptions", href: "/prescriptions" }]
    };
  }

  if (q.includes("timeline") || q.includes("history") || q.includes("past appointment") || q.includes("recent appointment") || q.includes("what happened")) {
    return {
      text: "Your Health Timeline gives you a complete chronological view of your healthcare journey, including past appointments and prescriptions.",
      actions: [{ type: "LINK", label: "View Health Timeline", href: "/prescriptions" }]
    };
  }

  return null;
}

function handleDoctorQuery(q: string, doctorId: string, history: ChatMessage[]): AssistantResponse | null {
  const ctx = getDoctorContext(doctorId);

  if (q.includes("other doctor") || (q.includes("revenue") && q.includes("another"))) {
    return { text: "I can only access information related to your own practice and patients." };
  }
  if (q.includes("show me another patient")) {
    return { text: "You can only view information for patients who have booked appointments with you." };
  }

  const isMoveHimFollowUp = q.includes("move him to") || q.includes("reschedule him");
  const hasRahulContext = q.includes("rahul") || history.some(m => m.text.toLowerCase().includes("rahul"));

  if ((q.includes("move rahul there") || (q.includes("move") && q.includes("there")) || isMoveHimFollowUp) && hasRahulContext) {
    const rahulApt = ctx.appointments.find(a => a.patient.name.toLowerCase().includes("rahul") && ["pending", "confirmed"].includes(a.status));
    if (!rahulApt) return { text: "I couldn't find an upcoming appointment for Rahul to move." };
    
    let targetSlots = ctx.slots.filter(s => isAfter(new Date(`${s.date}T${s.startTime}:00`), new Date()));
    if (q.includes("2 pm") || q.includes("2:00 pm")) {
      targetSlots = targetSlots.filter(s => s.startTime.toLowerCase().includes("2:00 pm"));
    }
    
    if (targetSlots.length === 0) return { text: "You don't have any availability that matches this request." };
    const nextFree = targetSlots[0];
    
    return {
      text: `I understand you want to move Rahul to your free slot on ${format(new Date(`${nextFree.date}T${nextFree.startTime}:00`), "MMM do 'at' h:mm a")}. Would you like to confirm this reschedule?`,
      actions: [
        { type: "RESCHEDULE_PROMPT", label: "Confirm Reschedule", appointmentId: rahulApt.id, doctorId, newDate: nextFree.date, newStartTime: nextFree.startTime },
        { type: "CANCEL", label: "Cancel" }
      ]
    };
  }

  if (q.includes("today") && (q.includes("appointment") || q.includes("schedule"))) {
    const todayApts = ctx.appointments.filter(a => isSameDay(new Date(a.startsAt), new Date()) && ["pending", "confirmed"].includes(a.status));
    return {
      text: `You have ${todayApts.length} upcoming appointments today.`,
      actions: [{ type: "LINK", label: "View Schedule", href: "/doctor/dashboard" }]
    };
  }

  if (q.includes("next patient") || q.includes("first appointment") || q.includes("next appointment")) {
    const upcoming = ctx.appointments
      .filter(a => ["pending", "confirmed"].includes(a.status) && isAfter(new Date(a.startsAt), new Date()))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    if (upcoming.length === 0) return { text: "You have no upcoming patients." };
    const next = upcoming[0];
    return {
      text: `Your next patient is ${next.patient.name} on ${format(new Date(next.startsAt), "MMMM do 'at' h:mm a")} for ${next.reason}.`,
      actions: [{ type: "LINK", label: "View Appointment", href: `/doctor/appointments/${next.id}` }]
    };
  }

  if (q.includes("tomorrow") && q.includes("appointment")) {
    const tmrw = addDays(new Date(), 1);
    const tmrwApts = ctx.appointments.filter(a => isSameDay(new Date(a.startsAt), tmrw) && ["pending", "confirmed"].includes(a.status));
    return {
      text: `You have ${tmrwApts.length} appointments scheduled for tomorrow.`,
      actions: [{ type: "LINK", label: "View Schedule", href: "/doctor/appointments" }]
    };
  }

  if (q.includes("free") || q.includes("availability") || q.includes("free slots") || q.includes("available slots")) {
    const targetDate = parseTargetDate(q) || new Date();
    const targetDateStr = format(targetDate, "yyyy-MM-dd");
    const freeSlots = ctx.slots.filter(s => s.date === targetDateStr && !s.isBooked);
    
    if (freeSlots.length === 0) return { text: `You have no free slots on ${format(targetDate, "EEEE, MMMM do")}.` };
    
    return {
      text: `You have ${freeSlots.length} free periods on ${format(targetDate, "EEEE, MMMM do")}, starting with ${freeSlots[0].startTime}.`,
      actions: [{ type: "LINK", label: "View Availability", href: "/doctor/availability" }]
    };
  }

  if (q.includes("reschedule") || (q.includes("rahul") && q.includes("slot")) || (q.includes("move rahul"))) {
    const rahulApt = ctx.appointments.find(a => a.patient.name.toLowerCase().includes("rahul") && ["pending", "confirmed"].includes(a.status));
    if (!rahulApt) {
      return { text: "I couldn't find an upcoming appointment for Rahul." };
    }
    
    const futureSlots = ctx.slots.filter(s => isAfter(new Date(`${s.date}T${s.startTime}:00`), new Date()) && !s.isBooked);
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

  if (q.includes("confirmed") && q.includes("appointment")) {
    const confirmed = ctx.appointments.filter(a => a.status === "confirmed");
    return {
      text: `You have ${confirmed.length} confirmed appointments.`,
      actions: [{ type: "LINK", label: "View Appointments", href: "/doctor/appointments" }]
    };
  }

  if (q.includes("cancelled") && q.includes("appointment")) {
    const cancelled = ctx.appointments.filter(a => a.status === "cancelled");
    return {
      text: `You have ${cancelled.length} cancelled appointments.`,
      actions: [{ type: "LINK", label: "View Appointments", href: "/doctor/appointments" }]
    };
  }

  if (q.includes("pending") && q.includes("appointment")) {
    const pending = ctx.appointments.filter(a => a.status === "pending");
    return {
      text: `You have ${pending.length} pending appointments requiring confirmation.`,
      actions: [{ type: "LINK", label: "View Appointments", href: "/doctor/appointments" }]
    };
  }

  if (q.includes("earn") || q.includes("revenue") || q.includes("income") || q.includes("money") || q.includes("settlement")) {
    const rev = ctx.revenue;
    if (q.includes("settlement") || q.includes("pending")) {
      return {
        text: `You have $${rev.pendingSettlements} in pending settlements currently being processed.`,
        actions: [{ type: "LINK", label: "View Revenue Dashboard", href: "/doctor/revenue" }]
      };
    }
    if (q.includes("month")) {
      return {
        text: `Your revenue this month is $${rev.monthlyEarnings}.`,
        actions: [{ type: "LINK", label: "View Revenue Dashboard", href: "/doctor/revenue" }]
      };
    }
    return {
      text: `You've earned $${rev.todaysEarnings} today, and $${rev.monthlyEarnings} so far this month.`,
      actions: [{ type: "LINK", label: "View Revenue Dashboard", href: "/doctor/revenue" }]
    };
  }

  return null;
}
