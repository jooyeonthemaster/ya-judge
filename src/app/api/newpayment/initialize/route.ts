import { NextRequest, NextResponse } from 'next/server';

interface PaymentInitializeRequest {
  amount: number;
  orderName: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  payMethod?: string;
}

/**
 * Clean payment initialization endpoint
 * Prepares data for PortOne payment without external API calls
 */
export async function POST(request: NextRequest) {
  try {
    const body: PaymentInitializeRequest = await request.json();
    
    // Validate required fields
    const { amount, orderName, customerInfo } = body;
    
    if (!amount || !orderName || !customerInfo?.name || !customerInfo?.email || !customerInfo?.phone) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: amount, orderName, customerInfo (name, email, phone)'
      }, { status: 400 });
    }

    // Generate payment ID
    const randomPart = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString().slice(-10);
    const paymentId = `ord_${timestamp}_${randomPart}`;
    
    // Log initialization
    // //console.log('=== PAYMENT INITIALIZATION ===');
    // //console.log('Payment ID:', paymentId);
    // //console.log('Amount:', amount);
    // //console.log('Order Name:', orderName);
    // //console.log('Customer:', customerInfo);
    // //console.log('Pay Method:', body.payMethod || 'Not specified');
    // //console.log('Timestamp:', new Date().toISOString());
    // //console.log('=============================');
    
    // Return clean payment data for client
    return NextResponse.json({
      success: true,
      data: {
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
        paymentId,
        orderName,
        totalAmount: amount,
        currency: 'CURRENCY_KRW',
        customerInfo,
        payMethod: body.payMethod || 'CARD'
      }
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to initialize payment',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 