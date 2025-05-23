import { useState, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { v4 as uuidv4 } from 'uuid';

interface UseChatRoomStateProps {
  roomId: string | null;
  customUsername?: string;
}

interface UseChatRoomStateReturn {
  // 사용자 정보
  username: string;
  currentUserId: string;
  isRoomHost: boolean;
  
  // 준비 상태
  readyUsers: Record<string, boolean>;
  postVerdictReadyUsers: Record<string, boolean>;
  showTrialReadyButton: boolean;
  showPostVerdictStartButton: boolean;
  
  // 모달 상태
  showCourtReadyModal: boolean;
  showConfirmStartModal: boolean;
  showHostLeftModal: boolean;
  
  // 상태 변경 함수들
  setUsername: (name: string) => void;
  setIsRoomHost: (isHost: boolean) => void;
  setReadyUsers: (users: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  setPostVerdictReadyUsers: (users: Record<string, boolean>) => void;
  setShowTrialReadyButton: (show: boolean) => void;
  setShowPostVerdictStartButton: (show: boolean) => void;
  setShowCourtReadyModal: (show: boolean) => void;
  setShowConfirmStartModal: (show: boolean) => void;
  setShowHostLeftModal: (show: boolean) => void;
  
  // 유틸리티 함수들
  calculatedChattersCount: () => number;
}

export function useChatRoomState({ 
  roomId, 
  customUsername 
}: UseChatRoomStateProps): UseChatRoomStateReturn {
  
  const { roomUsers, joinRoom, leaveRoom } = useChatStore();
  
  // 기본 상태
  const [username, setUsername] = useState('');
  const [currentUserId] = useState(() => {
    const stored = localStorage.getItem('userId');
    if (stored) return stored;
    const newId = uuidv4();
    localStorage.setItem('userId', newId);
    return newId;
  });
  const [isRoomHost, setIsRoomHost] = useState(false);
  
  // 준비 상태
  const [readyUsers, setReadyUsers] = useState<Record<string, boolean>>({});
  const [postVerdictReadyUsers, setPostVerdictReadyUsers] = useState<Record<string, boolean>>({});
  const [showTrialReadyButton, setShowTrialReadyButton] = useState(false);
  const [showPostVerdictStartButton, setShowPostVerdictStartButton] = useState(false);
  
  // 모달 상태
  const [showCourtReadyModal, setShowCourtReadyModal] = useState(false);
  const [showConfirmStartModal, setShowConfirmStartModal] = useState(false);
  const [showHostLeftModal, setShowHostLeftModal] = useState(false);

  // 사용자 이름 초기화
  useEffect(() => {
    if (!roomId) return;
    
    // 이미 저장된 사용자 이름 확인
    let storedUsername = localStorage.getItem(`chat_username_${roomId}`);
    
    if (storedUsername) {
      setUsername(storedUsername);
      if (roomId) {
        joinRoom(roomId, storedUsername);
      }
      return;
    }
    
    // 커스텀 이름이 있으면 사용
    if (customUsername) {
      setUsername(customUsername);
      localStorage.setItem(`chat_username_${roomId}`, customUsername);
      joinRoom(roomId, customUsername);
    }
  }, [roomId, customUsername, joinRoom]);

  // 참가자 수 계산
  const calculatedChattersCount = (): number => {
    return roomUsers
      .filter(user => !user.username.includes('System') && user.username !== 'System')
      .length;
  };

  // 컴포넌트 언마운트 시 방 떠나기
  useEffect(() => {
    return () => {
      if (roomId && username) {
        leaveRoom();
      }
    };
  }, [roomId, username, leaveRoom]);

  return {
    // 사용자 정보
    username,
    currentUserId,
    isRoomHost,
    
    // 준비 상태
    readyUsers,
    postVerdictReadyUsers,
    showTrialReadyButton,
    showPostVerdictStartButton,
    
    // 모달 상태
    showCourtReadyModal,
    showConfirmStartModal,
    showHostLeftModal,
    
    // 상태 변경 함수들
    setUsername,
    setIsRoomHost,
    setReadyUsers,
    setPostVerdictReadyUsers,
    setShowTrialReadyButton,
    setShowPostVerdictStartButton,
    setShowCourtReadyModal,
    setShowConfirmStartModal,
    setShowHostLeftModal,
    
    // 유틸리티 함수들
    calculatedChattersCount
  };
} 