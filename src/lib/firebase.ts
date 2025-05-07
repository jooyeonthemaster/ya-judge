import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database, ref, set as firebaseSetOriginal, DatabaseReference } from 'firebase/database';

// 파이어베이스 설정
const firebaseConfig = {
  apiKey: "AIzaSyAMXWEfKM9SECT1TQOfbGsm90DsDWFJ7sM",
  authDomain: "ya-judge.firebaseapp.com",
  projectId: "ya-judge",
  storageBucket: "ya-judge.firebasestorage.app",
  messagingSenderId: "560828958255",
  appId: "1:560828958255:web:460b61190633e58e1ae8da",
  measurementId: "G-HE1F4D63ST",
  databaseURL: "https://ya-judge-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// 파이어베이스 초기화 - 서버 사이드 렌더링 환경에서 여러번 초기화되는 것을 방지
let firebaseApp: FirebaseApp | undefined;
let firestore: Firestore | undefined;
let auth: Auth | undefined;
let database: Database | undefined;

if (typeof window !== 'undefined') {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    firestore = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
    database = getDatabase(firebaseApp);
  } catch (error) {
    console.error('파이어베이스 초기화 오류:', error);
  }
}

// 안전한 firebase set 유틸리티 함수
export const firebaseSet = (reference: DatabaseReference, data: any) => {
  if (!database) {
    console.error('Firebase database not initialized');
    return Promise.reject(new Error('Firebase database not initialized'));
  }
  return firebaseSetOriginal(reference, data);
};

export { firebaseApp, firestore, auth, database }; 