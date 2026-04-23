import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const initAuth = async () => {
    try {
        if (!auth.currentUser) {
            await signInAnonymously(auth);
            console.log('Cidadão autenticado no Ledger (Anon)');
        }
    } catch (error) {
        console.error('Erro Auth:', error);
    }
};

export const handleFirestoreError = (error: any, operationType: string, path: string | null) => {
    console.error(`Firestore Error [${operationType}] at [${path}]:`, error);
    throw JSON.stringify({
        error: error.message,
        operationType,
        path,
        authInfo: {
            userId: auth.currentUser?.uid || 'anonymous',
            emailVerified: false,
        }
    });
};
