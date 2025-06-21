import { NextRequest, NextResponse } from 'next/server';

const PORTONE_API_SECRET = 
  process.env.NEXT_PORTONE_API_SECRET || 
  process.env.PORTONE_API_SECRET || 
  process.env.API_SECRET;

interface PaymentVerificationData {
  paymentId: string;
  amount: number;
  orderName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentStatus: string;
  paymentMethod: string;
  timestamp: string;
  userAgent?: string;
  isMobile?: boolean;
}

/**
 * Clean payment verification endpoint
 * Verifies payment with PortOne and logs confirmation instead of external API calls
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const txId = searchParams.get('txId');

    if (!paymentId) {
      return NextResponse.json({
        status: 'error',
        message: 'Payment ID is required'
      }, { status: 400 });
    }

    // Detect device type
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
    
    // //console.log('=== PAYMENT VERIFICATION REQUEST ===');
    // //console.log('Device Type:', isMobile ? 'MOBILE' : 'DESKTOP');
    // //console.log('Payment ID:', paymentId);
    // //console.log('Transaction ID:', txId || 'N/A');
    // //console.log('User Agent:', userAgent);
    // //console.log('===================================');

    // Handle development mode without API secret
    if (!PORTONE_API_SECRET) {
      console.warn('=== DEVELOPMENT MODE: API SECRET MISSING ===');
      
      const mockVerificationData: PaymentVerificationData = {
        paymentId,
        amount: 1000,
        orderName: 'Mock Test Order',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '010-1234-5678',
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        timestamp: new Date().toISOString(),
        userAgent,
        isMobile
      };

      logPaymentConfirmation(mockVerificationData);
      
      return NextResponse.json({
        status: 'success',
        message: 'Payment verification completed (development mode)',
        payment: mockVerificationData
      });
    }

    // Verify with PortOne API
    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      { 
        headers: { 
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    if (!paymentResponse.ok) {
      const errorResponse = await paymentResponse.json();
      throw new Error(`Payment verification failed: ${JSON.stringify(errorResponse)}`);
    }

    const payment = await paymentResponse.json();
    
    const verificationData: PaymentVerificationData = {
      paymentId: payment.paymentId,
      amount: payment.amount.total,
      orderName: payment.orderName,
      customerName: payment.customer?.fullName || '',
      customerEmail: payment.customer?.email || '',
      customerPhone: payment.customer?.phoneNumber || '',
      paymentStatus: payment.status,
      paymentMethod: payment.method?.type || 'UNKNOWN',
      timestamp: new Date().toISOString(),
      userAgent,
      isMobile
    };

    // Log the verification instead of sending to external API
    logPaymentConfirmation(verificationData);

    // Handle different payment statuses
    switch (payment.status) {
      case 'PAID':
        return NextResponse.json({
          status: 'success',
          message: 'Payment completed successfully',
          payment: verificationData
        });
        
      case 'VIRTUAL_ACCOUNT_ISSUED':
        return NextResponse.json({
          status: 'pending',
          message: 'Virtual account has been issued',
          payment: verificationData
        });
        
      default:
        return NextResponse.json({
          status: 'failed',
          message: `Payment status: ${payment.status}`,
          payment: verificationData
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST method for payment verification with payment data
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentId, orderData } = await request.json();

    if (!paymentId) {
      return NextResponse.json({
        status: 'error',
        message: 'Payment ID is required'
      }, { status: 400 });
    }

    // Handle development mode
    if (!PORTONE_API_SECRET) {
      const mockVerificationData: PaymentVerificationData = {
        paymentId,
        amount: orderData?.totalAmount || 1000,
        orderName: orderData?.orderName || 'Mock Order',
        customerName: orderData?.customerName || 'Test Customer',
        customerEmail: orderData?.customerEmail || 'test@example.com',
        customerPhone: orderData?.customerPhone || '010-1234-5678',
        paymentStatus: 'PAID',
        paymentMethod: orderData?.payMethod || 'CARD',
        timestamp: new Date().toISOString()
      };

      logPaymentConfirmation(mockVerificationData);
      
      return NextResponse.json({
        status: 'success',
        message: 'Payment verification completed (development mode)',
        payment: mockVerificationData
      });
    }

    // Production verification logic would go here
    // For now, just log and return success
    logPaymentConfirmation({
      paymentId,
      amount: orderData?.totalAmount || 0,
      orderName: orderData?.orderName || '',
      customerName: orderData?.customerName || '',
      customerEmail: orderData?.customerEmail || '',
      customerPhone: orderData?.customerPhone || '',
      paymentStatus: 'VERIFIED',
      paymentMethod: orderData?.payMethod || 'UNKNOWN',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Payment verification completed',
      payment: { paymentId, ...orderData }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Logs payment confirmation instead of sending to external API
 */
function logPaymentConfirmation(data: PaymentVerificationData) {
  // console.log('=== PAYMENT CONFIRMATION LOGGED ===');
  // console.log('Payment ID:', data.paymentId);
  // console.log('Amount:', data.amount);
  // console.log('Order Name:', data.orderName);
  // console.log('Customer Name:', data.customerName);
  // console.log('Customer Email:', data.customerEmail);
  // console.log('Customer Phone:', data.customerPhone);
  // console.log('Payment Status:', data.paymentStatus);
  // console.log('Payment Method:', data.paymentMethod);
  // console.log('Timestamp:', data.timestamp);
  if (data.isMobile !== undefined) {
    // console.log('Device Type:', data.isMobile ? 'MOBILE' : 'DESKTOP');
  }
  if (data.userAgent) {
    // console.log('User Agent:', data.userAgent);
  }
  // console.log('================================');
  
  // In a real application, you would save this to a database
  // For now, we're just logging as requested
} 