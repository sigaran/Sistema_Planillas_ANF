import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// En este entorno de desarrollo específico (que se ejecuta en la infraestructura de Google),
// el SDK de Firebase puede detectar automáticamente el proyecto utilizando las
// "Credenciales Predeterminadas de la Aplicación" (Application Default Credentials).
// Por lo tanto, solo se necesita el ID del proyecto. Para un despliegue
// en un entorno externo (como Vercel o local), se necesitaría la configuración completa.
const firebaseConfig = {
  projectId: "sistema-de-planillas",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
