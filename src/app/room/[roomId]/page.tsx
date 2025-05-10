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
import { ref, get, set } from 'firebase/database';
import { database } from '@/lib/firebase';

export default function RoomPage() {
  const params = useParams();
  const roomId = params?.roomId as string;
  const [userId, setUserId] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [nameError, setNameError] = useState('');
  const [isRoomCreator, setIsRoomCreator] = useState(false);

  // 사용자 ID 설정 및 방 생성자 확인
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

    // 방 생성자 확인
    const checkRoomCreator = async () => {
      // 방 생성자 정보 확인
      if (!database) {
        console.error('Firebase database not initialized');
        setIsRoomCreator(true);
        localStorage.setItem(`room_creator_${roomId}`, uid);
        return;
      }
      
      const roomCreatorRef = ref(database, `rooms/${roomId}/creator`);
      try {
        const snapshot = await get(roomCreatorRef);
        const creatorId = snapshot.val();
        
        // 생성자 정보가 없으면 현재 사용자를 생성자로 설정
        if (!creatorId) {
          setIsRoomCreator(true);
          localStorage.setItem(`room_creator_${roomId}`, uid);
          
          // Firebase에 생성자 정보 저장
          try {
            await set(roomCreatorRef, uid);
            console.log('방 생성자 정보가 저장되었습니다:', uid);
          } catch (error) {
            console.error('방 생성자 정보 저장 중 오류:', error);
          }
        } else {
          // 생성자 ID와 현재 사용자 ID 비교
          setIsRoomCreator(creatorId === uid);
        }
      } catch (error) {
        console.error('방 생성자 확인 중 오류:', error);
        // 오류 발생 시 현재 사용자를 생성자로 간주
        setIsRoomCreator(true);
        localStorage.setItem(`room_creator_${roomId}`, uid);
      }
    };

    checkRoomCreator();
  }, [roomId]);

  // 이름 설정 후 처리 - 방 생성자인 경우 공유 모달 자동 표시
  useEffect(() => {
    if (!isNameModalOpen && isRoomCreator) {
      // 방 생성자가 채팅방에 입장한 경우 공유 모달 자동 표시
      setIsShareModalOpen(true);
    }
  }, [isNameModalOpen, isRoomCreator]);

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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <UserCircle className="h-5 w-5 text-indigo-600 mr-2" />
                  당신의 이름을 알려주세요
                </h2>
              </div>
              
              <p className="text-gray-700 mb-5">
                채팅방에서 사용할 이름을 입력해주세요. 이 이름은 다른 참여자에게 표시됩니다.
              </p>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-gray-700 flex items-center">
                    <span>이름</span>
                    <span className="text-xs text-gray-500 ml-2">(10자 이내)</span>
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
                    placeholder="이름을 입력하세요"
                    className="w-full px-4 py-3 border border-gray-300 focus:border-indigo-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-gray-800"
                    maxLength={10}
                  />
                  <AnimatePresence>
                    {nameError && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-500 text-sm flex items-center"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                        {nameError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                
                <button
                  onClick={handleSetUsername}
                  className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Link className="h-5 w-5 text-indigo-600 mr-2" />
                  채팅방 공유하기
                </h2>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {isRoomCreator ? (
                <div className="mb-5">
                  <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 mb-4 shadow-sm">
                    <h3 className="text-amber-800 font-bold flex items-center mb-2 text-base">
                      <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
                      채팅 시작 전에 상대를 초대하세요!
                    </h3>
                    <p className="text-amber-700 text-sm leading-relaxed">
                      채팅방 링크를 상대방에게 공유하고 입장을 확인한 후 채팅을 시작하세요.
                      상대방이 입장해야 효과적인 대화가 가능합니다.
                    </p>
                  </div>
                  <p className="text-gray-700 font-medium">
                    아래 링크를 복사해 상대방과 공유하세요:
                  </p>
                </div>
              ) : (
                <p className="text-gray-700 mb-4">
                  아래 링크를 복사해 친구들과 함께 대화에 참여해보세요.
                </p>
              )}
              
              <div className="flex items-center mb-5 group">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? window.location.href : ''}
                  className="flex-1 border border-gray-300 group-hover:border-indigo-300 rounded-l-lg px-3 py-2.5 bg-gray-50 focus:outline-none text-gray-700 font-mono text-sm transition-colors"
                />
                <button
                  onClick={copyRoomLink}
                  className={`px-3 py-2.5 rounded-r-lg transition-all ${
                    copySuccess 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white`}
                >
                  {copySuccess ? (
                    <div className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-1" />
                      <span className="text-sm font-medium">복사됨</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Copy className="h-5 w-5 mr-1" />
                      <span className="text-sm font-medium">복사</span>
                    </div>
                  )}
                </button>
              </div>
              
              <div className="mt-5 pt-4 border-t border-gray-100">
                <h3 className="font-medium mb-3 text-gray-800 flex items-center">
                  <Shield className="h-4 w-4 text-indigo-500 mr-1.5" />
                  함께 준수할 채팅 규칙
                </h3>
                <ul className="text-sm text-gray-700 space-y-2 bg-gray-50 p-3 rounded-lg">
                  <li className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>논쟁이 과열되지 않도록 서로 존중해주세요</span>
                  </li>
                  <li className="flex items-start">
                    <Scale className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>판사는 객관적인 판단만 해주세요</span>
                  </li>
                </ul>
              </div>
              
              {isRoomCreator && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setIsShareModalOpen(false)}
                    className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    확인했습니다. 채팅 시작하기
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
