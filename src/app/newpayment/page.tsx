"use client"

import { useRouter } from "next/navigation";
import { useNewPaymentStore, usePaymentStatus, usePaymentSession, usePaymentResult } from "@/app/store/newPaymentStore";
import { isMobileBrowser } from "@/lib/newpayment";
import { useState, useEffect } from "react";
import { CreditCard, CheckCircle, Settings, TestTube, ArrowRight, Smartphone, Monitor } from "lucide-react";

export default function NewPaymentIndexPage() {
  const router = useRouter();
  const { initializePaymentSession, clearAllPaymentData } = useNewPaymentStore();
  const { isInProgress, isCompleted, hasError, error } = usePaymentStatus();
  const { roomId, userName, isSessionReady } = usePaymentSession();
  const { hasResult, result } = usePaymentResult();
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileBrowser());
  }, []);

  const handleQuickSession = () => {
    const testRoomId = `room_${Date.now()}`;
    const testUserName = `User_${Math.random().toString(36).substring(2, 8)}`;
    initializePaymentSession(testRoomId, testUserName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            New Payment System
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Clean, Simple, and Reliable Payment Processing
          </p>
          <p className="text-sm text-purple-600">
            ✨ Local logging • No external API calls • Clean architecture
          </p>
        </div>

        {/* Device Info */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center space-x-4">
            {isMobile ? (
              <Smartphone className="text-purple-600 w-5 h-5" />
            ) : (
              <Monitor className="text-purple-600 w-5 h-5" />
            )}
            <span className="text-sm text-gray-600">
              Detected Device: <span className="font-medium">{isMobile ? 'Mobile' : 'Desktop'}</span>
            </span>
          </div>
        </div>

        {/* System Status */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                isSessionReady ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <Settings className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-700">Session Ready</p>
              <p className="text-xs text-gray-500">{isSessionReady ? 'Active' : 'Not Set'}</p>
            </div>
            
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                isInProgress ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <CreditCard className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-700">Payment Status</p>
              <p className="text-xs text-gray-500">
                {isInProgress ? 'In Progress' : 'Idle'}
              </p>
            </div>
            
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-700">Completion</p>
              <p className="text-xs text-gray-500">
                {isCompleted ? 'Completed' : 'Pending'}
              </p>
            </div>
            
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                hasError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                <TestTube className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-700">Error Status</p>
              <p className="text-xs text-gray-500">
                {hasError ? 'Has Error' : 'No Errors'}
              </p>
            </div>
          </div>

          {/* Session Details */}
          {isSessionReady && (
            <div className="mt-4 p-3 bg-purple-50 rounded-md">
              <p className="text-sm text-purple-700">
                <span className="font-medium">Room:</span> {roomId} | 
                <span className="font-medium"> User:</span> {userName}
              </p>
            </div>
          )}

          {/* Error Details */}
          {hasError && (
            <div className="mt-4 p-3 bg-red-50 rounded-md">
              <p className="text-sm text-red-700">
                <span className="font-medium">Error:</span> {error}
              </p>
            </div>
          )}

          {/* Payment Result */}
          {hasResult && result && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-700">
                <span className="font-medium">Last Payment:</span> {result.paymentId} 
                ({result.amount.toLocaleString()}원)
              </p>
            </div>
          )}
        </div>

        {/* Main Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Checkout */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Checkout Page</h3>
              <p className="text-sm text-gray-600 mb-4">
                Start a new payment process with the clean checkout interface
              </p>
              <button
                onClick={() => router.push('/newpayment/checkout')}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Go to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Result Page */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Result Page</h3>
              <p className="text-sm text-gray-600 mb-4">
                View payment results and completion status
              </p>
              <button
                onClick={() => router.push('/newpayment/result')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>View Results</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Test Page */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <TestTube className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Test Page</h3>
              <p className="text-sm text-gray-600 mb-4">
                Test payment functionality and API endpoints
              </p>
              <button
                onClick={() => router.push('/newpayment/test')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Run Tests</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleQuickSession}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
            >
              Initialize Test Session
            </button>
            <button
              onClick={clearAllPaymentData}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
            >
              Clear All Data
            </button>
            <button
              onClick={() => router.push('/payment/test')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              Old Payment System
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              Home
            </button>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">New vs Old System</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-green-700 mb-3">✅ New Payment System</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Clean and simplified code structure</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Local logging instead of external API calls</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Better error handling and user feedback</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Improved state management with Zustand</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Mobile-first responsive design</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Development mode support</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-600 mb-3">📋 Old Payment System</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• External API calls to record payments</li>
                <li>• More complex code structure</li>
                <li>• Basic error handling</li>
                <li>• Standard state management</li>
                <li>• Traditional responsive approach</li>
                <li>• Production-focused setup</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 