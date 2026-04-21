import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Bell, CheckCircle } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { humanDate } from "@/lib/utils-ldc";

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState({ items: [], unread: 0 });
    const nav = useNavigate();

    const load = async () => {
        try {
            const { data } = await api.get("/notifications/mine");
            setData(data);
        } catch { /* silent */ }
    };

    useEffect(() => {
        load();
        const t = setInterval(load, 30000);
        return () => clearInterval(t);
    }, []);

    const markAll = async () => {
        await api.post("/notifications/read-all");
        load();
    };

    const openOne = async (n) => {
        if (!n.read) {
            await api.post(`/notifications/${n.id}/read`);
            load();
        }
        setOpen(false);
        if (n.case_id) nav(`/app/cases/${n.case_id}`);
    };

    return (
        <div className="relative">
            <button
                data-testid="notif-bell"
                onClick={() => setOpen(!open)}
                className="relative p-1.5 rounded hover:bg-slate-100"
                aria-label="Notifications"
            >
                <Bell size={16} weight={data.unread > 0 ? "fill" : "bold"} className={data.unread > 0 ? "text-amber-600" : "text-slate-600"} />
                {data.unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold bg-red-500 text-white grid place-items-center">
                        {data.unread > 9 ? "9+" : data.unread}
                    </span>
                )}
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-md shadow-lg z-40" data-testid="notif-panel">
                        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                            <div className="ldc-label">Notifications</div>
                            {data.unread > 0 && (
                                <button onClick={markAll} className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1" data-testid="notif-markall">
                                    <CheckCircle size={12} /> Mark all read
                                </button>
                            )}
                        </div>
                        <div className="max-h-96 overflow-auto">
                            {data.items.length === 0 ? (
                                <div className="p-6 text-center text-sm text-slate-400">No notifications yet.</div>
                            ) : data.items.map(n => (
                                <button
                                    key={n.id}
                                    data-testid={`notif-item-${n.id}`}
                                    onClick={() => openOne(n)}
                                    className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 ${n.read ? "" : "bg-amber-50/40"}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="text-sm font-semibold text-slate-900 leading-tight">{n.title}</div>
                                        {!n.read && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1"></span>}
                                    </div>
                                    <div className="text-xs text-slate-600 mt-0.5">{n.body}</div>
                                    <div className="text-[10px] text-slate-400 mt-1">{humanDate(n.created_at)}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
