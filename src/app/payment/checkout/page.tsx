"use client"

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { usePaymentStore } from "@/app/store/paymentStore";
import { requestPayment, verifyPayment, recordPayment } from "@/lib/portone";
import type { CustomerInfo, PaymentDetails } from "@/lib/portone";

interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  orderName: string;
  totalAmount: number;
  payMethod: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const setPaymentResult = usePaymentStore((state) => state.setPaymentResult);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    orderName: "Test Order",
    totalAmount: 1000,
    payMethod: "CARD",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalAmount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Extract customer and payment information from form data
      const customer: CustomerInfo = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      };
      
      const payment: PaymentDetails = {
        orderName: formData.orderName,
        totalAmount: formData.totalAmount,
        payMethod: formData.payMethod
      };
      
      // Request payment using the extracted function
      const { paymentId } = await requestPayment(customer, payment);
      
      // Verify the payment with the backend
      const verificationResult = await verifyPayment(paymentId, {
        ...formData,
        totalAmount: formData.totalAmount
      });

      console.log('Payment verification response:', verificationResult);

      if (verificationResult.status === 'success') {
        // Prepare payment record data
        const paymentRecord = {
          paymentId: paymentId,
          amount: formData.totalAmount,
          orderName: formData.orderName,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          paymentStatus: 'SUCCESS',
          paymentMethod: formData.payMethod,
          timestamp: new Date().toISOString()
        };
        
        try {
          // Record the payment to external API
          const externalResponse = await recordPayment(paymentRecord);
          
          if (externalResponse.ok) {
            console.log('Payment successful and recorded to external API!', {
              paymentId,
              amount: formData.totalAmount,
              orderName: formData.orderName
            });
            alert('Payment successful!');
            // Store payment data in Zustand store
            setPaymentResult(paymentRecord);
            // Redirect to result page
            router.push('/payment/result');
          } else {
            console.error('Failed to record payment to external API');
          }
        } catch (error) {
          console.error('Error recording payment to external API:', error);
        }
      } else {
        // Payment verification failed
        console.error('Payment verification failed:', verificationResult.message);
        alert(`Payment failed: ${verificationResult.message}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="orderName" className="block text-sm font-medium text-gray-700 mb-1">
                Order Name
              </label>
              <input
                id="orderName"
                name="orderName"
                type="text"
                required
                value={formData.orderName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount (KRW)
              </label>
              <input
                id="totalAmount"
                name="totalAmount"
                type="number"
                min="1000"
                required
                value={formData.totalAmount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
          <div>
            <label htmlFor="payMethod" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              id="payMethod"
              name="payMethod"
              required
              value={formData.payMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="CARD">Credit Card</option>
              <option value="VIRTUAL_ACCOUNT">Virtual Account</option>
              <option value="PHONE">Mobile Phone</option>
              <option value="TRANSFER">Bank Transfer</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Processing...' : 'Complete Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
  