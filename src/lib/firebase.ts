import firebaseConfig from '../../firebase-applet-config.json';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. 만약 config 파일 내용이 비어있다면 가짜(임시) 데이터로 대체하여 빌드 에러를 막습니다.
const isConfigEmpty = !firebaseConfig || Object.keys(firebaseConfig).length === 0;

const actualConfig = isConfigEmpty 
  ? {
      apiKey: "mock-api-key",
      authDomain: "://firebaseapp.com",
      projectId: "mock-project",
      storageBucket: "://appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:1234567890"
    }
  : firebaseConfig;

// 2. 파이어베이스 초기화
const app = getApps().length === 0 ? initializeApp(actualConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// 3. ⭐ App.tsx에서 에러를 냈던 핵심 함수들을 그대로 복구/구현합니다.
// 로그인 상태 변화 감지 함수
export const initAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// 구글 로그인 함수
export const googleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("구글 로그인 에러:", error);
    throw error;
  }
};

// 로그아웃 함수
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("로그아웃 에러:", error);
    throw error;
  }
};

export default app;
