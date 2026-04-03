import { useMemo, useState, type ReactNode } from "react";
import { AuthContext } from "./authContext";

function getStoredUser(): string | null {
  const storedUser = localStorage.getItem("user");
  return storedUser && storedUser.trim() !== "" ? storedUser : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(getStoredUser);

  const signIn = (userValue: string) => {
    localStorage.setItem("user", userValue);
    setUser(userValue);
  };

  const signOut = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      signIn,
      signOut,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}