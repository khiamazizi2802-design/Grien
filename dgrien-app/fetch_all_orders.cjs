const fs = require('fs');

const firebaseConfigStr = fs.readFileSync('src/config/firebase.js', 'utf8');
const match = firebaseConfigStr.match(/const firebaseConfig = ({[\s\S]*?});/);

if (match && match[1]) {
  const configObj = eval('(' + match[1] + ')');
  
  import('firebase/app').then(({ initializeApp }) => {
    import('firebase/firestore').then(({ getFirestore, collection, getDocs, query, orderBy, limit }) => {
      const app = initializeApp(configObj);
      const db = getFirestore(app);

      async function fetchRecentOrders() {
        try {
          const q = query(collection(db, "orders"), orderBy("timestamp", "desc"), limit(20));
          const snapshot = await getDocs(q);
          console.log(`Fetched ${snapshot.size} recent orders:`);
          snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id} | venueEmail: ${data.venueEmail} | customerEmail: ${data.customerEmail} | status: ${data.status} | time: ${data.time}`);
          });
          process.exit(0);
        } catch (e) {
          console.error(e);
          process.exit(1);
        }
      }
      fetchRecentOrders();
    });
  });
} else {
  console.log("Could not parse config");
}
