import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem("ldc_user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("ldc_token", data.token);
        localStorage.setItem("ldc_user", JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem("ldc_token");
        localStorage.removeItem("ldc_user");
        setUser(null);
    };

    useEffect(() => {
        const token = localStorage.getItem("ldc_token");
        if (token && !user) {
            setLoading(true);
            api.get("/auth/me").then(({ data }) => {
                setUser(data);
                localStorage.setItem("ldc_user", JSON.stringify(data));
            }).catch(() => logout()).finally(() => setLoading(false));
        }
    }, []);

    const hasRole = (...roles) => user?.roles?.some((r) => roles.includes(r));

    return <AuthCtx.Provider value={{ user, login, logout, hasRole, loading }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
