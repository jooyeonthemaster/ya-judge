# Clean Payment System

A simplified payment system that integrates with PortOne v2 and logs payment confirmations instead of sending to external APIs.

## Structure

```
src/app/api/newpayment/
├── initialize/
│   └── route.ts       # Payment initialization endpoint
├── verify/
│   └── route.ts       # Payment verification endpoint
└── README.md          # This documentation

src/lib/
└── newpayment.ts      # Clean PortOne utility functions

src/app/store/
└── newPaymentStore.ts # Payment state management
```

## Key Features

1. **Simplified Payment Flow**: Clean and straightforward payment process
2. **Local Logging**: All payment confirmations are logged to console instead of external APIs
3. **PortOne Integration**: Full integration with PortOne v2 payment gateway
4. **Mobile Detection**: Automatic mobile browser detection
5. **Error Handling**: Comprehensive error handling and logging
6. **Development Mode**: Works without API secrets for development

## API Endpoints

### POST /api/newpayment/initialize

Initializes a payment request.

**Request Body:**
```json
{
  "amount": 1000,
  "orderName": "Test Order",
  "customerInfo": {
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "010-1234-5678",
    "address": "Optional address"
  },
  "payMethod": "CARD"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "storeId": "...",
    "channelKey": "...",
    "paymentId": "ord_1234567890_abcdef12",
    "orderName": "Test Order",
    "totalAmount": 1000,
    "currency": "CURRENCY_KRW",
    "customerInfo": {...},
    "payMethod": "CARD"
  }
}
```

### GET /api/newpayment/verify?paymentId=xxx

Verifies a payment using payment ID (for mobile redirects).

### POST /api/newpayment/verify

Verifies a payment with payment data.

**Request Body:**
```json
{
  "paymentId": "ord_1234567890_abcdef12",
  "orderData": {
    "totalAmount": 1000,
    "orderName": "Test Order",
    "customerName": "Customer Name",
    "customerEmail": "customer@example.com",
    "customerPhone": "010-1234-5678",
    "payMethod": "CARD"
  }
}
```

## Usage Example

```typescript
import { 
  requestPayment, 
  verifyPayment, 
  logPaymentCompletion,
  CustomerInfo,
  PaymentDetails 
} from '@/lib/newpayment';

const customer: CustomerInfo = {
  name: "John Doe",
  email: "john@example.com",
  phone: "010-1234-5678"
};

const payment: PaymentDetails = {
  orderName: "Test Order",
  totalAmount: 1000,
  payMethod: "CARD"
};

try {
  // Request payment
  const { response, paymentId } = await requestPayment(customer, payment);
  
  // Verify payment
  const verificationResult = await verifyPayment(paymentId, {
    totalAmount: payment.totalAmount,
    orderName: payment.orderName,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    payMethod: payment.payMethod
  });
  
  if (verificationResult.status === 'success') {
    // Log completion instead of external API call
    logPaymentCompletion(verificationResult.payment);
  }
} catch (error) {
  console.error('Payment failed:', error);
}
```

## State Management

```typescript
import { 
  useNewPaymentStore, 
  usePaymentStatus, 
  usePaymentSession 
} from '@/app/store/newPaymentStore';

// In your component
const { setPaymentResult, setPaymentInProgress } = useNewPaymentStore();
const { isInProgress, isCompleted, hasError } = usePaymentStatus();
const { roomId, userName, isSessionReady } = usePaymentSession();
```

## Environment Variables

```env
NEXT_PUBLIC_PORTONE_STORE_ID=your_store_id
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=your_channel_key
NEXT_PORTONE_API_SECRET=your_api_secret
```

## Development Mode

The system works without API secrets for development purposes. When API secrets are missing, it will:

1. Create mock payment data
2. Log all interactions to console
3. Return successful responses for testing

## Logging

All payment activities are logged to the console with structured formatting:

- Payment initialization
- Payment verification requests
- Payment confirmations
- Error handling
- State changes

This replaces the external API calls and provides visibility into the payment flow.

## Migration from Old System

To migrate from the old payment system:

1. Replace imports from `@/lib/portone` with `@/lib/newpayment`
2. Replace API calls from `/api/payment/*` to `/api/newpayment/*`
3. Update store imports from `usePaymentStore` to `useNewPaymentStore`
4. Remove external API recording logic
5. Use `logPaymentCompletion()` instead of `recordPayment()` 