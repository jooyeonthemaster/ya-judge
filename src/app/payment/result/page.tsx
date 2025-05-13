"use client";

import { useEffect, useState } from "react";
import { usePaymentStore } from "@/app/store/paymentStore";

export default function PaymentResultPage() {
  const paymentResult = usePaymentStore((state) => state.paymentResult);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Just a short delay to simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="max-w-2xl mx-auto p-6">Loading...</div>;
  }

  if (!paymentResult) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">No Payment Data Found</h1>
        <p>It looks like there is no recent payment information to display.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Payment Result</h1>
      <div className="bg-gray-50 p-6 rounded-lg shadow">
        <div className="mb-2"><strong>Order Name:</strong> {paymentResult.orderName}</div>
        <div className="mb-2"><strong>Payment ID:</strong> {paymentResult.paymentId}</div>
        <div className="mb-2"><strong>Amount:</strong> {paymentResult.amount} KRW</div>
        <div className="mb-2"><strong>Status:</strong> {paymentResult.paymentStatus}</div>
        <div className="mb-2"><strong>Payment Method:</strong> {paymentResult.paymentMethod}</div>
        <div className="mb-2"><strong>Customer Name:</strong> {paymentResult.customerName}</div>
        <div className="mb-2"><strong>Email:</strong> {paymentResult.customerEmail}</div>
        <div className="mb-2"><strong>Phone:</strong> {paymentResult.customerPhone}</div>
        <div className="mb-2"><strong>Timestamp:</strong> {new Date(paymentResult.timestamp).toLocaleString()}</div>
      </div>
    </div>
  );
} 