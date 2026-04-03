import { createContext } from "react";

export type AuthContextType = {
  user: string | null;
  isAuthenticated: boolean;
  signIn: (userValue: string) => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);