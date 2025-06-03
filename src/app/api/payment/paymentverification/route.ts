import { NextRequest, NextResponse } from 'next/server';

// Try multiple ways to access the environment variable
const PORTONE_API_SECRET = 
  process.env.NEXT_PORTONE_API_SECRET || 
  process.env.PORTONE_API_SECRET || 
  process.env.API_SECRET;

/**
 * This API route verifies payments with Portone API using just the payment ID
 * It's used primarily for handling mobile redirects where session data might be lost
 */
export async function GET(request: NextRequest) {
  try {
    // Get the payment ID and transaction ID from query parameters
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const txId = searchParams.get('txId');

    // Log request source information
    const userAgent = request.headers.get('user-agent') || '';
    const isMobileRequest = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
    
    console.log('=== PAYMENT VERIFICATION REQUEST INFO ===');
    console.log('Request type:', isMobileRequest ? 'MOBILE BROWSER' : 'PC BROWSER');
    console.log('User Agent:', userAgent);
    console.log('Payment ID:', paymentId);
    console.log('Transaction ID:', txId || 'N/A');
    console.log('==========================================');

    if (!paymentId) {
      return NextResponse.json({
        status: 'error',
        message: 'Payment ID is required'
      }, { status: 400 });
    }

    console.log(`Verifying payment by ID: ${paymentId}, txId: ${txId || 'N/A'}`);

    // More explicit error with all env var attempts
    if (!PORTONE_API_SECRET) {
      console.error('API Secret not found in any environment variable:',
        'NEXT_PORTONE_API_SECRET, PORTONE_API_SECRET, or API_SECRET');
      
      // For development purposes only - create a mock successful response
      // Remove this in production!
      console.warn('Creating mock success response for development');
      return NextResponse.json({
        status: 'success',
        message: 'Payment verification bypassed in development',
        payment: {
          paymentId,
          amount: 1000,
          orderName: 'Test Order',
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
          customerPhone: '010-1234-5678',
          method: 'CARD',
          status: 'PAID'
        }
      });
    }

    // 1. Query the Portone API to check payment status
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

    // Log the complete payment response from Portone API
    console.log('=== FULL PORTONE API RESPONSE ===');
    console.log('Raw payment object:', JSON.stringify(payment, null, 2));
    console.log('Payment status:', payment.status);
    console.log('Payment method object:', JSON.stringify(payment.method, null, 2));
    console.log('Payment amount object:', JSON.stringify(payment.amount, null, 2));
    console.log('Payment customer object:', JSON.stringify(payment.customer, null, 2));
    console.log('================================');

    // 2. Check the payment status
    switch (payment.status) {
      case 'VIRTUAL_ACCOUNT_ISSUED': {
        // Handle virtual account issued case
        const virtualAccountData = {
          paymentId: payment.paymentId,
          amount: payment.amount.total,
          orderName: payment.orderName,
          customerName: payment.customer?.fullName || '',
          customerEmail: payment.customer?.email || '',
          customerPhone: payment.customer?.phoneNumber || '',
          method: payment.method,
          status: payment.status
        };

        console.log('Virtual Account data to save in database:', JSON.stringify(virtualAccountData, null, 2));
        console.log('Browser type for this Virtual Account:', isMobileRequest ? 'MOBILE' : 'PC');

        return NextResponse.json({
          status: 'pending',
          message: 'Virtual account has been issued',
          payment: virtualAccountData
        });
      }
      case 'PAID': {
        // Handle successful payment
        const paymentData = {
          paymentId: payment.paymentId,
          amount: payment.amount.total,
          orderName: payment.orderName,
          customerName: payment.customer?.fullName || '',
          customerEmail: payment.customer?.email || '',
          customerPhone: payment.customer?.phoneNumber || '',
          method: payment.method,
          status: payment.status
        };

        console.log('Payment data to save in database:', JSON.stringify(paymentData, null, 2));
        console.log('Browser type for this Payment:', isMobileRequest ? 'MOBILE' : 'PC');

        return NextResponse.json({
          status: 'success',
          message: 'Payment completed successfully',
          payment: paymentData
        });
      }
      default: {
        // Handle other payment statuses (failed, cancelled, etc.)
        const failedPaymentData = {
          paymentId: payment.paymentId,
          amount: payment.amount?.total || 0,
          orderName: payment.orderName || '',
          customerName: payment.customer?.fullName || '',
          customerEmail: payment.customer?.email || '',
          customerPhone: payment.customer?.phoneNumber || '',
          method: payment.method,
          status: payment.status
        };

        console.log('Failed/Other payment data for reference:', JSON.stringify(failedPaymentData, null, 2));
        console.log('Browser type for this Failed/Other payment:', isMobileRequest ? 'MOBILE' : 'PC');

        return NextResponse.json({
          status: 'failed',
          message: `Payment status: ${payment.status}`,
          payment: null
        }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 