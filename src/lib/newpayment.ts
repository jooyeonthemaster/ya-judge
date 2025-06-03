/**
 * Clean PortOne v2 integration utility module
 * 
 * This module provides simplified helper functions for integrating with PortOne v2
 * without external API calls, focusing on local logging and verification
 */

import PortOne, { PaymentRequest } from "@portone/browser-sdk/v2";

// Type alias for PaymentRequest from the PortOne SDK
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
 * Payment details for PortOne
 */
export interface PaymentDetails {
  orderName: string;
  totalAmount: number;
  payMethod: string;
}

/**
 * Payment result interface
 */
export interface PaymentResult {
  paymentId: string;
  amount: number;
  orderName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentStatus: string;
  paymentMethod: string;
  timestamp: string;
}

/**
 * Detect if the current browser is a mobile browser
 */
export function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent || window.navigator.vendor || (window as any).opera;
  
  // Regular expression for mobile devices
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
  
  return mobileRegex.test(userAgent);
}

/**
 * Initialize payment request with PortOne
 */
export async function initializePayment(
  customer: CustomerInfo,
  payment: PaymentDetails
): Promise<{ paymentRequest: PaymentRequest; paymentId: string }> {
  
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

  console.log('=== PAYMENT INITIALIZATION ===');
  console.log('Payment ID:', paymentId);
  console.log('Order Name:', payment.orderName);
  console.log('Amount:', payment.totalAmount);
  console.log('Customer:', customer.name);
  console.log('Pay Method:', payment.payMethod);
  console.log('Mobile Browser:', isMobileBrowser());
  console.log('=============================');

  return { paymentRequest, paymentId };
}

/**
 * Request payment with PortOne
 */
export async function requestPayment(
  customer: CustomerInfo,
  payment: PaymentDetails
) {
  const { paymentRequest, paymentId } = await initializePayment(customer, payment);

  // Request payment with PortOne
  const response = await PortOne.requestPayment(paymentRequest);

  if (response?.code != null) {
    // Error occurred
    console.error('Payment request failed:', response.message);
    throw new Error(response.message || 'Payment failed');
  }
  
  console.log('Payment request successful:', response);
  
  return {
    response,
    paymentId
  };
}

/**
 * Verifies a payment with the clean verification endpoint
 * @param paymentId The payment ID
 * @param orderData Order data to verify
 * @returns Response from the payment verification endpoint
 */
export async function verifyPayment(
  paymentId: string,
  orderData: any
): Promise<{ status: string; message?: string; payment?: PaymentResult }> {
  try {
    const verifyPayload = {
      paymentId,
      orderData
    };
    
    console.log('=== SENDING PAYMENT VERIFICATION ===');
    console.log('Payment ID:', paymentId);
    console.log('Order Data:', orderData);
    console.log('===================================');
    
    const verifyResponse = await fetch('/api/newpayment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyPayload),
    });

    const result = await verifyResponse.json();
    
    console.log('=== PAYMENT VERIFICATION RESULT ===');
    console.log('Status:', result.status);
    console.log('Message:', result.message);
    if (result.payment) {
      console.log('Payment Data:', result.payment);
    }
    console.log('=================================');
    
    return result;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { status: 'error', message: 'Failed to verify payment' };
  }
}

/**
 * Log payment completion instead of external API call
 * This replaces the external API recording functionality
 */
export function logPaymentCompletion(
  paymentResult: PaymentResult
): void {
  console.log('=== PAYMENT COMPLETION LOGGED ===');
  console.log('Payment ID:', paymentResult.paymentId);
  console.log('Amount:', paymentResult.amount);
  console.log('Order Name:', paymentResult.orderName);
  console.log('Customer Name:', paymentResult.customerName);
  console.log('Customer Email:', paymentResult.customerEmail);
  console.log('Customer Phone:', paymentResult.customerPhone);
  console.log('Payment Status:', paymentResult.paymentStatus);
  console.log('Payment Method:', paymentResult.paymentMethod);
  console.log('Timestamp:', paymentResult.timestamp);
  console.log('Mobile Browser:', isMobileBrowser());
  console.log('===============================');
  
  // In a real application, you would save this to a database
  // For now, we're just logging as requested
}

/**
 * Create payment result object from PortOne response
 */
export function createPaymentResult(
  paymentId: string,
  customer: CustomerInfo,
  payment: PaymentDetails,
  status: string = 'COMPLETED'
): PaymentResult {
  return {
    paymentId,
    amount: payment.totalAmount,
    orderName: payment.orderName,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    paymentStatus: status,
    paymentMethod: payment.payMethod,
    timestamp: new Date().toISOString()
  };
} 