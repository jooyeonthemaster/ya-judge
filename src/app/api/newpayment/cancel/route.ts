import { NextRequest, NextResponse } from 'next/server';

const PORTONE_API_SECRET = 
  process.env.NEXT_PORTONE_API_SECRET || 
  process.env.PORTONE_API_SECRET || 
  process.env.API_SECRET;

export async function POST(request: NextRequest) {
  try {
    const { paymentId, reason } = await request.json();

    // Validate required fields
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Import Firebase functions
    const { database } = await import('@/lib/firebase');
    const { ref, get, update } = await import('firebase/database');

    if (!database) {
      console.error('Firebase database is not initialized');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Find the payment in global payments structure
    const paymentsRef = ref(database, 'payment');
    const paymentsSnapshot = await get(paymentsRef);
    
    if (!paymentsSnapshot.exists()) {
      return NextResponse.json(
        { error: 'No payments found' },
        { status: 404 }
      );
    }

    const paymentsData = paymentsSnapshot.val();
    let paymentFound = false;
    let paymentPath = '';
    let paymentData: any = null;

    // Search for the payment across all dates
    Object.keys(paymentsData).forEach(date => {
      const dayPayments = paymentsData[date];
      if (dayPayments[paymentId]) {
        paymentFound = true;
        paymentPath = `payment/${date}/${paymentId}`;
        paymentData = dayPayments[paymentId];
      }
    });

    if (!paymentFound || !paymentData) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if payment is already cancelled
    if (paymentData.paymentStatus?.toLowerCase() === 'cancelled') {
      return NextResponse.json(
        { error: 'Payment is already cancelled' },
        { status: 400 }
      );
    }

    // Cancel payment with PortOne first
    let portOneCancelSuccess = false;
    
    if (PORTONE_API_SECRET) {
      try {
        //console.log('Attempting PortOne cancellation for payment:', paymentId);
        
        const portOneResponse = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `PortOne ${PORTONE_API_SECRET}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: reason || 'Cancelled by admin'
          }),
        });

        if (!portOneResponse.ok) {
          const portOneError = await portOneResponse.json();
          console.error('PortOne cancellation failed:', portOneError);
          
          // If PortOne cancellation fails, still allow manual cancellation for admin purposes
          console.warn('Proceeding with manual cancellation despite PortOne API failure');
        } else {
          const portOneResult = await portOneResponse.json();
          //console.log('PortOne payment cancelled successfully:', portOneResult);
          portOneCancelSuccess = true;
        }
      } catch (portOneError) {
        console.error('PortOne API request failed:', portOneError);
        // Continue with manual cancellation even if PortOne API fails
        console.warn('Proceeding with manual cancellation despite PortOne API error');
      }
    } else {
      console.warn('PortOne API secret not configured - skipping PortOne cancellation');
    }

    // Update payment status to cancelled in Firebase
    const updateData = {
      paymentStatus: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      cancelReason: reason || 'Cancelled by admin',
      originalStatus: paymentData.paymentStatus || 'unknown',
      portOneCancelled: portOneCancelSuccess, // Flag to indicate if PortOne cancellation succeeded
      portOneAttempted: PORTONE_API_SECRET ? true : false // Flag to indicate if we attempted PortOne cancellation
    };

    const paymentUpdateRef = ref(database, paymentPath);
    await update(paymentUpdateRef, updateData);

    // Also update room-specific data if it exists
    if (paymentData.roomId && paymentData.username) {
      try {
        // Update paidUsers
        const roomPaidUserRef = ref(database, `rooms/${paymentData.roomId}/paidUsers/${paymentData.username}`);
        const roomPaidUserSnapshot = await get(roomPaidUserRef);
        
        if (roomPaidUserSnapshot.exists()) {
          await update(roomPaidUserRef, {
            paymentStatus: 'CANCELLED',
            isPaid: false,
            cancelledAt: new Date().toISOString(),
            cancelReason: reason || 'Cancelled by admin'
          });
        }

        // Update orders
        const roomOrderRef = ref(database, `rooms/${paymentData.roomId}/orders/${paymentId}`);
        const roomOrderSnapshot = await get(roomOrderRef);
        
        if (roomOrderSnapshot.exists()) {
          await update(roomOrderRef, {
            paymentStatus: 'CANCELLED',
            cancelledAt: new Date().toISOString(),
            cancelReason: reason || 'Cancelled by admin'
          });
        }

        //console.log('Updated room-specific payment data for cancellation');
      } catch (roomError) {
        console.error('Error updating room-specific data:', roomError);
        // Don't fail the entire operation if room update fails
      }
    }

    // console.log('Payment cancelled successfully:', {
    //   paymentId,
    //   path: paymentPath,
    //   reason: reason || 'Cancelled by admin',
    //   timestamp: new Date().toISOString()
    // });

    const responseMessage = portOneCancelSuccess 
      ? 'Payment cancelled successfully in both PortOne and database'
      : PORTONE_API_SECRET 
        ? 'Payment cancelled in database (PortOne cancellation failed but proceeding)'
        : 'Payment cancelled in database (PortOne API not configured)';

    return NextResponse.json({
      success: true,
      message: responseMessage,
      paymentId,
      cancelledAt: updateData.cancelledAt,
      portOneCancelled: portOneCancelSuccess,
      portOneAttempted: PORTONE_API_SECRET ? true : false
    });

  } catch (error) {
    console.error('Payment cancellation error:', error);
    return NextResponse.json(
      { error: `Failed to cancel payment: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 