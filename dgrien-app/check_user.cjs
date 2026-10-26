const fs = require('fs');

const firebaseConfigStr = fs.readFileSync('src/config/firebase.js', 'utf8');
const match = firebaseConfigStr.match(/const firebaseConfig = ({[\s\S]*?});/);

if (match && match[1]) {
  const configObj = eval('(' + match[1] + ')');
  
  import('firebase/app').then(({ initializeApp }) => {
    import('firebase/firestore').then(({ getFirestore, doc, getDoc }) => {
      const app = initializeApp(configObj);
      const db = getFirestore(app);

      async function checkUser() {
        try {
          // Check 'kh5c'
          let docRef = doc(db, "users", "kh5c");
          let docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.log("Found kh5c:", docSnap.data());
          } else {
            console.log("kh5c not found");
          }
          
          // Check 'kh5c@green.de'
          docRef = doc(db, "users", "kh5c@green.de");
          docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.log("Found kh5c@green.de:", docSnap.data());
          } else {
            console.log("kh5c@green.de not found");
          }

          process.exit(0);
        } catch (e) {
          console.error(e);
          process.exit(1);
        }
      }
      checkUser();
    });
  });
}
