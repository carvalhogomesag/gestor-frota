// firebase-init.js

// Importe as funções necessárias do SDK do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// A SUA CONFIGURAÇÃO DO FIREBASE VAI AQUI
// (A mesma que usou no início da nossa jornada)
const firebaseConfig = {
    apiKey: "AIzaSyAPkZdMVTBWXD6w_s90XBZDSCgtFLYH5Ek",
    authDomain: "centro-de-custos.firebaseapp.com",
    projectId: "centro-de-custos",
    storageBucket: "centro-de-custos.firebasestorage.app",
    messagingSenderId: "654421336122",
    appId: "1:654421336122:web:b4360797ce5cc2e2e39503"
  };


// Inicializar o Firebase
const app = initializeApp(firebaseConfig);

// Exportar a instância da base de dados para ser usada noutros ficheiros
export const db = getFirestore(app);