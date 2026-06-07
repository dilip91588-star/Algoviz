import { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api/auth";

interface AuthContextType {
  token: string | null;
  username: string | null;
  avatarInitial: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("username"));
  const [avatarInitial, setAvatarInitial] = useState<string | null>(() => localStorage.getItem("avatarInitial"));

  const isAuthenticated = !!token;

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Login failed" }));
      throw new Error(error.message || "Login failed");
    }

    const data = await res.json();
    const { token: jwt, user } = data;
    
    // Server returns token and user object { id, name, email, avatarInitial }
    localStorage.setItem("token", jwt);
    localStorage.setItem("username", user.name);
    localStorage.setItem("avatarInitial", user.avatarInitial);
    
    setToken(jwt);
    setUsername(user.name);
    setAvatarInitial(user.avatarInitial);
  };

  const register = async (name: string, email: string, password: string) => {
    // Backend expects 'name', 'email', 'password' on /signup route
    const res = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Registration failed" }));
      throw new Error(error.message || "Registration failed");
    }

    // Backend currently doesn't auto-login after signup, it returns { message, userId }
    // We can just automatically log them in right after successful signup!
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("avatarInitial");
    setToken(null);
    setUsername(null);
    setAvatarInitial(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, avatarInitial, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
