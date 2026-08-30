// Firebase 핵심 기능들을 에러 없이 통과시키기 위한 가짜(Mock) 코드입니다.
export const initializeApp = () => ({});
export const getAuth = () => ({
  currentUser: { displayName: "테스트 유저", email: "test@example.com" }
});

export const auth = {
  currentUser: { displayName: "테스트 유저", email: "test@example.com" }
};

export const signInWithPopup = async () => {
  return { user: auth.currentUser };
};

export const GoogleAuthProvider = class {};

export const onAuthStateChanged = (authObj: any, callback: any) => {
  callback(auth.currentUser);
  return () => {};
};

// App.tsx에서 찾는 googleSignIn 함수를 임시로 만들어 연결해 줍니다.
export const googleSignIn = signInWithPopup;

