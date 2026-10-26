const fs = require('fs');

const firebaseConfigStr = fs.readFileSync('src/config/firebase.js', 'utf8');
const match = firebaseConfigStr.match(/const firebaseConfig = ({[\s\S]*?});/);

if (match && match[1]) {
  const configObj = eval('(' + match[1] + ')');
  
  import('firebase/app').then(({ initializeApp }) => {
    import('firebase/firestore').then(({ getFirestore, collection, getDocs }) => {
      const app = initializeApp(configObj);
      const db = getFirestore(app);

      async function listUsers() {
        try {
          const snapshot = await getDocs(collection(db, "users"));
          console.log(`Found ${snapshot.size} users:`);
          snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id} | Email: ${data.email} | Name: ${data.name} | Role: ${data.role}`);
          });
          process.exit(0);
        } catch (e) {
          console.error(e);
          process.exit(1);
        }
      }
      listUsers();
    });
  });
}
