import { auth } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  User
} from "firebase/auth";

// 1. Fungsi Login
export const login = async (email: string, pass: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  } catch (error: any) {
    console.error("Login Error:", error.message);
    throw error;
  }
};

// 2. Fungsi Register (Daftar Akun)
export const register = async (email: string, pass: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  } catch (error: any) {
    console.error("Register Error:", error.message);
    throw error;
  }
};

// 3. Fungsi Logout
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Logout Error:", error.message);
    throw error;
  }
};

// 4. Fungsi Cek User Aktif
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};