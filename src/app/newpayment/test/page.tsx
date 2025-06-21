'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNewPaymentStore, usePaymentStatus, usePaymentSession } from '@/app/store/newPaymentStore';
import { 
  requestPayment, 
  verifyPayment, 
  logPaymentCompletion, 
  createPaymentResult,
  isMobileBrowser,
  initializePayment
} from '@/lib/newpayment';
import type { CustomerInfo, PaymentDetails } from '@/lib/newpayment';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

export default function NewPaymentTestPage() {
  const router = useRouter();
  const { 
    initializePaymentSession, 
    setPaymentResult, 
    clearAllPaymentData 
  } = useNewPaymentStore();
  
  const { isInProgress } = usePaymentStatus();
  const { roomId, userName, isSessionReady } = usePaymentSession();
  
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const handleApiTest = async () => {
    setLoading(true);
    try {
      const testData = {
        amount: 1000,
        orderName: 'API Test Order',
        customerInfo: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '010-1234-5678',
          address: 'Test Address'
        },
        payMethod: 'CARD'
      };

      // //console.log('=== TESTING NEW PAYMENT API ===');
      // //console.log('Test Data:', testData);

      // Test initialization endpoint
      const initResponse = await fetch('/api/newpayment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const initResult = await initResponse.json();
      
      if (initResult.success) {
        // Test verification endpoint
        const verifyResponse = await fetch('/api/newpayment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: initResult.data.paymentId,
            orderData: {
              totalAmount: testData.amount,
              orderName: testData.orderName,
              customerName: testData.customerInfo.name,
              customerEmail: testData.customerInfo.email,
              customerPhone: testData.customerInfo.phone,
              payMethod: testData.payMethod
            }
          }),
        });

        const verifyResult = await verifyResponse.json();

        addTestResult({
          success: true,
          message: 'API endpoints tested successfully',
          data: {
            initialization: initResult,
            verification: verifyResult
          },
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error(initResult.message || 'Initialization failed');
      }
    } catch (error) {
      console.error('API test error:', error);
      addTestResult({
        success: false,
        message: 'API test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFlowTest = async () => {
    setLoading(true);
    try {
      const customer: CustomerInfo = {
        name: 'Flow Test Customer',
        email: 'flowtest@example.com',
        phone: '010-9876-5432',
        address: 'Flow Test Address'
      };
      
      const payment: PaymentDetails = {
        orderName: 'Payment Flow Test',
        totalAmount: 2000,
        payMethod: 'CARD'
      };

      // //console.log('=== TESTING PAYMENT FLOW ===');
      // //console.log('Customer:', customer);
      // //console.log('Payment:', payment);

      // Simulate payment request (without actual PortOne call)
      const mockPaymentId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // Test verification
      const verificationResult = await verifyPayment(mockPaymentId, {
        totalAmount: payment.totalAmount,
        orderName: payment.orderName,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        payMethod: payment.payMethod
      });

      if (verificationResult.status === 'success') {
        // Create and save payment result
        const paymentResult = createPaymentResult(mockPaymentId, customer, payment, 'SUCCESS');
        await logPaymentCompletion(paymentResult, undefined, undefined, false); // Test page - no room context
        
        // Update store
        setPaymentResult(paymentResult);

        addTestResult({
          success: true,
          message: 'Payment flow tested successfully',
          data: {
            paymentId: mockPaymentId,
            verification: verificationResult,
            paymentResult
          },
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error(verificationResult.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Payment flow test error:', error);
      addTestResult({
        success: false,
        message: 'Payment flow test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStoreTest = () => {
    //console.log('=== TESTING PAYMENT STORE ===');
    
    // Test session initialization
    initializePaymentSession('test-room-123', 'Test User');
    
    // Test payment result creation
    const testPaymentResult = createPaymentResult(
      'store_test_payment_id',
      {
        name: 'Store Test User',
        email: 'storetest@example.com',
        phone: '010-1111-2222'
      },
      {
        orderName: 'Store Test Order',
        totalAmount: 1500,
        payMethod: 'CARD'
      },
      'SUCCESS'
    );
    
    setPaymentResult(testPaymentResult);

    addTestResult({
      success: true,
      message: 'Payment store tested successfully',
      data: {
        sessionInitialized: true,
        paymentResultSet: true,
        testPaymentResult
      },
      timestamp: new Date().toISOString()
    });
  };

  const handleClearData = () => {
    clearAllPaymentData();
    setTestResults([]);
    //console.log('=== CLEARED ALL TEST DATA ===');
  };

  // Test mobile payment with KCP V2 bypass parameters
  const testMobilePayment = async () => {
    //console.log('=== TESTING MOBILE PAYMENT ===');
    
    const customer: CustomerInfo = {
      name: 'Test Mobile User',
      email: 'test@mobile.com',
      phone: '010-1234-5678'
    };
    
    const payment: PaymentDetails = {
      orderName: 'Mobile Payment Test',
      totalAmount: 1000,
      payMethod: 'MOBILE',
      productType: 'DIGITAL',
      carrier: undefined // Let user choose in payment modal
    };
    
    setTestResults(prev => [...prev, {
      success: true,
      message: 'Starting mobile payment test...',
      timestamp: new Date().toISOString()
    }]);
    
    try {
      const { paymentRequest, paymentId } = await initializePayment(customer, payment);
      
      setTestResults(prev => [...prev, {
        success: true,
        message: 'Mobile payment initialization successful',
        data: {
          paymentId,
          storeId: paymentRequest.storeId,
          bypass: paymentRequest.bypass,
          hasShopUserId: !!(paymentRequest.bypass as any)?.shop_user_id
        },
        timestamp: new Date().toISOString()
      }]);
      
      // Check if required bypass parameters are present
      const bypass = paymentRequest.bypass as any;
      if (!bypass?.shop_user_id) {
        throw new Error('Missing required shop_user_id in bypass parameters for KCP V2 mobile payment');
      }
      
      setTestResults(prev => [...prev, {
        success: true,
        message: 'KCP V2 bypass parameters validated successfully',
        data: {
          shop_user_id: bypass.shop_user_id,
          digital: bypass.digital,
          carrier: bypass.carrier
        },
        timestamp: new Date().toISOString()
      }]);
      
    } catch (error) {
      setTestResults(prev => [...prev, {
        success: false,
        message: 'Mobile payment test failed',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }]);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        New Payment System - Test Page
      </h1>
      
      {/* System Info */}
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-md">
        <h2 className="text-lg font-semibold mb-2 text-purple-800">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-medium">Mobile Browser:</span> {isMobileBrowser() ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Payment In Progress:</span> {isInProgress ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Session Ready:</span> {isSessionReady ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p><span className="font-medium">Room ID:</span> {roomId || 'Not set'}</p>
            <p><span className="font-medium">User Name:</span> {userName || 'Not set'}</p>
            <p><span className="font-medium">API Endpoints:</span> /api/newpayment/*</p>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Test Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={handleApiTest}
            disabled={loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test API Endpoints'}
          </button>
          
          <button
            onClick={handlePaymentFlowTest}
            disabled={loading}
            className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Payment Flow'}
          </button>
          
          <button
            onClick={testMobilePayment}
            disabled={loading}
            className="px-4 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-orange-400 transition-colors"
          >
            Test Mobile Payment
          </button>
          
          <button
            onClick={handleStoreTest}
            disabled={loading}
            className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
          >
            Test Payment Store
          </button>
          
          <button
            onClick={handleClearData}
            className="px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Quick Navigation</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push('/newpayment/checkout')}
            className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
          >
            Checkout Page
          </button>
          <button
            onClick={() => router.push('/newpayment/result')}
            className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
          >
            Result Page
          </button>
          <button
            onClick={() => router.push('/payment/test')}
            className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
          >
            Old Payment Test
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
          >
            Home
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Test Results</h2>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-md border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <p className={`mb-2 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>
                
                {result.error && (
                  <p className="text-red-600 text-sm mb-2">
                    Error: {result.error}
                  </p>
                )}
                
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-gray-600">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documentation */}
      <div className="bg-white border border-gray-200 rounded-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">About New Payment System</h2>
        
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Key Features:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Clean and simplified payment flow</li>
              <li>Local logging instead of external API calls</li>
              <li>Better error handling and state management</li>
              <li>Mobile-friendly design and detection</li>
              <li>Development mode support</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800 mb-2">API Endpoints:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><code>/api/newpayment/initialize</code> - Payment initialization</li>
              <li><code>/api/newpayment/verify</code> - Payment verification</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Libraries:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><code>@/lib/newpayment</code> - Clean PortOne utilities</li>
              <li><code>@/app/store/newPaymentStore</code> - Payment state management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 