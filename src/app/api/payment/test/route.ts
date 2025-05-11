import { NextRequest, NextResponse } from 'next/server';

// Define interface for payment response data
interface PaymentResponseData {
  payment_id: string;
  merchant_uid: string;
  amount: number;
  status: string;
  method: string;
  paid_at: number;
  receipt_url?: string;
}

/**
 * POST handler for testing Portone v2 payment
 * This route simulates a payment completion and forwards the result to the record endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log payment request for debugging
    console.log('Payment test request received:', body);
    
    // Extract payment information from request
    const {
      merchant_uid = `mid_${Date.now()}`,
      amount = 1000,
      method = 'card',
    } = body;
    
    // Create payment response data (simulating successful payment)
    const paymentData: PaymentResponseData = {
      payment_id: `payment_${Date.now()}`,
      merchant_uid,
      amount,
      status: 'paid',
      method,
      paid_at: Math.floor(Date.now() / 1000),
    };
    
    // Forward payment data to the payment record endpoint
    try {
      const recordResponse = await fetch('http://localhost:8080/api/v3/payment/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!recordResponse.ok) {
        console.error('Failed to record payment:', await recordResponse.text());
      } else {
        console.log('Payment successfully recorded');
      }
    } catch (error) {
      console.error('Error forwarding payment data to record endpoint:', error);
    }
    
    // Return successful response
    return NextResponse.json({
      success: true,
      data: paymentData,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process payment' },
      { status: 500 }
    );
  }
} 