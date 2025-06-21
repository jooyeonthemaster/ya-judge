"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";

export default function AdminPaymentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    id: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Call authentication API
      const response = await fetch('/api/newpayment/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: formData.id,
          password: formData.password
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Store admin session
        sessionStorage.setItem('adminUser', JSON.stringify(result.user));
        sessionStorage.setItem('adminAuthenticated', 'true');
        
        // Redirect to admin dashboard
        router.push('/newpayment/admin');
      } else {
        setError(result.error || 'Authentication failed');
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Admin Payment
            </h1>
            <p className="text-gray-600">
              관리자 결제 시스템에 로그인하세요
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* ID Input */}
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="id"
                  name="id"
                  value={formData.id}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="아이디를 입력하세요"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.id || !formData.password}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>로그인 중...</span>
                </div>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              관리자 권한이 필요한 페이지입니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 