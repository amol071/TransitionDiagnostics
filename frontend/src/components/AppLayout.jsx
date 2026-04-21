import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    House, Users, ClipboardText, UserCircle, UsersThree, ChartBar, Files,
    Shield, SignOut, Target, List as ListIcon, X, FolderOpen,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";

const NAV = [
    { to: "/app", label: "Dashboard", icon: House, roles: ["admin","coordinator","employee","manager","panel","hr","hrbp","stakeholder"] },
    { to: "/app/nominees", label: "Nominees", icon: Users, roles: ["admin","coordinator","hr","hrbp"] },
    { to: "/app/cases", label: "Cases", icon: ClipboardText, roles: ["admin","coordinator","manager","panel","hr","hrbp","employee","stakeholder"] },
    { to: "/app/uploads", label: "Upload Center", icon: FolderOpen, roles: ["admin","coordinator","hr","hrbp"] },
    { to: "/app/status", label: "Status Dashboard", icon: ChartBar, roles: ["admin","coordinator","hr","hrbp"] },
    { to: "/app/audit", label: "Audit Log", icon: Files, roles: ["admin","coordinator"] },
];

export default function AppLayout() {
    const { user, logout, hasRole } = useAuth();
    const nav = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    if (!user) {
        nav("/login");
        return null;
    }

    const visibleNav = NAV.filter((n) => n.roles.some((r) => user.roles.includes(r)));

    const crumbs = location.pathname.split("/").filter(Boolean);

    return (
        <div className="min-h-screen flex bg-[#F8FAFC]">
            {/* Sidebar */}
            <aside className={`fixed md:static z-40 inset-y-0 left-0 w-60 bg-white border-r border-slate-200 flex flex-col transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
                <div className="h-14 flex items-center px-4 border-b border-slate-200">
                    <Link to="/app" className="flex items-center gap-2" data-testid="sidebar-brand">
                        <div className="w-7 h-7 rounded bg-slate-900 text-white grid place-items-center">
                            <Target size={16} weight="bold" />
                        </div>
                        <div>
                            <div className="font-semibold text-slate-900 leading-tight">LDC AI</div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-500">Leadership Dev Center</div>
                        </div>
                    </Link>
                </div>
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {visibleNav.map((n) => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            end={n.to === "/app"}
                            data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g,"-")}`}
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                                    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                                }`
                            }
                            onClick={() => setMobileOpen(false)}
                        >
                            <n.icon size={16} weight="bold" />
                            {n.label}
                        </NavLink>
                    ))}
                    {hasRole("admin") && (
                        <NavLink to="/admin" data-testid="nav-admin-center"
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                                    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                                }`
                            }>
                            <Shield size={16} weight="bold" />
                            Admin Center
                        </NavLink>
                    )}
                </nav>
                <div className="p-3 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                        <UserCircle size={28} weight="fill" className="text-slate-400" />
                        <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{user.name}</div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-500 truncate">
                                {user.roles.join(" · ")}
                            </div>
                        </div>
                    </div>
                    <button
                        data-testid="logout-btn"
                        onClick={() => { logout(); nav("/login"); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-slate-700 hover:bg-slate-100"
                    >
                        <SignOut size={16} />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} data-testid="menu-toggle">
                            {mobileOpen ? <X size={20} /> : <ListIcon size={20} />}
                        </button>
                        <nav className="text-sm text-slate-500 truncate">
                            <Link to="/" className="hover:text-slate-900">Home</Link>
                            {crumbs.map((c, i) => (
                                <span key={i}> <span className="mx-1 text-slate-300">/</span> <span className={i === crumbs.length - 1 ? "text-slate-900 font-medium" : ""}>{c}</span></span>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/" className="text-xs text-slate-500 hover:text-slate-900" data-testid="back-to-modules">← Modules</Link>
                        <UsersThree size={16} className="text-slate-400" />
                        <span className="text-xs text-slate-500 hidden sm:block">{user.email}</span>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
