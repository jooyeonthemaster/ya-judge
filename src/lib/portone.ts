/**
 * Portone v2 integration utility module
 * 
 * This module provides helper functions for integrating with Portone v2 payment gateway
 */

import PortOne, { PaymentRequest } from "@portone/browser-sdk/v2";

// Type alias for PaymentRequest from the Portone SDK
export type PortonePaymentOptions = PaymentRequest;

/**
 * Customer information for payment
 */
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

/**
 * Payment details for Portone
 */
export interface PaymentDetails {
  orderName: string;
  totalAmount: number;
  payMethod: string;
}

export async function requestPayment(
  customer: CustomerInfo,
  payment: PaymentDetails
) {
  // Generate payment ID using timestamp and random string (max 40 chars)
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString().slice(-10);
  const paymentId = `ord_${timestamp}_${randomPart}`;
  
  // Create payment request
  const paymentRequest: PaymentRequest = {
    storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "",
    channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "",
    paymentId: paymentId,
    orderName: payment.orderName,
    totalAmount: payment.totalAmount,
    currency: "CURRENCY_KRW",
    payMethod: payment.payMethod as PaymentRequest["payMethod"],
    customer: {
      fullName: customer.name,
      email: customer.email,
      phoneNumber: customer.phone,
    },
    redirectUrl: window.location.origin + '/payment/result',
  };

  // Request payment with Portone
  const response = await PortOne.requestPayment(paymentRequest);

  if (response?.code != null) {
    // Error occurred
    throw new Error(response.message || 'Payment failed');
  }
  
  return {
    response,
    paymentId
  };
}

/**
 * Verifies a payment with the backend
 * @param paymentId The payment ID
 * @param orderData Order data to verify
 * @returns Response from the payment verification endpoint
 */
export async function verifyPayment(
  paymentId: string,
  orderData: any
): Promise<{ status: string; message?: string }> {
  try {
    const verifyPayload = {
      paymentId,
      orderData
    };
    
    console.log('Sending payment verification data to server:', JSON.stringify(verifyPayload, null, 2));
    
    const verifyResponse = await fetch('/api/payment/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyPayload),
    });

    return await verifyResponse.json();
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { status: 'error', message: 'Failed to verify payment' };
  }
}


export async function recordPayment(
  paymentResult: any,
  apiEndpoint: string = 'https://perfume-maker.pixent.co.kr/api/v3/payment/record'
): Promise<Response> {
  try {
    // Send the payment result to the backend to record the payment
    console.log('Sending payment record to external API:', JSON.stringify(paymentResult, null, 2));
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentResult),
    });
    
    return response;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
} 