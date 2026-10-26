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
        await signInWithEmailAndPassword(auth, 'admin@green.de', 'green2026');
        const docRef = doc(db, 'users', 'parsa2@green.de');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('--- DRIVER COMPLIANCE DOCS IN DATABASE ---');
            if (data.driverComplianceDocs) {
                data.driverComplianceDocs.forEach(d => {
                    console.log(`ID: ${d.id}, Name: ${d.name}, Status: ${d.status}, File exists: ${!!d.file}`);
                    if (d.file) {
                        console.log(`   File preview length: ${d.file.substring(0, 100)}...`);
                    }
                });
            } else {
                console.log('driverComplianceDocs field is undefined!');
            }
            console.log('--- MANAGER ONBOARDING FIELD DRIVERDOCS ---');
            if (data.driverDocs) {
                data.driverDocs.forEach(d => {
                    console.log(`ID: ${d.id}, Name: ${d.name}, Status: ${d.status}`);
                });
            } else {
                console.log('driverDocs field is undefined!');
            }
        }
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
};

checkUser();
