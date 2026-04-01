import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, remove, onDisconnect } from "firebase/database";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAxPcqHVUh6sa9LPKm54JKJZ7Yl-IE19y4",
  authDomain: "desafio-a07f8.firebaseapp.com",
  databaseURL: "https://desafio-a07f8-default-rtdb.firebaseio.com",
  projectId: "desafio-a07f8",
  storageBucket: "desafio-a07f8.firebasestorage.app",
  messagingSenderId: "306884831641",
  appId: "1:306884831641:web:73fd8ad64a1c132910cb08"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);
export { ref, onValue, set, push, remove, onDisconnect };
export { sRef, uploadBytes, getDownloadURL };
