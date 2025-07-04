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
  AlertTriangle,
  UserCircle,
  Flame
} from 'lucide-react';
import { ref, get, set } from 'firebase/database';
import { database } from '@/lib/firebase';

export default function RoomPage() {
  const params = useParams();
  const roomId = params?.roomId as string;
  const [userId, setUserId] = useState<string>('');
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
            //console.log('방 생성자 정보가 저장되었습니다:', uid);
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
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-gradient-to-b from-white to-gray-50">
      {/* 메인 컨텐츠 */}
      <main className="flex-1 container mx-auto px-1 py-0 overflow-hidden">
        <div className="h-full w-full">
          {!isNameModalOpen && (
            <ChatRoom 
              roomId={roomId} 
              userType={undefined} 
              customUsername={username} 
            />
          )}
        </div>
      </main>

      {/* 이름 설정 모달 */}
      <AnimatePresence>
        {isNameModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
              className="bg-gradient-to-b from-white to-pink-50 rounded-2xl shadow-[0_10px_40px_-5px_rgba(217,70,219,0.2)] max-w-md w-full p-6 border border-pink-100 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-pink-200 rounded-full opacity-20 -mr-20 -mt-20 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-200 rounded-full opacity-20 -ml-20 -mb-20 blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700 flex items-center">
                    <Gavel className="h-5 w-5 mr-2 text-pink-600" />
                    법정 참석자 등록
                  </h2>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-lg p-4 mb-5 shadow-sm">
                  <p className="text-gray-700 font-medium leading-snug text-sm">
                    재판에 참여할 <span className="text-pink-600 font-bold">성함을 입력해주세요</span>. 법정 절차에 따라 귀하의 이름은 다른 참여자에게 공개됩니다.
                  </p>
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-bold text-gray-800 flex items-center">
                      <Scale className="h-4 w-4 text-pink-600 mr-2" />
                      <span>참석자 성함</span>
                      <span className="text-xs text-pink-500 ml-2 font-normal">(10자 이내)</span>
                    </label>
                    <div className="relative">
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
                        placeholder="성함을 입력하세요"
                        className="w-full px-4 py-3.5 border border-pink-200 focus:border-pink-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all text-gray-800 pr-10 bg-white/80 backdrop-blur-sm font-medium placeholder:text-gray-400"
                        maxLength={10}
                      />
                      <UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400 h-5 w-5" />
                    </div>
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
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSetUsername}
                    className="w-full px-4 py-3.5 bg-gradient-to-r from-pink-600 to-purple-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl hover:from-pink-700 hover:to-purple-800 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center justify-center">
                      <Gavel className="w-5 h-5 mr-2" />
                      법정 입장하기
                    </div>
                  </motion.button>
                  
                  <div className="text-xs text-gray-500 text-center pt-2 flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3 text-pink-500" />
                    <span>공정한 판결을 위해 <span className="text-pink-600 font-medium">실명 사용</span>을 권장합니다</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
