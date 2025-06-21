"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  DollarSign, 
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Download,
  X,
  AlertTriangle
} from "lucide-react";

interface PaymentData {
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  customerName?: string;
  customerEmail?: string;
  method?: string;
  paidAt: string;
  roomId?: string;
  username?: string;
  isHost?: boolean;
  orderId?: string;
  date: string;
}

export default function AdminPaymentDashboard() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);
  const [cancelPaymentId, setCancelPaymentId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Check admin authentication
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
    if (!isAuthenticated) {
      router.push('/newpayment');
      return;
    }
  }, [router]);

  // Fetch payments from Firebase
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const { database } = await import('@/lib/firebase');
      const { ref, get } = await import('firebase/database');

      if (!database) {
        console.error('Firebase database not initialized');
        return;
      }

      const paymentsRef = ref(database, 'payment');
      const paymentsSnapshot = await get(paymentsRef);
      
      const paymentsList: PaymentData[] = [];

      if (paymentsSnapshot.exists()) {
        const paymentsData = paymentsSnapshot.val();
        
        Object.keys(paymentsData).forEach(date => {
          const dayPayments = paymentsData[date];
          Object.keys(dayPayments).forEach(paymentId => {
            const payment = dayPayments[paymentId];
            
            // Only add payments with valid paymentId
            if (paymentId && paymentId !== 'undefined') {
              // Use the correct field name from Firebase - paymentStatus
              const paymentStatus = payment.paymentStatus || 
                                  payment.status || 
                                  'unknown';
              
              paymentsList.push({
                paymentId,
                amount: payment.amount || 0,
                currency: payment.currency || 'KRW',
                status: paymentStatus,
                customerName: payment.customer?.name,
                customerEmail: payment.customer?.email,
                method: payment.method,
                paidAt: payment.paidAt || payment.requestedAt || new Date().toISOString(),
                roomId: payment.roomId,
                username: payment.username,
                isHost: payment.isHost,
                orderId: payment.orderId,
                date
              });
            }
          });
        });
      }

      // Remove duplicates based on paymentId
      const uniquePayments = paymentsList.filter((payment, index, self) => 
        index === self.findIndex(p => p.paymentId === payment.paymentId)
      );
      
      // Debug: Check for any undefined paymentIds
      const undefinedPayments = uniquePayments.filter(p => !p.paymentId);
      if (undefinedPayments.length > 0) {
        console.warn('Found payments with undefined paymentId:', undefinedPayments);
      }
      
      // Sort by payment date (newest first)
      uniquePayments.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
      
      setPayments(uniquePayments);
      setFilteredPayments(uniquePayments);
      
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminUser');
    router.push('/newpayment');
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
      case 'error':
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const handleCancelPayment = async () => {
    if (!cancelPaymentId) return;

    setIsCancelling(true);
    try {
      const response = await fetch('/api/newpayment/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: cancelPaymentId,
          reason: cancelReason || 'Cancelled by admin'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Update the payment status in the local state
        setPayments(prevPayments => 
          prevPayments.map(payment => 
            payment.paymentId === cancelPaymentId 
              ? { ...payment, status: 'CANCELLED' }
              : payment
          )
        );
        setFilteredPayments(prevPayments => 
          prevPayments.map(payment => 
            payment.paymentId === cancelPaymentId 
              ? { ...payment, status: 'CANCELLED' }
              : payment
          )
        );
        
        // Show detailed success message
        const successMessage = result.portOneCancelled 
          ? 'Payment cancelled successfully in both PortOne and database!'
          : result.portOneAttempted 
            ? 'Payment cancelled in database (PortOne cancellation failed but proceeding)'
            : 'Payment cancelled in database (PortOne API not configured)';
            
        alert(successMessage);
      } else {
        alert(result.error || 'Failed to cancel payment');
      }
    } catch (error) {
      console.error('Error cancelling payment:', error);
      alert('Failed to cancel payment');
    } finally {
      setIsCancelling(false);
      setCancelPaymentId(null);
      setCancelReason('');
    }
  };

  const canCancelPayment = (payment: PaymentData) => {
    const status = payment.status.toLowerCase();
    return status !== 'cancelled' && status !== 'failed' && status !== 'error';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Dashboard</h1>
                <p className="text-sm text-gray-600">결제 관리 시스템</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchPayments}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>새로고침</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold">
                  {payments.filter(p => p.status.toLowerCase() === 'success').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">
                  {formatAmount(payments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Payments ({payments.length})
            </h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment, index) => (
                    <tr key={payment.paymentId || `payment-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.paymentId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(payment.status)}
                          <span className="text-sm text-gray-900 capitalize">
                            {payment.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatAmount(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.customerName || payment.username || 'N/A'}
                        </div>
                        {payment.customerEmail && (
                          <div className="text-sm text-gray-500">
                            {payment.customerEmail}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.roomId || 'N/A'}
                        </div>
                        {payment.isHost && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Host
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.paidAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {canCancelPayment(payment) ? (
                          <button
                            onClick={() => setCancelPaymentId(payment.paymentId)}
                            className="flex items-center space-x-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {payments.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No payments found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Payment Modal */}
      {cancelPaymentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Cancel Payment</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel payment: <strong>{cancelPaymentId}</strong>?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setCancelPaymentId(null);
                  setCancelReason('');
                }}
                disabled={isCancelling}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelPayment}
                disabled={isCancelling}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{isCancelling ? 'Cancelling...' : 'Confirm Cancel'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
