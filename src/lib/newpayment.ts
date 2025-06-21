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
  productType?: 'REAL' | 'DIGITAL'; // Required for mobile payments
  carrier?: 'SKT' | 'KT' | 'LGU' | 'MVNO'; // Optional for mobile payments
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
  
  // Validate required environment variables
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
  
  if (!storeId) {
    throw new Error('NEXT_PUBLIC_PORTONE_STORE_ID environment variable is required');
  }
  
  if (!channelKey) {
    throw new Error('NEXT_PUBLIC_PORTONE_CHANNEL_KEY environment variable is required');
  }
  
  // Generate payment ID using timestamp and random string (max 40 chars)
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString().slice(-10);
  const paymentId = `ord_${timestamp}_${randomPart}`;
  
  // Base payment request configuration
  const basePaymentRequest: PaymentRequest = {
    storeId: storeId,
    channelKey: channelKey,
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
    redirectUrl: window.location.origin + '/newpayment/result',
  };

  // Add method-specific configurations
  let paymentRequest: PaymentRequest = { ...basePaymentRequest };

  // Add bypass parameters for mobile payments (KCP V2 requirement)
  if (payment.payMethod === 'MOBILE') {
    paymentRequest = {
      ...basePaymentRequest,
      bypass: {
        // KCP V2 requires shop_user_id for mobile payments
        shop_user_id: customer.email || customer.phone || paymentId,
        // Add product type information for mobile payments (always DIGITAL for this service)
        digital: '1' // Always digital content for this service
        // Carrier will be selected by user in payment modal
      } as any // Type assertion to handle KCP-specific bypass parameters
    };
  }

  // console.log('=== PAYMENT INITIALIZATION ===');
  // console.log('Store ID:', storeId ? `${storeId.substring(0, 8)}...` : 'NOT SET');
  // console.log('Channel Key:', channelKey ? 'SET' : 'NOT SET');
  // console.log('Payment ID:', paymentId);
  // console.log('Order Name:', payment.orderName);
  // console.log('Amount:', payment.totalAmount);
  // console.log('Customer:', customer.name);
  // console.log('Pay Method:', payment.payMethod);
  // console.log('Product Type:', payment.payMethod === 'MOBILE' ? 'DIGITAL (auto)' : 'N/A');
  // console.log('Carrier:', payment.payMethod === 'MOBILE' ? 'User will select' : 'N/A');
  // console.log('Mobile Browser:', isMobileBrowser());
  
  // Log bypass parameters for mobile payments
  if (payment.payMethod === 'MOBILE') {
    // console.log('=== MOBILE PAYMENT BYPASS PARAMS ===');
    // console.log('Shop User ID:', customer.email || customer.phone || paymentId);
    // console.log('Digital Product: 1 (Always digital content)');
    // console.log('Carrier: User will select in payment modal');
    // console.log('==================================');
  }
  
  // console.log('Payment Request Config:', JSON.stringify(paymentRequest, null, 2));
  // console.log('=============================');

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
  
  //console.log('Payment request successful:', response);
  
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
    
    //console.log('=== SENDING PAYMENT VERIFICATION ===');
    //console.log('Payment ID:', paymentId);
    //console.log('Order Data:', orderData);
    //console.log('===================================');
    
    const verifyResponse = await fetch('/api/newpayment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyPayload),
    });

    const result = await verifyResponse.json();
    
    //console.log('=== PAYMENT VERIFICATION RESULT ===');
    //console.log('Status:', result.status);
    //console.log('Message:', result.message);
    if (result.payment) {
      //console.log('Payment Data:', result.payment);
    }
    //console.log('=================================');
    
    return result;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { status: 'error', message: 'Failed to verify payment' };
  }
}

/**
 * Save payment completion to Firebase instead of external API call
 * This replaces the external API recording functionality
 */
