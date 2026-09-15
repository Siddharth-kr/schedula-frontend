export type Payment = {
  paymentId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: string;
  transactionDate: string;
  settlementStatus: "pending" | "processing" | "settled";
};

export function getPayments(): Payment[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem("schedula_payments");
  if (data) return JSON.parse(data);
  
  // Seed with some mock data if empty
  const mockPayments: Payment[] = [
    {
      paymentId: "PAY-1042",
      appointmentId: "apt-1042",
      patientId: "patient-1",
      doctorId: "doc-1",
      amount: 150,
      status: "paid",
      paymentMethod: "Credit Card",
      transactionDate: "2026-09-04T08:00:00",
      settlementStatus: "settled",
    },
    {
      paymentId: "PAY-1044",
      appointmentId: "apt-1044",
      patientId: "patient-1",
      doctorId: "doc-unknown",
      amount: 50,
      status: "paid",
      paymentMethod: "UPI",
      transactionDate: "2026-09-05T10:00:00",
      settlementStatus: "pending",
    },
    {
      paymentId: "PAY-1045",
      appointmentId: "apt-1045",
      patientId: "patient-1",
      doctorId: "doc-1",
      amount: 150,
      status: "refunded",
      paymentMethod: "Credit Card",
      transactionDate: "2026-09-06T13:00:00",
      settlementStatus: "settled",
    }
  ];
  localStorage.setItem("schedula_payments", JSON.stringify(mockPayments));
  return mockPayments;
}

export function processPayment(payment: Omit<Payment, "paymentId" | "transactionDate" | "settlementStatus" | "status">): Payment {
  const existing = getPayments();
  const newPayment: Payment = {
    ...payment,
    paymentId: "PAY-" + Math.floor(Math.random() * 100000),
    status: "paid",
    transactionDate: new Date().toISOString(),
    settlementStatus: "pending",
  };
  
  existing.push(newPayment);
  localStorage.setItem("schedula_payments", JSON.stringify(existing));
  window.dispatchEvent(new Event("schedula_payments_updated"));
  return newPayment;
}

export function getDoctorRevenue(doctorId: string) {
  const allPayments = getPayments().filter(p => p.doctorId === doctorId);
  const paidPayments = allPayments.filter(p => p.status === "paid");
  
  const totalCompleted = paidPayments.length;
  const todayStr = new Date().toISOString().split("T")[0];
  const thisMonthStr = todayStr.substring(0, 7);
  
  const todaysEarnings = paidPayments
    .filter(p => p.transactionDate.startsWith(todayStr))
    .reduce((sum, p) => sum + p.amount, 0);
    
  const monthlyEarnings = paidPayments
    .filter(p => p.transactionDate.startsWith(thisMonthStr))
    .reduce((sum, p) => sum + p.amount, 0);
    
  const pendingSettlements = paidPayments
    .filter(p => p.settlementStatus === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
    
  return {
    totalCompleted,
    todaysEarnings,
    monthlyEarnings,
    pendingSettlements,
    payments: allPayments
  };
}
