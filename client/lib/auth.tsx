import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: "student" | "admin";
    adNo?: number;
}

export interface AuthState {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
}

const TOKEN_KEY = "dhdc_auth_token";

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<AuthUser>;
    register: (
        name: string,
        email: string,
        password: string,
        role?: "student" | "admin",
    ) => Promise<AuthUser>;
    logout: () => void;
    studentLogin: (adNo: string, name: string) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: null,
        loading: true,
    });

    useEffect(() => {
        const token = getToken();
        if (token) {
            fetchMe(token);
        } else {
            setState((prev) => ({ ...prev, loading: false }));
        }
    }, []);

    const fetchMe = async (token: string) => {
        try {
            const response = await fetch("/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setState({ user: data.user, token, loading: false });
            } else {
                clearToken();
                setState({ user: null, token: null, loading: false });
            }
        } catch {
            clearToken();
            setState({ user: null, token: null, loading: false });
        }
    };

    const login = async (email: string, password: string) => {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error("Login failed");
        }

        const data = await response.json();
        setToken(data.token);
        setState({ user: data.user, token: data.token, loading: false });
        return data.user;
    };

    const register = async (
        name: string,
        email: string,
        password: string,
        role: "student" | "admin" = "student",
    ) => {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role }),
        });

        if (!response.ok) {
            throw new Error("Registration failed");
        }

        const data = await response.json();
        setToken(data.token);
        setState({ user: data.user, token: data.token, loading: false });
        return data.user;
    };

    const logout = () => {
        clearToken();
        setState({ user: null, token: null, loading: false });
    };

    const studentLogin = async (adNo: string, name: string) => {
        const response = await fetch("/api/auth/student-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adNo, name }),
        });

        if (!response.ok) {
            throw new Error("Student login failed");
        }

        const data = await response.json();
        setToken(data.token);
        setState({ user: data.user, token: data.token, loading: false });
        // Although the current interface expects returning AuthUser, 
        // passing data.user matches the pattern of other functions.
        return data.user;
    };

    return (
        <AuthContext.Provider value={{ ...state, login, register, logout, studentLogin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
