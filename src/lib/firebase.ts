import firebaseConfig from '../../firebase-applet-config.json';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. 파일 내용이 비어있거나 올바르지 않아도 절대 에러가 나지 않도록 가짜 데이터를 기본값으로 둡니다.
let actualConfig = {
  apiKey: "mock-api-key",
  authDomain: "://firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "://appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:1234567890"
};

// 2. 만약 파일 안에 진짜 파이어베이스 설정 데이터가 들어있다면 그것으로 덮어씁니다.
if (firebaseConfig && Object.keys(firebaseConfig).length > 0 && (firebaseConfig as any).apiKey) {
  actualConfig = firebaseConfig as any;
}

// 3. 파이어베이스 및 필수 서비스들을 안전하게 초기화합니다.
const app = getApps().length === 0 ? initializeApp(actualConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// 4. App.tsx가 사용하는 핵심 로그인 기능 함수들
export const initAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

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

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("로그아웃 에러:", error);
    throw error;
  }
};

export default app;
