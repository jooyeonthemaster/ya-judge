# Portone v2 Payment Integration for Next.js

This guide explains how to integrate Portone v2 payment gateway into a Next.js application.

## 1. Prerequisites

1. Sign up for a Portone account at [Portone Admin Console](https://admin.portone.io/)
2. Create a test channel for the payment method you want to implement (KG이니시스, 카카오페이, etc.)
3. Get your Store ID, Channel Key, and API Secret from the Portone admin console

## 2. Installation

Install the official Portone browser SDK:

```bash
npm install @portone/browser-sdk
# or
yarn add @portone/browser-sdk
# or
pnpm add @portone/browser-sdk
```

## 3. Setup Environment Variables

Create a `.env.local` file in your Next.js project root with the following:

```
NEXT_PUBLIC_PORTONE_STORE_ID=your-store-id
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=your-channel-key
PORTONE_API_SECRET=your-api-secret
```

## 4. Project Structure

The integration consists of the following components:

1. **Payment API Routes**:
   - `/app/api/payment/initialize/route.ts` - Initializes payment data
   - `/app/api/payment/complete/route.ts` - Verifies and completes payment
   - `/app/api/payment/record/route.ts` - Records successful payment data

2. **Frontend Components**:
   - `/app/payment/checkout/page.tsx` - Checkout page with payment form
   - `/app/payment/result/page.tsx` - Payment result page for redirects
   - `/components/PortonePayment.tsx` - Reusable payment component

3. **Utilities**:
   - `/lib/portone.ts` - Helper functions for Portone integration

## 5. Implementation Flow

The payment flow follows these steps:

1. **User enters checkout information** (personal details, order details, etc.)
2. **Frontend calls payment initialization endpoint** to create payment data
3. **Portone SDK is initialized** with the payment data
4. **User completes payment** in the Portone payment window
5. **User is redirected** to the payment result page
6. **Backend verifies payment** with Portone API
7. **Payment is recorded** in your system

## 6. Testing

Portone provides test payment methods that you can use during development:

### Test Cards
- Card Number: 4242-4242-4242-4242
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- Password: Any 2 digits (e.g., 11)

### Kakao Pay
- Scan the QR code that appears
- Test payments will not charge your actual account

## 7. Production Deployment

Before deploying to production:

1. Create a production channel in the Portone admin console
2. Update your environment variables for the production environment
3. Thoroughly test the payment flow
4. Ensure your backend securely handles payment verification

## 8. Common Issues

### CORS Errors
If you're experiencing CORS errors during payment verification, ensure your API routes properly handle CORS headers.

### Payment Verification Failures
Double-check that your API Secret is correct and that you're using the proper endpoint format when verifying payments.

### SDK Loading Issues
If the Portone SDK fails to load, ensure you're using the client-side component pattern with the 'use client' directive.

## 9. Resources

- [Portone Official Documentation](https://developers.portone.io/api/rest-v2)
- [Portone GitHub](https://github.com/portone)
- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## 10. Support

For issues related to Portone integration, contact Portone support at support@portone.io. 