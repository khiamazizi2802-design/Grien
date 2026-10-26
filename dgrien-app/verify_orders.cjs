const fs = require('fs');

const firebaseConfigStr = fs.readFileSync('src/config/firebase.js', 'utf8');
const match = firebaseConfigStr.match(/const firebaseConfig = ({[\s\S]*?});/);

if (match && match[1]) {
  const configObj = eval('(' + match[1] + ')');
  
  import('firebase/app').then(({ initializeApp }) => {
    import('firebase/auth').then(({ getAuth, signInWithEmailAndPassword }) => {
      import('firebase/firestore').then(({ getFirestore, collection, getDocs, query, where }) => {
        const app = initializeApp(configObj);
        const auth = getAuth(app);
        const db = getFirestore(app);

        async function verifyOrders() {
          try {
            await signInWithEmailAndPassword(auth, "kh5c@green.de", "123456");
            console.log("Logged in as kh5c");
            
            const q = query(collection(db, "orders"), where("venueEmail", "==", "kh5c@green.de"));
            const snapshot = await getDocs(q);
            console.log(`kh5c has ${snapshot.size} orders attached to their email.`);
            
            // Now check hotel@green.de
            const q2 = query(collection(db, "orders"), where("venueEmail", "==", "hotel@green.de"));
            const snapshot2 = await getDocs(q2);
            console.log(`hotel@green.de has ${snapshot2.size} orders attached to their email.`);

            process.exit(0);
          } catch (e) {
            console.error(e);
            process.exit(1);
          }
        }
        verifyOrders();
      });
    });
  });
} else {
  console.log("Could not parse config");
}
