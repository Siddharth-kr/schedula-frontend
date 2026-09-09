export type ChatMessage = {
  messageId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  senderId: string; // patientId or doctorId
  message: string;
  timestamp: string;
  readStatus: "sent" | "delivered" | "read";
};

export function getChatMessages(appointmentId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem("schedula_chat_" + appointmentId);
  return data ? JSON.parse(data) : [];
}

export function sendChatMessage(msg: Omit<ChatMessage, "messageId" | "timestamp" | "readStatus">): ChatMessage {
  const newMsg: ChatMessage = {
    ...msg,
    messageId: "msg-" + Date.now() + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    readStatus: "sent",
  };
  
  const existing = getChatMessages(msg.appointmentId);
  existing.push(newMsg);
  
  localStorage.setItem("schedula_chat_" + msg.appointmentId, JSON.stringify(existing));
  window.dispatchEvent(new Event("schedula_chat_updated"));
  return newMsg;
}
