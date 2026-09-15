"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import type { Appointment } from "@/types/appointment";
import { processPayment, Payment } from "@/lib/payment-store";
import { updateAppointmentData } from "@/store/slices/appointmentSlice";

type DemoPaymentProps = {
  appointment: Appointment;
  onComplete: () => void;
};

export function DemoPayment({ appointment, onComplete }: DemoPaymentProps) {
  const dispatch = useDispatch();
  const [paymentState, setPaymentState] = useState<"pending" | "processing" | "success" | "failed" | "cancelled">("pending");
  const [paymentDetails, setPaymentDetails] = useState<Payment | null>(null);

  const fee = appointment.consultationFee || 150; // Fallback if missing

  const handlePay = () => {
    setPaymentState("processing");

    // Simulate network delay for payment processing
    setTimeout(() => {
      try {
        const payment = processPayment({
          appointmentId: appointment.id,
          patientId: appointment.patient.name,
          doctorId: appointment.doctorId,
          amount: fee,
          paymentMethod: "Credit Card (Demo)",
        });

        dispatch(updateAppointmentData({
          id: appointment.id,
          data: {
            paymentStatus: "paid",
            paymentId: payment.paymentId,
            status: "confirmed" // Also confirm the appointment automatically on payment
          }
        }));

        setPaymentDetails(payment);
        setPaymentState("success");
      } catch (e) {
        setPaymentState("failed");
      }
    }, 1500);
  };

  const handleCancel = () => {
    setPaymentState("cancelled");
    dispatch(updateAppointmentData({
      id: appointment.id,
      data: {
        paymentStatus: "failed", // or cancelled
      }
    }));
  };

  if (paymentState === "success" && paymentDetails) {
    return (
      <div className="rounded-2xl border border-success/20 bg-success/5 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-success text-white mb-5 shadow-sm">
          <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Payment Successful</h2>
        <p className="text-center text-sm text-slate-500 mb-8">Appointment confirmed successfully.</p>
        
        <div className="bg-white rounded-xl border border-border p-5 text-sm space-y-4 shadow-sm">
          <div className="flex justify-between pb-3 border-b border-border/50">
            <span className="text-slate-500 font-medium">Payment ID</span>
            <span className="font-mono font-bold text-slate-700">{paymentDetails.paymentId}</span>
          </div>
          <div className="flex justify-between pb-3 border-b border-border/50">
            <span className="text-slate-500 font-medium">Appointment ID</span>
            <span className="font-mono font-bold text-slate-700">{appointment.id}</span>
          </div>
          <div className="flex justify-between pb-3 border-b border-border/50">
            <span className="text-slate-500 font-medium">Doctor</span>
            <span className="font-bold text-slate-700">{appointment.clinician}</span>
          </div>
          <div className="flex justify-between pb-3 border-b border-border/50">
            <span className="text-slate-500 font-medium">Date & Time</span>
            <span className="font-bold text-slate-700 text-right">
              {new Date(appointment.startsAt).toLocaleDateString()} at {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(appointment.startsAt))}
            </span>
          </div>
          <div className="flex justify-between pb-3 border-b border-border/50">
            <span className="text-slate-500 font-medium">Amount</span>
            <span className="font-bold text-slate-700">₹{fee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Payment Status</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-success">
              <span className="size-2 rounded-full bg-success"></span>
              Paid
            </span>
          </div>
        </div>
        
        <button 
          onClick={onComplete}
          className="w-full mt-6 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark"
        >
          View Appointment Details
        </button>
      </div>
    );
  }

  if (paymentState === "failed") {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/5 p-6 sm:p-8 text-center animate-in fade-in">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-error text-white mb-5">
          <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-error mb-2">Payment Failed</h2>
        <p className="text-slate-600 mb-6 text-sm">We were unable to process your demo payment. Please try again.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => setPaymentState("pending")}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark"
          >
            Try Again
          </button>
          <button 
            onClick={handleCancel}
            className="rounded-xl bg-white border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (paymentState === "cancelled") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 text-center animate-in fade-in">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Payment Cancelled</h2>
        <p className="text-slate-500 mb-6 text-sm">You have cancelled the payment process.</p>
        <button 
          onClick={onComplete}
          className="rounded-xl bg-white border border-border px-6 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100"
        >
          Return to Appointment
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-white shadow-xl shadow-[var(--color-primary)]/5 overflow-hidden">
      <div className="bg-primary/5 px-6 py-8 border-b border-primary/10 text-center relative overflow-hidden">
        <div className="absolute top-4 right-4 bg-primary text-white text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded">
          Demo Payment
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800">Complete Payment</h2>
        <p className="text-slate-500 mt-2 text-sm font-medium">Please review your appointment details and complete the demo payment.</p>
      </div>
      
      <div className="p-6 sm:p-8">
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Doctor</p>
              <p className="font-bold text-slate-800">{appointment.clinician}</p>
              <p className="text-sm text-primary font-medium">{appointment.specialty}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date & Time</p>
              <p className="font-bold text-slate-800">
                {new Date(appointment.startsAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <p className="text-sm text-slate-500 font-medium">
                {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(appointment.startsAt))}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Payment Summary</h3>
          <div className="flex justify-between mb-3">
            <span className="text-slate-500">Consultation Fee</span>
            <span className="font-medium text-slate-700">₹{fee}</span>
          </div>
          <div className="flex justify-between mb-3 text-sm text-slate-400">
            <span>Taxes & Fees</span>
            <span>₹0</span>
          </div>
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <span className="font-extrabold text-slate-800 text-lg">Total</span>
            <span className="font-extrabold text-primary text-xl">₹{fee}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={handlePay}
            disabled={paymentState === "processing"}
            className="w-full flex items-center justify-center rounded-xl bg-primary px-4 py-4 text-base font-bold text-white shadow-sm transition-all hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {paymentState === "processing" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin size-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Payment...
              </span>
            ) : (
              `Pay Now (₹${fee})`
            )}
          </button>
          
          {paymentState !== "processing" && (
            <button 
              onClick={handleCancel}
              className="w-full flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
