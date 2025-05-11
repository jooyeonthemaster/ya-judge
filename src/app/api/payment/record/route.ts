import { NextRequest, NextResponse } from 'next/server';

// Define interface for payment data
interface PaymentData {
  payment_id: string;
  merchant_uid: string;
  amount: number;
  status: string;
  method: string;
  paid_at: number;
  receipt_url?: string;
  [key: string]: any; // Allow for additional fields
}

/**
 * POST handler for recording payment data
 * This endpoint would typically store payment information in a database
 */
export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json() as PaymentData;
    
    // Validate required fields
    const requiredFields = ['payment_id', 'merchant_uid', 'amount', 'status', 'method', 'paid_at'];
    for (const field of requiredFields) {
      if (!(field in paymentData)) {
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Log the payment data (in a real application, this would be stored in a database)
    console.log('Payment recorded:', {
      payment_id: paymentData.payment_id,
      merchant_uid: paymentData.merchant_uid,
      amount: paymentData.amount,
      status: paymentData.status,
      method: paymentData.method,
      paid_at: new Date(paymentData.paid_at * 1000).toISOString(),
      receipt_url: paymentData.receipt_url || 'N/A',
    });
    
    // In a real implementation, you would:
    // 1. Verify the payment with Portone API
    // 2. Store the payment information in a database
    // 3. Update order status or trigger other business logic
    
    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to record payment' },
      { status: 500 }
    );
  }
} 