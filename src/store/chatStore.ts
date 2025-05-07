import { create } from 'zustand';
import { database } from '@/lib/firebase';
import { 
  onValue, 
  ref, 
  push, 
  set as firebaseSet, 
  remove, 
  off, 
  onDisconnect, 
  DatabaseReference, 
  Database,
  onChildAdded
} from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  user: 'user-a' | 'user-b' | 'user-general' | 'judge' | 'system';
  name: string;
  text: string;
  timestamp: string;
  roomId?: string;
  sender?: {
    id: string;
    username: string;
  };
}

interface ChatState {
  messages: Message[];
  stats: {
    logicPowerA: number;
    logicPowerB: number;
    bullshitMeter: number;
    evidenceStrength: number;
  };
  currentUser: 'user-a' | 'user-b' | null;
  roomUsers: Array<{ id: string; username: string }>;
  typingUsers: Record<string, { username: string, isTyping: boolean }>;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateStats: (partial: Partial<ChatState['stats']>) => void;
  setCurrentUser: (user: 'user-a' | 'user-b' | null) => void;
  clearMessages: () => void;
  setRoomUsers: (users: Array<{ id: string; username: string }>) => void;
  setTypingStatus: (userId: string, username: string, isTyping: boolean) => void;
  joinRoom: (roomId: string, username: string) => void;
  leaveRoom: () => void;
}

