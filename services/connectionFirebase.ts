import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, type FirebaseOptions } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { Platform } from "react-native";

import firebaseJson from "../firebase.json";

function loadFirebaseConfig(): FirebaseOptions {
  const c = firebaseJson as Partial<FirebaseOptions>;
  if (!c.apiKey || !c.authDomain || !c.projectId) {
    throw new Error(
      "Firebase: crie firebase.json a partir de firebase.json.example e preencha com as credenciais do console (Projeto → Configurações do app)."
    );
  }
  return c as FirebaseOptions;
}

const firebaseConfig = loadFirebaseConfig();

const app = initializeApp(firebaseConfig);

function createAuth(): Auth {
  if (Platform.OS === "web") {
    return getAuth(app);
  }
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const database = getDatabase(app);


export default app;
