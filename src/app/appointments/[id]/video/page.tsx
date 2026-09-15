"use client";
import { useAppSelector } from "@/store/hooks";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getAppointmentById } from "@/lib/appointment-store";
import type { Appointment } from "@/types/appointment";
import { getChatMessages, sendChatMessage, type ChatMessage } from "@/lib/chat-store";
import { toast } from "react-toastify";

export default function VideoConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Connection State: pre-join -> connecting -> connected -> ended
  const [connState, setConnState] = useState<"pre-join" | "connecting" | "connected" | "ended">("pre-join");
  
  // Media Toggles
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Chat Panel
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Duration Timer
  const [seconds, setSeconds] = useState(0);

  const { patient } = useAppSelector(state => state.auth);

  useEffect(() => {
    try {
      if (!patient || patient.role !== "patient") {
        router.push("/login");
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPatientId(patient.name); // Using name as ID for mock

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (connState === "connected") {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [connState]);

  const handleJoin = () => {
    setConnState("connecting");
    setTimeout(() => {
      setConnState("connected");
      toast.success("Connected to consultation");
    }, 2000);
  };

  const handleEnd = () => {
    setConnState("ended");
  };

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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-stone-900">
        <div className="size-8 rounded-full border-4 border-stone-700 border-t-white animate-spin"></div>
      </div>
    );
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (connState === "ended") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-stone-900 px-4">
        <div className="bg-stone-800 rounded-2xl p-8 max-w-md w-full text-center shadow-xl border border-stone-700">
          <div className="size-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Consultation Ended</h2>
          <p className="text-stone-400 mb-8">Your video consultation with {appointment.clinician} has concluded.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push("/appointments")} className="w-full bg-white text-stone-900 font-bold py-3 rounded-lg hover:bg-stone-200 transition-colors">
              Return to Appointments
            </button>
            <button onClick={() => router.push(`/appointments/${id}/chat`)} className="w-full bg-stone-700 text-white font-bold py-3 rounded-lg hover:bg-stone-600 transition-colors">
              Continue in Secure Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-stone-950 overflow-hidden">
      
      {/* MAIN VIDEO AREA */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* TOP BAR */}
        <div className="absolute top-0 left-0 right-0 p-4 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/appointments")} className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur transition-colors">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">{appointment.clinician}</h2>
              <p className="text-stone-300 text-xs font-medium">{appointment.appointmentType || "Video Consultation"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {connState === "connected" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur border border-stone-600/50 text-white text-sm font-semibold tabular-nums">
                <span className="size-2 rounded-full bg-error animate-pulse"></span>
                {formatDuration(seconds)}
              </div>
            )}
            <button onClick={() => setChatOpen(!chatOpen)} className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur transition-colors relative">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              {messages.length > 0 && <span className="absolute top-0 right-0 size-2.5 bg-primary rounded-full border-2 border-stone-900"></span>}
            </button>
          </div>
        </div>

        {/* VIDEO DISPLAY */}
        <div className="flex-1 flex items-center justify-center p-4">
          {connState === "pre-join" ? (
            <div className="w-full max-w-3xl aspect-video bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden relative shadow-2xl flex items-center justify-center">
              {!camOn ? (
                <div className="size-24 rounded-full bg-stone-800 flex items-center justify-center text-3xl font-bold text-stone-500">
                  {appointment.patient.initials}
                </div>
              ) : (
                <div className="absolute inset-0 bg-stone-800 flex items-center justify-center">
                  <p className="text-stone-500 font-medium text-sm flex items-center gap-2">
                    <svg className="size-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Camera Preview
                  </p>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 backdrop-blur-[2px]">
                <h3 className="text-2xl font-bold text-white mb-2">Ready to join?</h3>
                <p className="text-stone-300 text-sm mb-8 text-center max-w-md">Make sure your camera and microphone are positioned correctly before joining the consultation with {appointment.clinician}.</p>
                <button onClick={handleJoin} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-full font-bold text-lg shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                  Join Consultation
                </button>
              </div>
            </div>
          ) : connState === "connecting" ? (
            <div className="text-center">
              <div className="size-12 rounded-full border-4 border-stone-700 border-t-indigo-500 animate-spin mx-auto mb-4"></div>
              <p className="text-white font-bold text-lg">Connecting to {appointment.clinician}...</p>
              <p className="text-stone-400 text-sm mt-1">Please wait, establishing secure connection</p>
            </div>
          ) : (
            <div className="w-full h-full relative">
              {/* Doctor Main Video (Mock) */}
              <div className="absolute inset-0 bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 flex items-center justify-center">
                <div className="size-32 rounded-full bg-stone-800 flex items-center justify-center text-4xl font-bold text-stone-600">
                  {appointment.clinician.replace("Dr. ", "").charAt(0)}
                </div>
                <div className="absolute bottom-6 left-6 px-4 py-2 rounded-lg bg-black/50 backdrop-blur text-white font-medium text-sm border border-white/10 flex items-center gap-2">
                  <div className="size-2 rounded-full bg-success"></div>
                  {appointment.clinician}
                </div>
              </div>
              
              {/* Patient Mini Video (Mock) */}
              <div className="absolute top-6 right-6 w-48 aspect-video bg-stone-800 rounded-xl overflow-hidden border-2 border-stone-700 shadow-2xl flex items-center justify-center">
                {!camOn ? (
                  <div className="size-12 rounded-full bg-stone-700 flex items-center justify-center text-xl font-bold text-stone-400">
                    {appointment.patient.initials}
                  </div>
                ) : (
                  <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">You</span>
                )}
                {!micOn && (
                  <div className="absolute bottom-2 right-2 size-6 rounded-full bg-error text-white flex items-center justify-center">
                    <svg className="size-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="h-24 bg-stone-950/80 backdrop-blur-xl border-t border-stone-800/50 flex items-center justify-center gap-4 sm:gap-6 z-10">
          <button 
            onClick={() => setMicOn(!micOn)} 
            className={`size-12 sm:size-14 rounded-full flex items-center justify-center transition-all ${micOn ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-error/20 text-error hover:bg-error/30'}`}
          >
            {micOn ? (
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            ) : (
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
            )}
          </button>
          
          <button 
            onClick={() => setCamOn(!camOn)} 
            className={`size-12 sm:size-14 rounded-full flex items-center justify-center transition-all ${camOn ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-error/20 text-error hover:bg-error/30'}`}
          >
            {camOn ? (
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            ) : (
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16" /></svg>
            )}
          </button>

          {connState === "connected" && (
            <button 
              onClick={handleEnd} 
              className="px-6 h-12 sm:h-14 rounded-full flex items-center justify-center gap-2 bg-error hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-error/20"
            >
              <svg className="size-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm3 1h8v8H6V6z" clipRule="evenodd" /></svg>
              End
            </button>
          )}
        </div>
      </div>

      {/* CHAT PANEL */}
      {chatOpen && (
        <div className="w-80 lg:w-96 bg-white border-l border-border flex flex-col shadow-2xl z-20 shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-text-primary flex items-center gap-2">
              <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Secure Chat
            </h3>
            <button onClick={() => setChatOpen(false)} className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-stone-100">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#F7F9FC]">
            {messages.length === 0 ? (
              <div className="m-auto text-center p-4">
                <svg className="size-12 mx-auto text-stone-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                <p className="text-sm font-medium text-text-secondary">No messages yet.</p>
                <p className="text-xs text-text-secondary mt-1">Send a message to {appointment.clinician}.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === patientId;
                return (
                  <div key={msg.messageId} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-border text-text-primary rounded-tl-sm shadow-sm'}`}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] font-medium text-text-secondary mt-1 px-1 flex items-center gap-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && (
                        <svg className={`size-3 ${msg.readStatus === 'read' ? 'text-primary' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-3 border-t border-border bg-white">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-stone-100 border-none rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="size-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
              >
                <svg className="size-4 -mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
