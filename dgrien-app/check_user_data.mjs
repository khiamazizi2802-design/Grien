import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const firebaseConfigPath = 'C:\\Users\\AURUMPC\\Desktop\\Khiam green app 4\\client\\src\\config\\firebase.js';

let configContent = fs.readFileSync(firebaseConfigPath, 'utf8');

// Extract config object
const startIdx = configContent.indexOf('const firebaseConfig = {');
const endIdx = configContent.indexOf('};', startIdx) + 2;
const configStr = configContent.substring(startIdx, endIdx)
    .replace('const firebaseConfig = ', '')
    .replace(/;/g, '')
    .trim();

// Parse using eval
let firebaseConfig;
eval('firebaseConfig = ' + configStr);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const checkUser = async () => {
    try {
        console.log('Authenticating as admin...');
        await signInWithEmailAndPassword(auth, 'admin@green.de', 'green2026');
        console.log('Authentication successful! Fetching user document...');
        
        const docRef = doc(db, 'users', 'parsa2@green.de');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log('USER DOCUMENT DATA:');
            const data = docSnap.data();
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log('No user document found for parsa2@green.de');
        }
    } catch (err) {
        console.error('Error fetching user document:', err);
    }
    process.exit(0);
};

checkUser();
