'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatRoom from '@/components/chat/ChatRoom';
import { v4 as uuidv4 } from 'uuid';
import { 
  Scale, 
  Gavel, 
  MessageSquare, 
  Copy, 
  Crown,
  Shield,
  AlertTriangle,
  Brain,
  Heart,
  UserCircle,
  Link,
  Bell,
  Camera,
  Mic,
  ChevronDown,
  Flame,
  Eye,
  Star,
  CheckCircle2
} from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const roomId = params?.roomId as string;
  const [userId, setUserId] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [nameError, setNameError] = useState('');

  // 사용자 ID 설정
  useEffect(() => {
    let uid = localStorage.getItem('userId');
    if (!uid) {
      uid = uuidv4();
      localStorage.setItem('userId', uid);
    }
    setUserId(uid);
    
    // 이름이 이미 설정되어 있는지 확인
    const storedName = localStorage.getItem(`chat_username_${roomId}`);
    if (storedName) {
      setUsername(storedName);
      setIsNameModalOpen(false); // 이름이 있으면 모달 닫기
    }
  }, [roomId]);

  // 링크 복사 기능
  const copyRoomLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // 사용자 이름 설정 처리
  const handleSetUsername = () => {
    if (!username.trim()) {
      setNameError('이름을 입력해주세요');
      return;
    }
    
    if (username.length > 10) {
      setNameError('이름은 10자 이내로 입력해주세요');
      return;
    }
    
    // 이름을 저장하고 모달 닫기
    localStorage.setItem(`chat_username_${roomId}`, username);
    setIsNameModalOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* 메인 컨텐츠 */}
      <main className="flex-1 container mx-auto p-4 md:p-6">
        <div className="w-full">
          {!isNameModalOpen && (
            <ChatRoom 
              roomId={roomId} 
              userType={null} 
              customUsername={username} 
              onShare={() => setIsShareModalOpen(true)}
            />
          )}
        </div>
      </main>

      {/* 이름 설정 모달 */}
      <AnimatePresence>
        {isNameModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">당신의 이름을 알려주세요</h2>
              </div>
              
              <p className="text-gray-700 mb-4">
                채팅방에서 사용할 이름을 입력해주세요. 이 이름은 다른 참여자에게 표시됩니다.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="username" className="text-sm font-medium text-gray-700">
                    이름
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSetUsername();
                      }
                    }}
                    placeholder="이름을 입력하세요 (10자 이내)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    maxLength={10}
                  />
                  {nameError && <p className="text-red-500 text-sm">{nameError}</p>}
                </div>
                
                <button
                  onClick={handleSetUsername}
                  className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  입장하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 공유 모달 */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">채팅방 공유하기</h2>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-800 mb-4">
                아래 링크를 복사해 친구들과 함께 대화에 참여해보세요.
              </p>
              
              <div className="flex items-center">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? window.location.href : ''}
                  className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 bg-gray-50 focus:outline-none text-gray-700"
                />
                <button
                  onClick={copyRoomLink}
                  className={`px-3 py-2 rounded-r-lg ${
                    copySuccess ? 'bg-green-600' : 'bg-indigo-600'
                  } text-white`}
                >
                  {copySuccess ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium mb-2 text-gray-800">함께 준수할 채팅 규칙</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                    <span>논쟁이 과열되지 않도록 서로 존중해주세요</span>
                  </li>
                  <li className="flex items-start">
                    <Scale className="h-4 w-4 text-indigo-500 mr-2 mt-0.5" />
                    <span>판사는 객관적인 판단만 해주세요</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
