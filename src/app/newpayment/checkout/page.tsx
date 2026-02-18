"use client"

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNewPaymentStore, usePaymentStatus, usePaymentSession } from "@/app/store/newPaymentStore";
import { requestPayment, verifyPayment, logPaymentCompletion, isMobileBrowser, createPaymentResult } from "@/lib/newpayment";
import type { CustomerInfo, PaymentDetails } from "@/lib/newpayment";
import { getProductFromURL, type ProductConfig, type ParsedProductInfo } from "@/config/paymentProducts";
import ProductHeader from "@/components/checkout/ProductHeader";
import OrderSummary from "@/components/checkout/OrderSummary";
import CustomerForm from "@/components/checkout/CustomerForm";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import RefundPolicy from "@/components/checkout/RefundPolicy";
import CheckoutButton from "@/components/checkout/CheckoutButton";
import { AlertCircle } from "lucide-react";

interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  orderName: string;
  totalAmount: number;
  payMethod: string;
}

export default function NewCheckoutPage() {
  const router = useRouter();
  const {
    setPaymentResult,
    setPaymentInProgress,
    setPaymentCompleted,
    setPaymentError,
    clearPaymentError
  } = useNewPaymentStore();

  const { isInProgress, hasError, error } = usePaymentStatus();
  const { roomId, userName } = usePaymentSession();

  const [isMobile, setIsMobile] = useState(false);
  const [productInfo, setProductInfo] = useState<ParsedProductInfo | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    orderName: "재심 참가비",
    totalAmount: 1000,
    payMethod: "CARD",
  });

  useEffect(() => {
    setIsMobile(isMobileBrowser());

    const parsed = getProductFromURL();
    setProductInfo(parsed);
    setFormData(prev => ({
      ...prev,
      orderName: parsed.orderName,
      totalAmount: parsed.amount,
      ...(userName ? { name: userName } : {}),
    }));
  }, [userName]);

  // Clear ispaying status when user leaves payment page without completing
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (roomId) {
        try {
          const { database } = await import('@/lib/firebase');
          const { ref, remove, set } = await import('firebase/database');

          if (database) {
            const isPayingRef = ref(database, `rooms/${roomId}/ispaying`);
            await remove(isPayingRef);

            const clearSessionSignalRef = ref(database, `rooms/${roomId}/clearPaymentSession`);
            await set(clearSessionSignalRef, {
              timestamp: new Date().toISOString(),
              reason: 'newpayment_page_left',
              clearedBy: userName || 'unknown'
            });

            setTimeout(() => {
              remove(clearSessionSignalRef).catch(error => {
                console.error('Failed to remove session clear signal:', error);
              });
            }, 2000);
          }
        } catch (error) {
          console.error('Failed to clear ispaying status or send clear signal on page unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [roomId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalAmount" ? Number(value) : value,
    }));

    if (hasError) {
      clearPaymentError();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPaymentInProgress(true);
    clearPaymentError();

    try {
      const customer: CustomerInfo = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      };

      const payment: PaymentDetails = {
        orderName: formData.orderName,
        totalAmount: formData.totalAmount,
        payMethod: formData.payMethod,
        productType: formData.payMethod === 'MOBILE' ? 'DIGITAL' : undefined,
        carrier: undefined
      };

      const { paymentId } = await requestPayment(customer, payment);

      if (isMobile) {
        sessionStorage.setItem('newPaymentId', paymentId);
        sessionStorage.setItem('newOrderData', JSON.stringify(formData));
        sessionStorage.setItem('newRoomId', roomId || '');
        return;
      }

      const verificationResult = await verifyPayment(paymentId, {
        totalAmount: formData.totalAmount,
        orderName: formData.orderName,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        payMethod: formData.payMethod
      });

      if (verificationResult.status === 'success') {
        const paymentResult = createPaymentResult(paymentId, customer, payment, 'SUCCESS');

        let isHost = false;
        if (roomId && userName) {
          try {
            const { database } = await import('@/lib/firebase');
            const { ref, get } = await import('firebase/database');

            if (database) {
              const hostRef = ref(database, `rooms/${roomId}/host`);
              const hostSnapshot = await get(hostRef);

              if (hostSnapshot.exists()) {
                const hostUserId = hostSnapshot.val();

                const roomUsersRef = ref(database, `rooms/${roomId}/users`);
                const usersSnapshot = await get(roomUsersRef);

                if (usersSnapshot.exists()) {
                  const users = usersSnapshot.val();
                  const currentUserEntry = Object.entries(users).find(([userId, user]: [string, any]) =>
                    (user.username || user) === userName
                  );

                  if (currentUserEntry && currentUserEntry[0] === hostUserId) {
                    isHost = true;
                  }
                }
              }
            }
          } catch (error) {
            console.warn('Could not determine host status:', error);
          }
        }

        await logPaymentCompletion(paymentResult, roomId || undefined, userName || undefined, isHost);

        if (roomId) {
          try {
            const { database } = await import('@/lib/firebase');
            const { ref, remove } = await import('firebase/database');

            if (database) {
              const isPayingRef = ref(database, `rooms/${roomId}/ispaying`);
              await remove(isPayingRef);
            }
          } catch (error) {
            console.error('Failed to clear ispaying status after newpayment completion:', error);
          }
        }

        setPaymentResult(paymentResult);
        setPaymentCompleted(true);

        const redirectUrl = roomId ? `/newpayment/result?roomId=${roomId}` : '/newpayment/result';
        router.push(redirectUrl);
      } else {
        const errorMessage = verificationResult.message || 'Payment verification failed';
        console.error('Payment verification failed:', errorMessage);
        setPaymentError(errorMessage);
        alert(`Payment failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setPaymentError(errorMessage);
      alert(errorMessage);
    } finally {
      setPaymentInProgress(false);
    }
  };

  // Show minimal loading state until product info is parsed from URL
  if (!productInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">로딩 중...</div>
      </div>
    );
  }

  const { config } = productInfo;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto bg-white min-h-screen shadow-sm">
        <ProductHeader
          config={config}
          itemName={productInfo.itemName}
        />

        {hasError && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-8">
          <OrderSummary
            config={config}
            amount={formData.totalAmount}
            itemName={productInfo.itemName}
            penaltyReason={productInfo.penaltyReason}
          />

          <CustomerForm
            formData={{
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
            }}
            onChange={handleInputChange}
            focusRing={config.colorScheme.focusRing}
            focusBorder={config.colorScheme.focusBorder}
          />

          <PaymentMethodSelector
            selected={formData.payMethod}
            onChange={(method) => setFormData(prev => ({ ...prev, payMethod: method }))}
            accentText={config.colorScheme.accentText}
            accentBorder={config.colorScheme.accentBorder}
            accentBg={config.colorScheme.accentBg}
          />

          <RefundPolicy />

          <CheckoutButton
            config={config}
            amount={formData.totalAmount}
            isLoading={isInProgress}
            disabled={isInProgress}
          />
        </form>
      </div>
    </div>
  );
}
