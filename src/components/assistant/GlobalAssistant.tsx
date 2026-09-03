"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { processAssistantQuery, AssistantResponse, AssistantAction, ChatMessage } from "@/lib/assistant-engine";
import { getDoctorSession } from "@/lib/availability-store";
import { rescheduleAppointment } from "@/lib/appointment-store";
import { toast } from "react-toastify";
import Link from "next/link";

export function GlobalAssistant() {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<"public" | "patient" | "doctor">("public");
  const [userId, setUserId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const docSession = getDoctorSession();
    if (docSession) {
      setTimeout(() => {
        setRole("doctor");
        setUserId(docSession.id);
      }, 0);
    } else {
      const patientSession = localStorage.getItem("mock_user");
      if (patientSession) {
        setTimeout(() => {
          setRole("patient");
          const user = JSON.parse(patientSession);
          setUserId(user.name);
        }, 0);
      } else {
        setTimeout(() => setRole("public"), 0);
      }
    }
  }, [pathname, isOpen]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (role === "public") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await processAssistantQuery(userMsg.text, role as "patient" | "doctor", userId, messages);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: res.text,
        actions: res.actions
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", text: "Sorry, I encountered an error checking your data." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: AssistantAction) => {
    if (action.type === "LINK") {
      router.push(action.href);
      setIsOpen(false);
    } else if (action.type === "BOOK_SLOT") {
      router.push(`/booking/${action.doctorId}?date=${action.date}&time=${action.startTime}`);
      setIsOpen(false);
    } else if (action.type === "CANCEL") {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", text: "Action cancelled." }]);
    } else if (action.type === "RESCHEDULE_PROMPT") {
      try {
        rescheduleAppointment(action.appointmentId, action.newDate, action.newStartTime);
        toast.success("Appointment rescheduled successfully!");
        setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", text: "I've successfully rescheduled the appointment." }]);
      } catch (err) {
        toast.error((err as Error).message || "Failed to reschedule.");
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-dark hover:shadow-xl active:scale-95 ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
      >
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Ask Schedula
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex flex-col sm:w-[400px] h-full sm:h-[600px] sm:max-h-[85vh] bg-white sm:rounded-2xl shadow-2xl border border-border overflow-hidden">
          
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-primary-dark px-5 py-4 text-white">
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">
                <svg className="size-5 text-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                Schedula Assistant
              </h2>
              <p className="text-xs text-white/70 font-medium">
                {role === "patient" ? "Your personal appointment assistant" : "Your practice & schedule assistant"}
              </p>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-2 hover:bg-white/10 transition-colors">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 bg-background space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary space-y-4">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">How can I help you today?</p>
                <div className="flex flex-col gap-2 w-full mt-4">
                  {role === "patient" ? (
                    <>
                      <button onClick={() => setInput("When is my next appointment?")} className="text-xs bg-white border border-border rounded-lg py-2 px-3 hover:border-primary text-text-primary text-left transition-colors">&quot;When is my next appointment?&quot;</button>
                      <button onClick={() => setInput("Find available doctors.")} className="text-xs bg-white border border-border rounded-lg py-2 px-3 hover:border-primary text-text-primary text-left transition-colors">&quot;Find available doctors.&quot;</button>
                      <button onClick={() => setInput("When is Dr. Anika Rao free?")} className="text-xs bg-white border border-border rounded-lg py-2 px-3 hover:border-primary text-text-primary text-left transition-colors">&quot;When is Dr. Anika Rao free?&quot;</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setInput("What's my schedule today?")} className="text-xs bg-white border border-border rounded-lg py-2 px-3 hover:border-primary text-text-primary text-left transition-colors">&quot;What&apos;s my schedule today?&quot;</button>
                      <button onClick={() => setInput("When am I free tomorrow?")} className="text-xs bg-white border border-border rounded-lg py-2 px-3 hover:border-primary text-text-primary text-left transition-colors">&quot;When am I free tomorrow?&quot;</button>
                      <button onClick={() => setInput("Who is my next patient?")} className="text-xs bg-white border border-border rounded-lg py-2 px-3 hover:border-primary text-text-primary text-left transition-colors">&quot;Who is my next patient?&quot;</button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user" ? "bg-primary text-white rounded-br-none" : "bg-white border border-border text-text-primary rounded-bl-none shadow-sm"
                  }`}>
                    {msg.text}
                  </div>
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2 w-full max-w-[85%]">
                      {msg.actions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleAction(act)}
                          className="w-full bg-white border border-primary text-primary hover:bg-primary/5 font-bold text-xs py-2 rounded-lg transition-colors"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex items-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white border border-border rounded-bl-none shadow-sm flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-primary/40 animate-bounce"></div>
                  <div className="size-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="size-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="shrink-0 p-4 bg-white border-t border-border flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your appointments..."
              className="flex-1 bg-background border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="size-10 shrink-0 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
