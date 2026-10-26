const fs = require('fs');

const firebaseConfigStr = fs.readFileSync('src/config/firebase.js', 'utf8');
const match = firebaseConfigStr.match(/const firebaseConfig = ({[\s\S]*?});/);

if (match && match[1]) {
  const configObj = eval('(' + match[1] + ')');
  
  import('firebase/app').then(({ initializeApp }) => {
    import('firebase/firestore').then(({ getFirestore, collection, getDocs, query, orderBy, limit }) => {
      const app = initializeApp(configObj);
      const db = getFirestore(app);

      async function checkOrders() {
        try {
          const q = query(collection(db, "orders"), orderBy("timestamp", "desc"), limit(10));
          const snapshot = await getDocs(q);
          snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`Order ID: ${doc.id} | venueEmail: ${data.venueEmail} | customer: ${data.customerEmail} | status: ${data.status}`);
          });
          process.exit(0);
        } catch (e) {
          console.error(e);
          process.exit(1);
        }
      }
      checkOrders();
    });
  });
} else {
  console.log("Could not parse config");
}
