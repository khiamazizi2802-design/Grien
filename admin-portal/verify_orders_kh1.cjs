const fs = require('fs');

const firebaseConfigStr = fs.readFileSync('src/config/firebase.js', 'utf8');
const match = firebaseConfigStr.match(/const firebaseConfig = ({[\s\S]*?});/);

if (match && match[1]) {
  const configObj = eval('(' + match[1] + ')');
  
  import('firebase/app').then(({ initializeApp }) => {
    import('firebase/auth').then(({ getAuth, signInWithEmailAndPassword }) => {
      import('firebase/firestore').then(({ getFirestore, collection, getDocs, query, where, orderBy, limit }) => {
        const app = initializeApp(configObj);
        const auth = getAuth(app);
        const db = getFirestore(app);

        async function verifyOrders() {
          try {
            await signInWithEmailAndPassword(auth, "kh1@green.de", "123456");
            console.log("Logged in as kh1");
            
            const q = query(collection(db, "orders"), where("customerEmail", "==", "kh1@green.de"));
            const snapshot = await getDocs(q);
            console.log(`kh1 has ${snapshot.size} orders total.`);
            
            snapshot.forEach(doc => {
              const data = doc.data();
              console.log(`[Order ${doc.id}] venueEmail: ${data.venueEmail} | status: ${data.status} | time: ${data.time}`);
            });

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
