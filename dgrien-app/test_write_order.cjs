const fs = require('fs');

const firebaseConfigStr = fs.readFileSync('src/config/firebase.js', 'utf8');
const match = firebaseConfigStr.match(/const firebaseConfig = ({[\s\S]*?});/);

if (match && match[1]) {
  const configObj = eval('(' + match[1] + ')');
  
  import('firebase/app').then(({ initializeApp }) => {
    import('firebase/firestore').then(({ getFirestore, collection, addDoc }) => {
      const app = initializeApp(configObj);
      const db = getFirestore(app);

      async function testWrite() {
        try {
          const docRef = await addDoc(collection(db, "orders"), {
            id: "test",
            venueEmail: "test@green.de",
            customerEmail: "guest@green.de",
            status: "Received",
            time: "10:00 AM",
            timestamp: Date.now()
          });
          console.log("Successfully wrote test document with ID: ", docRef.id);
          process.exit(0);
        } catch (e) {
          console.error("Write failed:", e);
          process.exit(1);
        }
      }
      testWrite();
    });
  });
} else {
  console.log("Could not parse config");
}
