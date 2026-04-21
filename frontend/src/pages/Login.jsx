import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Target, Info } from "@phosphor-icons/react";

const DEMOS = [
    { email: "admin@ldc.io", pw: "Admin@123", label: "Admin / Coordinator" },
    { email: "alice.emp@ldc.io", pw: "Demo@123", label: "Employee (Alice — panel stage)" },
    { email: "mary.mgr@ldc.io", pw: "Demo@123", label: "Manager" },
    { email: "peter.panel@ldc.io", pw: "Demo@123", label: "Panel Member" },
    { email: "hr.lead@ldc.io", pw: "Demo@123", label: "HR / HRBP" },
    { email: "stake.one@ldc.io", pw: "Demo@123", label: "Stakeholder" },
];

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState("admin@ldc.io");
    const [password, setPassword] = useState("Admin@123");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email.trim().toLowerCase(), password);
            nav("/app");
        } catch (err) {
            setError(err?.response?.data?.detail || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid md:grid-cols-2">
            <div className="hidden md:block relative bg-slate-900">
                <img
                    src="https://images.unsplash.com/photo-1583338850703-bc602b103674?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBpbnRlcmlvciUyMGFic3RyYWN0JTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc3Njc1Mzk2NHww&ixlib=rb-4.1.0&q=85"
                    alt="" className="absolute inset-0 w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-900/10 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10 text-white">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded bg-white text-slate-900 grid place-items-center">
                            <Target size={18} weight="bold" />
                        </div>
                        <div className="font-semibold">LDC AI Platform</div>
                    </div>
                    <h1 className="text-4xl font-semibold tracking-tight leading-tight max-w-md">
                        Evidence-based leadership readiness, assisted by AI, decided by humans.
                    </h1>
                    <p className="mt-4 text-sm text-white/80 max-w-md">
                        Multi-source synthesis across employee, manager, stakeholder, 360, psychometric and panel inputs.
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-center p-6 bg-white">
                <div className="w-full max-w-sm">
                    <Link to="/" className="text-xs text-slate-500 hover:text-slate-900" data-testid="login-back-link">← Back to modules</Link>
                    <h2 className="mt-4 text-2xl font-semibold text-slate-900">Sign in</h2>
                    <p className="text-sm text-slate-500 mt-1">Use a seeded demo account to explore every role.</p>
                    <form onSubmit={submit} className="mt-6 space-y-4" data-testid="login-form">
                        <div>
                            <label className="ldc-label block mb-1">Email</label>
                            <input
                                data-testid="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                required
                            />
                        </div>
                        <div>
                            <label className="ldc-label block mb-1">Password</label>
                            <input
                                data-testid="login-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                required
                            />
                        </div>
                        {error && <div className="text-sm text-red-600" data-testid="login-error">{error}</div>}
                        <button
                            data-testid="login-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 bg-slate-900 text-white rounded text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>
                    <div className="mt-6 border-t border-slate-200 pt-4">
                        <div className="flex items-center gap-1 ldc-label mb-2"><Info size={12} /> Demo accounts</div>
                        <div className="space-y-1">
                            {DEMOS.map((d) => (
                                <button
                                    key={d.email}
                                    type="button"
                                    data-testid={`demo-${d.email}`}
                                    onClick={() => { setEmail(d.email); setPassword(d.pw); }}
                                    className="w-full text-left text-xs font-mono px-2 py-1.5 rounded hover:bg-slate-100 border border-slate-200"
                                >
                                    <span className="text-slate-500">{d.label}:</span> {d.email} / {d.pw}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
