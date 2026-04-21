import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "sonner";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Nominees from "@/pages/Nominees";
import Cases from "@/pages/Cases";
import CaseDetail from "@/pages/CaseDetail";
import EmployeeForm from "@/pages/EmployeeForm";
import ManagerForm from "@/pages/ManagerForm";
import StakeholderForm from "@/pages/StakeholderForm";
import PanelReview from "@/pages/PanelReview";
import HRSummary from "@/pages/HRSummary";
import Uploads from "@/pages/Uploads";
import Status from "@/pages/Status";
import Audit from "@/pages/Audit";
import AdminCenter from "@/pages/AdminCenter";

function Protected({ children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster richColors position="top-right" />
                <Routes>
                    <Route path="/" element={<Protected><Landing /></Protected>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin" element={<Protected><AdminCenter /></Protected>} />
                    <Route path="/app" element={<Protected><AppLayout /></Protected>}>
                        <Route index element={<Dashboard />} />
                        <Route path="nominees" element={<Nominees />} />
                        <Route path="cases" element={<Cases />} />
                        <Route path="cases/:caseId" element={<CaseDetail />} />
                        <Route path="cases/:caseId/employee" element={<EmployeeForm />} />
                        <Route path="cases/:caseId/manager" element={<ManagerForm />} />
                        <Route path="cases/:caseId/stakeholder" element={<StakeholderForm />} />
                        <Route path="cases/:caseId/panel" element={<PanelReview />} />
                        <Route path="cases/:caseId/hr" element={<HRSummary />} />
                        <Route path="cases/:caseId/uploads" element={<Uploads />} />
                        <Route path="uploads" element={<Navigate to="/app/cases" replace />} />
                        <Route path="status" element={<Status />} />
                        <Route path="audit" element={<Audit />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
