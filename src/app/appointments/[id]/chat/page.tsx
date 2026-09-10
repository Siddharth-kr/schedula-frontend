"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAppointmentById } from "@/lib/appointment-store";
import type { Appointment } from "@/types/appointment";
import { getChatMessages, sendChatMessage, type ChatMessage } from "@/lib/chat-store";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/authStore";

export default function SecureChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const { patient } = useAuthStore();

  useEffect(() => {
    try {
      if (!patient || patient.role !== "patient") {
        router.push("/login");
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPatientId(patient.name);

      const apt = getAppointmentById(id);
      if (!apt || apt.patient.name !== patient.name) {
        toast.error("Appointment not found.");
        router.push("/appointments");
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAppointment(apt);
      
      const loadChat = () => setMessages(getChatMessages(id));
      loadChat();
      
      window.addEventListener("schedula_chat_updated", loadChat);
      return () => window.removeEventListener("schedula_chat_updated", loadChat);
    } catch {
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !appointment || !patientId) return;
    
    sendChatMessage({
      appointmentId: appointment.id,
      patientId: patientId,
      doctorId: appointment.doctorId,
      senderId: patientId,
      message: newMessage.trim(),
    });
    setNewMessage("");
  };

  if (isLoading || !appointment) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F7F9FC]">
        <div className="size-8 rounded-full border-4 border-border border-t-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F7F9FC] py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 h-[calc(100vh-8rem)]">
        
        <div className="bg-white rounded-3xl border border-border shadow-sm flex flex-col h-full overflow-hidden">
          
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push("/appointments")} className="p-2 -ml-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-stone-50 transition-colors">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    {appointment.clinician.replace("Dr. ", "").charAt(0)}
                  </div>
                  <div className="absolute bottom-0 right-0 size-3 border-2 border-white bg-success rounded-full"></div>
                </div>
                <div>
                  <h2 className="font-bold text-text-primary leading-tight">{appointment.clinician}</h2>
                  <p className="text-[11px] font-medium text-success">Online</p>
                </div>
              </div>
            </div>
            
            {appointment.appointmentType === "Video Consultation" && (
              <Link href={`/appointments/${appointment.id}/video`}>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-sm hover:bg-indigo-100 transition-colors">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Join Video
                </button>
              </Link>
            )}
          </div>
          
          {/* MESSAGES AREA */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-stone-50">
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-white border border-border rounded-full text-xs font-medium text-text-secondary shadow-sm">
                Appointment: {new Date(appointment.startsAt).toLocaleDateString()}
              </span>
            </div>
            
            {messages.length === 0 ? (
              <div className="m-auto text-center max-w-sm">
                <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <svg className="size-8 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Secure Chat</h3>
                <p className="text-sm text-text-secondary">Messages are end-to-end encrypted. {appointment.clinician} will respond as soon as they are available.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === patientId;
                return (
                  <div key={msg.messageId} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`px-5 py-3 rounded-2xl max-w-[80%] text-[15px] leading-relaxed shadow-sm ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-border text-text-primary rounded-tl-sm'}`}>
                      {msg.message}
                    </div>
                    <span className="text-xs font-medium text-text-secondary mt-1.5 px-1 flex items-center gap-1.5">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && (
                        <svg className={`size-3.5 ${msg.readStatus === 'read' ? 'text-primary' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          
          {/* INPUT AREA */}
          <div className="p-4 sm:p-6 border-t border-border bg-white z-10">
            <form onSubmit={handleSendMessage} className="flex items-end gap-3">
              <div className="flex-1 bg-stone-50 border border-border rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <textarea 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type your message to {appointment.clinician}..."
                  className="w-full bg-transparent border-none px-4 py-3 text-sm outline-none resize-none max-h-32 min-h-[44px]"
                  rows={1}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
              </div>
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="size-11 sm:size-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark shadow-md transition-all"
              >
                <svg className="size-5 -mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
          
        </div>
      </div>
    </main>
  );
}
