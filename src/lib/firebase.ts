import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Must specify databaseId from firebaseConfig
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let errorMessage = 'Unknown Firestore error';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    errorMessage = (error as any).message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    try {
      errorMessage = String(error);
    } catch {
      errorMessage = 'Unserializable Firestore error';
    }
  }

  const errInfo: FirestoreErrorInfo = {
    error: String(errorMessage),
    authInfo: {
      userId: auth.currentUser?.uid ? String(auth.currentUser.uid) : null,
      email: auth.currentUser?.email ? String(auth.currentUser.email) : null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
    },
    operationType,
    path: path ? String(path) : null,
  };

  let jsonStr = '';
  try {
    jsonStr = JSON.stringify(errInfo);
  } catch (e) {
    jsonStr = JSON.stringify({
      error: String(errorMessage),
      operationType: String(operationType),
      path: path ? String(path) : null,
    });
  }
  console.error('Firestore Error: ', jsonStr);
  throw new Error(jsonStr);
}

// Test Connection on init
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('client is offline')) {
      console.warn('Firebase connection offline test warning:', error.message);
    }
  }
}
testConnection();

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user) {
      await syncUserProfile(user);
    }
    return user;
  } catch (error) {
    console.error('Error logging in with Google:', error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}

export async function syncUserProfile(user: User, additionalStats?: { quizzesSolved?: number; accuracy?: number }) {
  const userRef = doc(db, 'users', user.uid);
  const pathName = `users/${user.uid}`;
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || 'Exam Candidate',
        email: user.email || '',
        photoURL: user.photoURL || '',
        quizzesSolved: additionalStats?.quizzesSolved || 0,
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: additionalStats?.accuracy || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else if (additionalStats) {
      await setDoc(
        userRef,
        {
          quizzesSolved: additionalStats.quizzesSolved,
          accuracy: additionalStats.accuracy,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, pathName);
  }
}

export async function getUserFirestoreProfile(uid: string) {
  const pathName = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, pathName);
    return null;
  }
}

export async function saveUserBookmarkToFirestore(uid: string, articleId: string, headline: string) {
  const pathName = `users/${uid}/bookmarks/${articleId}`;
  try {
    const bookmarkRef = doc(db, 'users', uid, 'bookmarks', articleId);
    await setDoc(bookmarkRef, {
      userId: uid,
      articleId,
      headline,
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, pathName);
  }
}

export async function removeUserBookmarkFromFirestore(uid: string, articleId: string) {
  const pathName = `users/${uid}/bookmarks/${articleId}`;
  try {
    const bookmarkRef = doc(db, 'users', uid, 'bookmarks', articleId);
    await deleteDoc(bookmarkRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, pathName);
  }
}

export async function getUserBookmarksFromFirestore(uid: string) {
  const pathName = `users/${uid}/bookmarks`;
  try {
    const colRef = collection(db, 'users', uid, 'bookmarks');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, pathName);
    return [];
  }
}

export async function saveUserQuizSubmissionToFirestore(
  uid: string,
  submission: { articleId: string; headline: string; score: number; total: number }
) {
  const pathName = `users/${uid}/quiz_submissions`;
  try {
    const colRef = collection(db, 'users', uid, 'quiz_submissions');
    await addDoc(colRef, {
      userId: uid,
      articleId: submission.articleId,
      headline: submission.headline,
      score: submission.score,
      total: submission.total,
      percentage: Math.round((submission.score / submission.total) * 100),
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, pathName);
  }
}

export async function saveUserActivityLogToFirestore(
  uid: string,
  log: { title: string; type: string; detail: string }
) {
  const pathName = `users/${uid}/activity_logs`;
  try {
    const colRef = collection(db, 'users', uid, 'activity_logs');
    await addDoc(colRef, {
      userId: uid,
      title: log.title,
      type: log.type,
      detail: log.detail,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, pathName);
  }
}

export async function getUserActivityLogsFromFirestore(uid: string) {
  const pathName = `users/${uid}/activity_logs`;
  try {
    const colRef = collection(db, 'users', uid, 'activity_logs');
    const snap = await getDocs(colRef);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, pathName);
    return [];
  }
}

export async function saveChatMessageToFirestore(uid: string, message: { role: 'user' | 'model'; text: string }) {
  const pathName = `users/${uid}/chat_messages`;
  try {
    const colRef = collection(db, 'users', uid, 'chat_messages');
    await addDoc(colRef, {
      userId: uid,
      role: message.role,
      text: message.text,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, pathName);
  }
}

export async function getChatMessagesFromFirestore(uid: string) {
  const pathName = `users/${uid}/chat_messages`;
  try {
    const colRef = collection(db, 'users', uid, 'chat_messages');
    const snap = await getDocs(colRef);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, pathName);
    return [];
  }
}
