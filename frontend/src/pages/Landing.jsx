import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Target, Shield, ChartBar, MegaphoneSimple, ArrowRight, LockSimple, SignOut, UserCircle } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { currentFY } from "@/lib/utils-ldc";

const TILES = [
    {
        id: "mdc",
        title: "MDC",
        subtitle: "Management Development Center",
        desc: "Accelerated development pathway for mid-level managers. Structured reviews and growth planning.",
        icon: ChartBar,
        disabled: true,
    },
    {
        id: "ldc",
        title: "LDC",
        subtitle: "Leadership Development Center",
        desc: "Multi-source assessment of next-level leadership readiness with AI-assisted synthesis.",
        icon: Target,
        disabled: false,
    },
    {
        id: "lfp",
        title: "LFP",
        subtitle: "Leadership Feedback Process",
        desc: "Continuous 360-degree feedback loop for senior leadership cohort.",
        icon: MegaphoneSimple,
        disabled: true,
    },
];

export default function Landing() {
    const { user, logout } = useAuth();
    const nav = useNavigate();
    const fy = currentFY();

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-slate-900 text-white grid place-items-center">
                        <Target size={16} weight="bold" />
                    </div>
                    <div className="font-semibold" data-testid="app-brand">Transition Diagnostics</div>
                </div>
                <div className="flex items-center gap-3">
                    {user && (
                        <>
                            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                                <UserCircle size={16} className="text-slate-400" />
                                <span className="text-slate-700 font-medium">{user.name}</span>
                                <span className="text-slate-400">·</span>
                                <span>{user.roles.join(" · ")}</span>
                            </div>
                            <button
                                data-testid="landing-signout"
                                onClick={() => { logout(); nav("/login"); }}
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
                            >
                                <SignOut size={12} /> Sign out
                            </button>
                        </>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-16">
                <div className="max-w-2xl mb-16 animate-fade-in">
                    <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3" data-testid="landing-fy">
                        Transition Diagnostics ({fy})
                    </div>
                    <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight leading-tight">
                        One platform for leadership, readiness and structured talent decisions.
                    </h1>
                    <p className="mt-4 text-base text-slate-600 max-w-xl">
                        Choose a module to begin. LDC is live. MDC and LFP will roll out in upcoming cycles.
                    </p>
                </div>

                <section>
                    <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Modules</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {TILES.map((t) => {
                            const Icon = t.icon;
                            const content = (
                                <div
                                    data-testid={`tile-${t.id}`}
                                    className={`ldc-panel p-6 h-full flex flex-col transition-all ${
                                        t.disabled
                                            ? "opacity-50 grayscale cursor-not-allowed"
                                            : "hover:-translate-y-1 hover:shadow-sm hover:border-slate-400 cursor-pointer"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`w-10 h-10 rounded grid place-items-center ${t.disabled ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-white"}`}>
                                            <Icon size={22} weight="bold" />
                                        </div>
                                        {t.disabled ? (
                                            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                                                <LockSimple size={10} weight="bold" /> Coming soon
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">Live</span>
                                        )}
                                    </div>
                                    <div className="text-3xl font-semibold tracking-tight text-slate-900">{t.title}</div>
                                    <div className="text-sm font-medium text-slate-500 mt-1">{t.subtitle}</div>
                                    <p className="mt-4 text-sm text-slate-600 flex-1">{t.desc}</p>
                                    {!t.disabled && (
                                        <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-slate-900">
                                            Open module <ArrowRight size={14} weight="bold" />
                                        </div>
                                    )}
                                </div>
                            );
                            if (t.disabled) return <div key={t.id}>{content}</div>;
                            return (
                                <Link to="/app" key={t.id}>
                                    {content}
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {user?.roles?.includes("admin") && (
                    <section className="mt-12">
                        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Administration</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link to="/admin" data-testid="tile-admin">
                                <div className="ldc-panel p-6 h-full hover:-translate-y-1 hover:shadow-sm hover:border-slate-400 transition-all cursor-pointer">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-10 h-10 rounded bg-amber-500 text-white grid place-items-center">
                                            <Shield size={22} weight="bold" />
                                        </div>
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">Admin only</span>
                                    </div>
                                    <div className="text-2xl font-semibold tracking-tight text-slate-900">Admin Center</div>
                                    <div className="text-sm font-medium text-slate-500 mt-1">Users · Roles · Capabilities</div>
                                    <p className="mt-4 text-sm text-slate-600">
                                        Manage users, assign roles, seed capabilities, and monitor audit history across all modules.
                                    </p>
                                    <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-slate-900">
                                        Enter Admin <ArrowRight size={14} weight="bold" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </section>
                )}
            </main>
            <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
                © NovaCorp Talent Platform · {fy} · Internal use only
            </footer>
        </div>
    );
}