export const useChatStore = create<ChatState>((set, get) => {
  // 초기 상태
  const initialState = {
    messages: [],
    stats: {
      logicPowerA: 50,
      logicPowerB: 50,
      bullshitMeter: 0,
      evidenceStrength: 50
    },
    currentUser: null,
    roomUsers: [],
    typingUsers: {},
  };

  // 방 참여 상태 관리
  let currentRoomRef: DatabaseReference | null = null;
  let roomUsersRef: DatabaseReference | null = null;
  let typingRef: DatabaseReference | null = null;
  let currentUserId: string = '';
  let db = database as Database | undefined;
  
  return {
    ...initialState,

    // 채팅방 참여
    joinRoom: (roomId: string, username: string) => {
      if (!db) {
        console.error('Firebase database is not initialized');
        return;
      }
      
      console.log(`Joining room: ${roomId} as ${username}`);
      
      // 이전 연결 정리
      if (currentRoomRef) {
        console.log('Cleaning up previous connections');
        off(currentRoomRef);
        if (roomUsersRef) off(roomUsersRef);
        if (typingRef) off(typingRef);
      }

      try {
        // 사용자 ID 생성
        currentUserId = uuidv4();
        console.log(`Generated user ID: ${currentUserId}`);
        
        // 방 메시지 참조
        currentRoomRef = ref(db, `rooms/${roomId}/messages`);
        
        // 방에 사용자 추가 전 기존 연결 정리
        roomUsersRef = ref(db, `rooms/${roomId}/users`);
        
        // 먼저 현재 사용자 이름과 동일한 이전 연결이 있는지 확인하고 제거
        onValue(roomUsersRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            // 동일한 사용자 이름을 가진 이전 연결 찾기
            Object.entries(data).forEach(([userId, userData]: [string, any]) => {
              if (userData.username === username && userId !== currentUserId) {
                // 이전 연결 제거
                const oldUserRef = ref(db, `rooms/${roomId}/users/${userId}`);
                remove(oldUserRef)
                  .then(() => console.log(`Removed previous connection for ${username}`))
                  .catch(err => console.error('Failed to remove previous user:', err));
              }
            });
          }
          
          // 새 사용자 정보 추가
          const userRef = ref(db, `rooms/${roomId}/users/${currentUserId}`);
          firebaseSet(userRef, { username })
            .then(() => console.log('User added to room'))
            .catch(err => console.error('Failed to add user to room:', err));
          
          // 연결 종료시 사용자 제거
          onDisconnect(userRef).remove();
          
        }, { onlyOnce: true });
        
        // 초기 메시지 로드 및 새 메시지 리스너 설정
        onValue(currentRoomRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            console.log('Initial messages loaded');
            const messageArray = Object.values(data) as Message[];
            set({ messages: messageArray });
            
            // 초기 로드 후 입장 메시지 추가 (한 번만 실행)
            const joinMessage = {
              user: 'system' as const,
              name: 'System',
              text: `${username}님이 입장하셨습니다.`,
              roomId
            };
            
            // 메시지 추가
            get().addMessage(joinMessage);
          } else {
            // 채팅방이 비어있는 경우 바로 입장 메시지 추가
            const joinMessage = {
              user: 'system' as const,
              name: 'System',
              text: `${username}님이 입장하셨습니다.`,
              roomId
            };
            
            // 메시지 추가
            get().addMessage(joinMessage);
          }
        }, { onlyOnce: true });
        
        // 새 메시지 추가될 때 핸들링 - 중복 방지 처리 추가
        onChildAdded(currentRoomRef, (snapshot) => {
          const message = snapshot.val() as Message;
          if (message) {
            console.log('New message received:', message.id);
            // 중복 방지를 위한 체크 추가
            set(state => {
              // 메시지 ID가 이미 존재하는지 확인
              const messageExists = state.messages.some(m => m.id === message.id);
              if (messageExists) {
                console.log('Duplicate message detected, skipping:', message.id);
                return state; // 상태 변경 없음
              }
              return {
                messages: [...state.messages, message]
              };
            });
          }
        });
        
        // 사용자 목록 구독
        onValue(roomUsersRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const usersArray = Object.entries(data)
              .map(([id, user]: [string, any]) => ({
                id,
                username: user.username
              }))
              // 시스템 계정 제외 및 중복 사용자 제거
              .filter(user => {
                // 시스템 계정 제외
                return user.username !== 'System' && 
                       !user.username.includes('System') &&
                       user.username.trim() !== '';
              });
            
            console.log(`Room users updated: ${usersArray.length} actual users`);
            set({ roomUsers: usersArray });
          } else {
            set({ roomUsers: [] });
          }
        });
        
        // 타이핑 상태 구독
        typingRef = ref(db, `rooms/${roomId}/typing`);
        onValue(typingRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            set({ typingUsers: data });
          } else {
            set({ typingUsers: {} });
          }
        });
      } catch (error) {
        console.error('Error joining room:', error);
      }
    },
    
    // 방 나가기
    leaveRoom: () => {
      console.log('Leaving room');
      if (!db || !currentRoomRef) {
        console.log('Nothing to leave - database or room reference not initialized');
        return;
      }
      
      try {
        // 구독 해제
        console.log('Unsubscribing from room events');
        off(currentRoomRef);
        if (roomUsersRef) off(roomUsersRef);
        if (typingRef) off(typingRef);
        
        // 사용자 제거
        if (currentUserId && roomUsersRef) {
          console.log(`Removing user ${currentUserId} from room`);
          const pathArray = roomUsersRef.toString().split('/');
          const roomId = pathArray[pathArray.length - 2]; // rooms/{roomId}/users
          const userRef = ref(db, `rooms/${roomId}/users/${currentUserId}`);
          remove(userRef)
            .then(() => console.log('User removed from room'))
            .catch(err => console.error('Failed to remove user from room:', err));
        }
        
        // 상태 초기화
        console.log('Resetting state');
        set(initialState);
        
        // 참조 초기화
        currentRoomRef = null;
        roomUsersRef = null;
        typingRef = null;
        currentUserId = '';
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    },
    
    // 메시지 추가
    addMessage: (message) => {
      if (!db || !currentRoomRef) {
        console.error('Cannot add message - database or room reference not initialized');
        return;
      }
      
      try {
        // 고유한 ID 생성 및 타임스탬프 추가
        const messageId = uuidv4();
        const newMessage = {
          ...message,
          id: messageId,
          timestamp: new Date().toISOString()
        };
        
        console.log('Adding new message:', newMessage.id);
        
        // Firebase에 메시지 추가
        push(currentRoomRef, newMessage)
          .then(() => {
            console.log('Message sent successfully');
            
            // 로컬 상태 즉시 업데이트 (Firebase 이벤트 기다리지 않고)
            // 중복 방지를 위해 이미 존재하는지 확인
            set(state => {
              const messageExists = state.messages.some(m => m.id === messageId);
              if (messageExists) {
                return state;
              }
              return {
                messages: [...state.messages, newMessage]
              };
            });
          })
          .catch(err => console.error('Failed to send message:', err));
      } catch (error) {
        console.error('Error adding message:', error);
      }
    },
    
    // 타이핑 상태 설정
    setTypingStatus: (userId, username, isTyping) => {
      if (!db || !typingRef) {
        console.error('Cannot set typing status - database or typing reference not initialized');
        return;
      }
      
      try {
        const pathArray = typingRef.toString().split('/');
        const roomId = pathArray[pathArray.length - 2]; // rooms/{roomId}/typing
        const userTypingRef = ref(db, `rooms/${roomId}/typing/${userId}`);
        
        // 현재 상태 확인
        const currentState = get().typingUsers[userId];
        const currentIsTyping = currentState?.isTyping;
        
        // 상태가 변경된 경우에만 업데이트
        if (currentIsTyping !== isTyping) {
          console.log(`User ${username} typing status changed to: ${isTyping}`);
          
          firebaseSet(userTypingRef, { username, isTyping })
            .catch(err => console.error('Failed to set typing status:', err));
          
          // 로컬 상태도 업데이트
          set(state => ({
            typingUsers: {
              ...state.typingUsers,
              [userId]: { username, isTyping }
            }
          }));
          
          // 타이핑 중인 경우, 자동 해제는 컴포넌트에서 관리
        }
      } catch (error) {
        console.error('Error setting typing status:', error);
      }
    },
    
    // 메시지 초기화
    clearMessages: () => {
      console.log('Clearing messages');
      set({ messages: [] });
    },
    
    // 현재 사용자 설정
    setCurrentUser: (user) => {
      console.log(`Setting current user to: ${user}`);
      set({ currentUser: user });
    },
    
    // 채팅방 사용자 목록 설정
    setRoomUsers: (users) => {
      console.log(`Setting room users: ${users.length} users`);
      set({ roomUsers: users });
    },
    
    // 통계 업데이트
    updateStats: (partial) => {
      console.log('Updating stats:', partial);
      set((state) => ({
        stats: {
          ...state.stats,
          ...partial
        }
      }));
    }
  };
});
