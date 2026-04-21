import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { humanDate, DOC_TYPE_LABELS, DOC_TYPES } from "@/lib/utils-ldc";
import { CheckCircle, UploadSimple, Trash, Clock, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function Uploads() {
    const { caseId } = useParams();
    const [data, setData] = useState({ documents: [], latest_by_type: {} });
    const [c, setC] = useState(null);
    const [busyType, setBusyType] = useState("");
    const [deletingId, setDeletingId] = useState("");
    const [confirmDoc, setConfirmDoc] = useState(null);
    const fileRefs = useRef({});

    const reload = async () => {
        const [cd, dd] = await Promise.all([
            api.get(`/cases/${caseId}`).then(r => r.data),
            api.get(`/cases/${caseId}/documents`).then(r => r.data),
        ]);
        setC(cd); setData(dd);
    };
    useEffect(() => { reload(); }, [caseId]);

    const upload = async (docType, file) => {
        if (!file) return;
        setBusyType(docType);
        const fd = new FormData();
        fd.append("doc_type", docType);
        fd.append("file", file);
        try {
            await api.post(`/cases/${caseId}/documents`, fd);
            toast.success("Uploaded");
            await reload();
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Upload failed");
        } finally {
            setBusyType("");
        }
    };

    const confirmDelete = async () => {
        if (!confirmDoc) return;
        setDeletingId(confirmDoc.id);
        try {
            await api.delete(`/cases/${caseId}/documents/${confirmDoc.id}`);
            toast.success("Document deleted");
            await reload();
            setConfirmDoc(null);
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Delete failed");
        } finally {
            setDeletingId("");
        }
    };

    const token = localStorage.getItem("ldc_token");
    const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

    return (
        <div className="space-y-5 animate-fade-in" data-testid="uploads-page">
            {c && <div>
                <Link to={`/app/cases/${c.id}`} className="text-xs text-slate-500 hover:text-slate-900">← Back to case</Link>
                <div className="ldc-label mt-1">{c.employee?.name} · {c.fiscal_year}</div>
                <h1 className="text-2xl font-semibold tracking-tight mt-1">Upload Center</h1>
            </div>}

            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200 ldc-section-title">Document status</div>
                <table className="ldc-table w-full">
                    <thead><tr><th>Document</th><th>Status</th><th>Latest</th><th className="w-64"></th></tr></thead>
                    <tbody>
                        {DOC_TYPES.map((t) => {
                            const latest = data.latest_by_type[t];
                            return (
                                <tr key={t} data-testid={`doc-row-${t}`}>
                                    <td>
                                        <div className="font-semibold text-sm">{DOC_TYPE_LABELS[t]}</div>
                                        <div className="text-xs text-slate-500">{t}</div>
                                    </td>
                                    <td>
                                        {busyType === t ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 animate-pulse"><UploadSimple size={12} /> Uploading…</span>
                                        ) : latest ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle size={12} weight="fill" /> Uploaded</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"><Clock size={12} /> Missing</span>
                                        )}
                                    </td>
                                    <td className="text-xs">
                                        {latest ? (
                                            <div>
                                                <a href={`${API}/documents/${latest.id}/download?auth=${token}`} target="_blank" rel="noreferrer" className="text-slate-900 font-semibold hover:underline">{latest.original_filename}</a>
                                                <div className="text-slate-400">v{latest.version} · {humanDate(latest.uploaded_at)}</div>
                                            </div>
                                        ) : <span className="text-slate-400">—</span>}
                                    </td>
                                    <td className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <input
                                                type="file"
                                                ref={el => (fileRefs.current[t] = el)}
                                                onChange={(e) => { upload(t, e.target.files?.[0]); e.target.value = ""; }}
                                                className="hidden"
                                                data-testid={`file-input-${t}`}
                                            />
                                            <button
                                                onClick={() => fileRefs.current[t]?.click()}
                                                disabled={busyType === t}
                                                data-testid={`upload-${t}`}
                                                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                                            >
                                                <UploadSimple size={12} /> {latest ? "Replace" : "Upload"}
                                            </button>
                                            {latest && (
                                                <button
                                                    onClick={() => setConfirmDoc(latest)}
                                                    disabled={deletingId === latest.id}
                                                    data-testid={`delete-${t}`}
                                                    aria-label={`Delete ${DOC_TYPE_LABELS[t]}`}
                                                    title={`Delete ${DOC_TYPE_LABELS[t]}`}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border border-red-200 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    <Trash size={12} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="ldc-panel">
                <div className="p-4 border-b border-slate-200 ldc-section-title">Version history ({data.documents.length})</div>
                <table className="ldc-table w-full">
                    <thead><tr><th>Type</th><th>Filename</th><th>Version</th><th>Uploaded</th><th className="w-28"></th></tr></thead>
                    <tbody>
                        {data.documents.map((d) => (
                            <tr key={d.id}>
                                <td>{DOC_TYPE_LABELS[d.doc_type] || d.doc_type}</td>
                                <td>
                                    <a href={`${API}/documents/${d.id}/download?auth=${token}`} target="_blank" rel="noreferrer" className="hover:underline">{d.original_filename}</a>
                                    {d.is_latest && <span className="ml-2 text-[10px] font-semibold text-emerald-700 uppercase tracking-widest">Latest</span>}
                                </td>
                                <td>v{d.version}</td>
                                <td className="text-xs text-slate-500">{humanDate(d.uploaded_at)}</td>
                                <td className="text-right">
                                    <button
                                        onClick={() => setConfirmDoc(d)}
                                        disabled={deletingId === d.id}
                                        data-testid={`delete-history-${d.id}`}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        <Trash size={10} /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {data.documents.length === 0 && <tr><td colSpan={5} className="text-center text-sm text-slate-400 py-4">No uploads yet.</td></tr>}
                    </tbody>
                </table>
            </div>

            {confirmDoc && (
                <ConfirmDeleteDialog
                    doc={confirmDoc}
                    loading={deletingId === confirmDoc.id}
                    onCancel={() => setConfirmDoc(null)}
                    onConfirm={confirmDelete}
                />
            )}
        </div>
    );
}

function ConfirmDeleteDialog({ doc, onCancel, onConfirm, loading }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" role="dialog">
            <div className="bg-white rounded-md border border-slate-200 shadow-xl w-full max-w-md" data-testid="confirm-delete-dialog">
                <div className="p-4 border-b border-slate-200 flex items-center gap-2">
                    <Warning size={18} weight="fill" className="text-red-500" />
                    <div className="font-semibold">Delete document?</div>
                </div>
                <div className="p-4 text-sm text-slate-600 space-y-2">
                    <p>You are about to delete <strong className="text-slate-900">{doc.original_filename}</strong> (v{doc.version}).</p>
                    {doc.is_latest && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                            This is the latest version. If an earlier version exists it will be promoted to latest; otherwise the document status will revert to “Missing”.
                        </p>
                    )}
                </div>
                <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        data-testid="confirm-delete-cancel"
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        data-testid="confirm-delete-confirm"
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60 inline-flex items-center gap-1"
                    >
                        <Trash size={12} /> {loading ? "Deleting…" : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}