export async function logPaymentCompletion(
  paymentResult: PaymentResult,
  roomId?: string,
  username?: string,
  isHost?: boolean
): Promise<void> {
  try {
    // Import Firebase functions
    const { database } = await import('./firebase');
    const { ref, set } = await import('firebase/database');
    
    if (!database) {
      console.error('Firebase database not initialized');
      return;
    }

    // Create payment date for the path (YYYY-MM-DD format)
    const paymentDate = new Date(paymentResult.timestamp).toISOString().split('T')[0];
    
    // Create the Firebase path: /payment/{paymentdate}/{paymentId}
    const paymentPath = `payment/${paymentDate}/${paymentResult.paymentId}`;
    const paymentRef = ref(database, paymentPath);
    
    // Prepare payment data to save
    const paymentData = {
      ...paymentResult,
      savedAt: new Date().toISOString(),
      roomId: roomId || null,
      username: username || null,
      isHost: isHost || false,
      browser: {
        isMobile: isMobileBrowser(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
      }
    };
    
    // Save to global Firebase path
    await set(paymentRef, paymentData);
    
    //console.log('=== PAYMENT SAVED TO FIREBASE (GLOBAL) ===');
    //console.log('Firebase Path:', paymentPath);
    //console.log('Payment ID:', paymentResult.paymentId);
    //console.log('Amount:', paymentResult.amount);
    //console.log('Customer Name:', paymentResult.customerName);
    //console.log('Payment Status:', paymentResult.paymentStatus);
    //console.log('Room ID:', roomId || 'N/A');
    //console.log('Username:', username || 'N/A');
    //console.log('Is Host:', isHost || false);
    //console.log('Timestamp:', paymentResult.timestamp);
    //console.log('=========================================');

    // CRITICAL: Also save to room-specific path with order ID for both host and non-host users
    if (roomId && username) {
      try {
        // Save payment information to room's paidUsers structure with order ID
        const roomPaidUserRef = ref(database, `rooms/${roomId}/paidUsers/${username}`);
        const roomPaymentData = {
          username: username,
          isPaid: true,
          paymentId: paymentResult.paymentId, // This is the order ID
          orderId: paymentResult.paymentId,   // Explicit order ID field
          amount: paymentResult.amount,
          orderName: paymentResult.orderName,
          paymentMethod: paymentResult.paymentMethod,
          timestamp: paymentResult.timestamp,
          isHost: isHost || false,
          paymentStatus: paymentResult.paymentStatus
        };

        await set(roomPaidUserRef, roomPaymentData);

        //console.log('=== PAYMENT SAVED TO FIREBASE (ROOM-SPECIFIC) ===');
        //console.log('Room Path:', `rooms/${roomId}/paidUsers/${username}`);
        //console.log('Username:', username);
        //console.log('Order ID:', paymentResult.paymentId);
        //console.log('Amount:', paymentResult.amount);
        //console.log('Is Host:', isHost || false);
        //console.log('Payment Status:', paymentResult.paymentStatus);
        //console.log('===============================================');

        // Also save a separate entry in room's orders for easier order tracking
        const roomOrderRef = ref(database, `rooms/${roomId}/orders/${paymentResult.paymentId}`);
        const orderData = {
          orderId: paymentResult.paymentId,
          paymentId: paymentResult.paymentId,
          username: username,
          customerName: paymentResult.customerName,
          amount: paymentResult.amount,
          orderName: paymentResult.orderName,
          paymentMethod: paymentResult.paymentMethod,
          paymentStatus: paymentResult.paymentStatus,
          timestamp: paymentResult.timestamp,
          isHost: isHost || false,
          savedAt: new Date().toISOString()
        };

        await set(roomOrderRef, orderData);

        // console.log('=== ORDER SAVED TO FIREBASE (ROOM ORDERS) ===');
        // console.log('Room Order Path:', `rooms/${roomId}/orders/${paymentResult.paymentId}`);
        // console.log('Order ID:', paymentResult.paymentId);
        // console.log('Username:', username);
        // console.log('Is Host:', isHost || false);
        // console.log('==========================================');

      } catch (roomError) {
        console.error('Error saving payment to room-specific Firebase paths:', roomError);
        // Don't throw - let the global save succeed even if room save fails
      }
    } else {
      console.warn('⚠️ Room ID or username not provided - payment saved to global path only');
      console.warn('   Room ID:', roomId || 'NOT PROVIDED');
      console.warn('   Username:', username || 'NOT PROVIDED');
    }
    
  } catch (error) {
    console.error('Error saving payment to Firebase:', error);
    
    // Fallback to logging if Firebase save fails
    // console.log('=== PAYMENT COMPLETION (FALLBACK LOG) ===');
    // console.log('Payment ID:', paymentResult.paymentId);
    // console.log('Amount:', paymentResult.amount);
    // console.log('Order Name:', paymentResult.orderName);
    // console.log('Customer Name:', paymentResult.customerName);
    // console.log('Customer Email:', paymentResult.customerEmail);
    // console.log('Customer Phone:', paymentResult.customerPhone);
    // console.log('Payment Status:', paymentResult.paymentStatus);
    // console.log('Payment Method:', paymentResult.paymentMethod);
    // console.log('Timestamp:', paymentResult.timestamp);
    // console.log('Room ID:', roomId || 'N/A');
    // console.log('Username:', username || 'N/A');
    // console.log('Is Host:', isHost || false);
    // console.log('Mobile Browser:', isMobileBrowser());
    // console.log('=======================================');
  }
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