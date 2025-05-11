/**
 * Portone v2 integration utility module
 * 
 * This module provides helper functions for integrating with Portone v2 payment gateway
 */

import { PaymentRequest } from "@portone/browser-sdk/v2";

// Type alias for PaymentRequest from the Portone SDK
export type PortonePaymentOptions = PaymentRequest;

// We don't directly import the SDK to avoid server-side rendering issues
// In a component, use:
// import { loadPortone } from "@portone/browser-sdk/v2";

/**
 * Records a payment with the backend service
 * @param paymentResult The payment result from Portone
 * @param apiEndpoint Your backend API endpoint (defaults to localhost:8080 for the demo)
 * @returns Response from the payment record endpoint
 */
export async function recordPayment(
  paymentResult: any,
  apiEndpoint: string = 'https://perfume-maker.pixent.co.kr/api/v3/payment/record'
): Promise<Response> {
  try {
    // Send the payment result to the backend to record the payment
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