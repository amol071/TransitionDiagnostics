"""LDC AI Platform - Backend API regression tests (pytest)."""
import io
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # fallback to frontend/.env if env var not exported
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE_URL = line.split("=", 1)[1].strip()
                break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

ACCOUNTS = {
    "admin": ("admin@ldc.io", "Admin@123"),
    "alice": ("alice.emp@ldc.io", "Demo@123"),
    "bob": ("bob.emp@ldc.io", "Demo@123"),
    "diana": ("diana.emp@ldc.io", "Demo@123"),
    "manager": ("mary.mgr@ldc.io", "Demo@123"),
    "panel_peter": ("peter.panel@ldc.io", "Demo@123"),
    "panel_sara": ("sara.panel@ldc.io", "Demo@123"),
    "hr": ("hr.lead@ldc.io", "Demo@123"),
    "stake": ("stake.one@ldc.io", "Demo@123"),
}


# ----------------- Fixtures -----------------
@pytest.fixture(scope="session")
def tokens():
    out = {}
    for key, (email, pw) in ACCOUNTS.items():
        r = requests.post(f"{API}/auth/login", json={"email": email, "password": pw}, timeout=30)
        assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text[:200]}"
        out[key] = r.json()["token"]
    return out


def H(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def admin_me(tokens):
    r = requests.get(f"{API}/auth/me", headers=H(tokens["admin"]), timeout=20)
    assert r.status_code == 200
    return r.json()


@pytest.fixture(scope="session")
def employees(tokens):
    r = requests.get(f"{API}/employees", headers=H(tokens["admin"]), timeout=20)
    assert r.status_code == 200
    return r.json()


@pytest.fixture(scope="session")
def cases_admin(tokens):
    r = requests.get(f"{API}/cases", headers=H(tokens["admin"]), timeout=30)
    assert r.status_code == 200, r.text[:300]
    return r.json()


# ----------------- Auth -----------------
class TestAuth:
    def test_login_all_accounts(self, tokens):
        assert len(tokens) == len(ACCOUNTS)
        for k, t in tokens.items():
            assert isinstance(t, str) and len(t) > 20

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "nope@x", "password": "x"}, timeout=15)
        assert r.status_code == 401

    def test_me_roles(self, tokens):
        expected = {
            "admin": {"admin", "coordinator"},
            "alice": {"employee"},
            "manager": {"manager"},
            "panel_peter": {"panel"},
            "hr": {"hr"},
            "stake": {"stakeholder"},
        }
        for k, exp in expected.items():
            r = requests.get(f"{API}/auth/me", headers=H(tokens[k]), timeout=15)
            assert r.status_code == 200, f"{k}: {r.text}"
            roles = set(r.json()["roles"])
            assert exp.issubset(roles), f"{k} missing roles {exp} got {roles}"

    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_me_invalid_token(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer bad.token"}, timeout=10)
        assert r.status_code == 401


# ----------------- Capabilities / Employees -----------------
class TestSeed:
    def test_capabilities(self, tokens):
        r = requests.get(f"{API}/capabilities", headers=H(tokens["admin"]), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 8, f"Expected 8 capabilities, got {len(data)}"
        for c in data:
            assert "code" in c and "pillar" in c and "category" in c

    def test_employees(self, tokens):
        r = requests.get(f"{API}/employees", headers=H(tokens["admin"]), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 3, f"Expected 3 employees, got {len(data)}"


# ----------------- Cases filtering -----------------
class TestCases:
    def test_admin_sees_all(self, cases_admin):
        assert len(cases_admin) == 3, f"admin should see 3 cases, got {len(cases_admin)}"
        for c in cases_admin:
            assert "employee" in c and c["employee"] is not None
            assert "_id" not in c

    def test_employee_sees_own(self, tokens):
        r = requests.get(f"{API}/cases", headers=H(tokens["alice"]), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        for c in data:
            assert c["employee"]["email"] == "alice.emp@ldc.io"

    def test_manager_sees_assigned(self, tokens):
        r = requests.get(f"{API}/cases", headers=H(tokens["manager"]), timeout=15)
        assert r.status_code == 200
        # Mary manages all 3 per seed
        assert len(r.json()) >= 1

    def test_panel_sees_assigned(self, tokens):
        r = requests.get(f"{API}/cases", headers=H(tokens["panel_peter"]), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1, "Peter should see panel cases"

    def test_get_case_enriched(self, cases_admin, tokens):
        cid = cases_admin[0]["id"]
        r = requests.get(f"{API}/cases/{cid}", headers=H(tokens["admin"]), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == cid
        assert d.get("employee", {}).get("name")

    def test_get_case_404(self, tokens):
        r = requests.get(f"{API}/cases/does-not-exist", headers=H(tokens["admin"]), timeout=15)
        assert r.status_code == 404

    def test_employee_cannot_create(self, tokens, employees):
        payload = {"employee_id": employees[0]["id"], "fiscal_year": "FY26"}
        r = requests.post(f"{API}/cases", headers=H(tokens["alice"]), json=payload, timeout=15)
        assert r.status_code == 403

    def test_unauthenticated_cases(self):
        r = requests.get(f"{API}/cases", timeout=10)
        assert r.status_code == 401

    def test_admin_create_duplicate_blocked(self, tokens, employees):
        """Existing seeded case for Alice FY25 standard -> duplicate should 400."""
        alice = next((e for e in employees if e["email"] == "alice.emp@ldc.io"), None)
        assert alice
        # pick any existing case for alice
        r = requests.get(f"{API}/cases", headers=H(tokens["admin"]), timeout=15)
        alice_case = next((c for c in r.json() if c["employee_id"] == alice["id"]), None)
        if not alice_case:
            pytest.skip("no alice case to test duplicate against")
        payload = {
            "employee_id": alice["id"],
            "fiscal_year": alice_case["fiscal_year"],
            "is_renomination": alice_case.get("is_renomination", False),
        }
        r = requests.post(f"{API}/cases", headers=H(tokens["admin"]), json=payload, timeout=15)
        assert r.status_code in (400, 409), f"expected duplicate rejection, got {r.status_code}: {r.text[:200]}"


# ----------------- Launch & Reopen -----------------
class TestLaunchReopen:
    def test_launch_case_stage(self, cases_admin, tokens):
        # pick diana's draft case
        draft = next((c for c in cases_admin if c["status"] == "draft"), cases_admin[0])
        r = requests.post(
            f"{API}/cases/{draft['id']}/launch",
            headers=H(tokens["admin"]), json={"stage": "case"}, timeout=15,
        )
        assert r.status_code == 200, r.text[:200]
        d = r.json()
        assert d["is_launched"] is True

    def test_launch_panel_stage(self, cases_admin, tokens):
        # pick alice case (panel_in_progress already)
        target = next((c for c in cases_admin if c["status"].startswith("panel")), cases_admin[0])
        r = requests.post(
            f"{API}/cases/{target['id']}/launch",
            headers=H(tokens["admin"]), json={"stage": "panel"}, timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["is_panel_launched"] is True

    def test_non_admin_cannot_reopen(self, cases_admin, tokens):
        cid = cases_admin[0]["id"]
        r = requests.post(
            f"{API}/cases/{cid}/reopen",
            headers=H(tokens["manager"]), json={"form": "employee"}, timeout=15,
        )
        assert r.status_code == 403

    def test_admin_reopen_all_forms(self, cases_admin, tokens):
        cid = cases_admin[0]["id"]
        for form in ["employee", "manager", "panel", "hr"]:
            r = requests.post(
                f"{API}/cases/{cid}/reopen",
                headers=H(tokens["admin"]), json={"form": form}, timeout=15,
            )
            assert r.status_code == 200, f"reopen {form}: {r.status_code} {r.text[:200]}"

    def test_reopen_invalid_form(self, cases_admin, tokens):
        cid = cases_admin[0]["id"]
        r = requests.post(
            f"{API}/cases/{cid}/reopen",
            headers=H(tokens["admin"]), json={"form": "bogus"}, timeout=15,
        )
        assert r.status_code == 400


# ----------------- Forms -----------------
class TestForms:
    def _alice_case(self, tokens):
        r = requests.get(f"{API}/cases", headers=H(tokens["alice"]), timeout=15)
        assert r.status_code == 200
        cases = r.json()
        return cases[0]["id"]

    def test_employee_form_get_put_submit_lock(self, tokens):
        cid = self._alice_case(tokens)
        # Ensure reopened by admin first
        requests.post(f"{API}/cases/{cid}/reopen", headers=H(tokens["admin"]),
                      json={"form": "employee"}, timeout=15)
        r = requests.get(f"{API}/cases/{cid}/employee-form", headers=H(tokens["alice"]), timeout=15)
        assert r.status_code == 200
        # Save draft
        payload = {"overall_reflection": "TEST draft", "contributions": [], "capability_responses": [], "status": "draft"}
        r = requests.put(f"{API}/cases/{cid}/employee-form",
                         headers=H(tokens["alice"]), json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "draft"
        # Submit
        payload["status"] = "submitted"
        payload["overall_reflection"] = "TEST submitted"
        r = requests.put(f"{API}/cases/{cid}/employee-form",
                         headers=H(tokens["alice"]), json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "submitted"
        # Try editing - should fail (400)
        payload["status"] = "draft"
        payload["overall_reflection"] = "TEST edited-after-submit"
        r = requests.put(f"{API}/cases/{cid}/employee-form",
                         headers=H(tokens["alice"]), json=payload, timeout=15)
        assert r.status_code == 400

    def test_manager_form_submit_lock(self, tokens):
        cid = self._alice_case(tokens)
        requests.post(f"{API}/cases/{cid}/reopen", headers=H(tokens["admin"]),
                      json={"form": "manager"}, timeout=15)
        payload = {"overall_rationale": "TEST", "readiness": "moderate",
                   "capability_responses": [], "stakeholders": [], "status": "submitted"}
        r = requests.put(f"{API}/cases/{cid}/manager-form",
                         headers=H(tokens["manager"]), json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "submitted"
        # re-submit with draft should 400
        payload["status"] = "draft"
        r = requests.put(f"{API}/cases/{cid}/manager-form",
                         headers=H(tokens["manager"]), json=payload, timeout=15)
        assert r.status_code == 400

    def test_stakeholder_mine_flow(self, tokens):
        cid = self._alice_case(tokens)
        r = requests.get(f"{API}/cases/{cid}/stakeholder-feedback/mine",
                         headers=H(tokens["stake"]), timeout=15)
        assert r.status_code == 200
        current_status = r.json().get("status", "draft")
        # If already submitted by seed, a draft PUT must be rejected (readonly-after-submit)
        draft_payload = {"comments": "TEST stake", "capability_responses": [], "status": "draft"}
        r = requests.put(f"{API}/cases/{cid}/stakeholder-feedback/mine",
                         headers=H(tokens["stake"]), json=draft_payload, timeout=15)
        if current_status == "submitted":
            assert r.status_code == 400, f"submitted feedback should be readonly, got {r.status_code}"
        else:
            assert r.status_code == 200
            # Submit it
            sub_payload = {**draft_payload, "status": "submitted"}
            r = requests.put(f"{API}/cases/{cid}/stakeholder-feedback/mine",
                             headers=H(tokens["stake"]), json=sub_payload, timeout=15)
            assert r.status_code == 200
            assert r.json()["status"] == "submitted"
            assert r.json()["stakeholder_email"] == "stake.one@ldc.io"

    def test_panel_mine_flow(self, tokens):
        cid = self._alice_case(tokens)
        requests.post(f"{API}/cases/{cid}/reopen", headers=H(tokens["admin"]),
                      json={"form": "panel"}, timeout=15)
        payload = {"overall_rating": "moderate", "overall_rationale": "TEST panel",
                   "capability_ratings": [], "discussion_notes": "", "status": "draft"}
        r = requests.put(f"{API}/cases/{cid}/panel-review/mine",
                         headers=H(tokens["panel_peter"]), json=payload, timeout=15)
        assert r.status_code == 200
        # read back
        r = requests.get(f"{API}/cases/{cid}/panel-review/mine",
                        headers=H(tokens["panel_peter"]), timeout=15)
        assert r.status_code == 200
        assert r.json()["overall_rationale"] == "TEST panel"

    def test_hr_flow(self, tokens):
        cid = self._alice_case(tokens)
        requests.post(f"{API}/cases/{cid}/reopen", headers=H(tokens["admin"]),
                      json={"form": "hr"}, timeout=15)
        payload = {"overall_summary": "TEST hr", "strengths": ["s1"], "improvements": ["i1"],
                   "additional_feedback": "", "development_plan": "", "readiness": "strong",
                   "status": "draft"}
        r = requests.put(f"{API}/cases/{cid}/hr-review",
                         headers=H(tokens["hr"]), json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json()["overall_summary"] == "TEST hr"


# ----------------- Dashboard / Status / Audit -----------------
class TestDashboard:
    def test_dashboard_admin(self, tokens):
        r = requests.get(f"{API}/dashboard/summary", headers=H(tokens["admin"]), timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("total_cases", "in_progress", "finalized", "renominations", "my_pending"):
            assert k in d
        assert d["total_cases"] >= 3

    def test_status_matrix(self, tokens):
        r = requests.get(f"{API}/status", headers=H(tokens["admin"]), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 3
        keys = {"case", "employee", "employee_form", "manager_form",
                "stakeholder_submitted", "panel_submitted", "hr_form"}
        assert keys.issubset(set(data[0].keys()))

    def test_audit_logs(self, tokens):
        r = requests.get(f"{API}/audit", headers=H(tokens["admin"]), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ----------------- AI -----------------
class TestAI:
    def test_ai_write_improve(self, tokens):
        r = requests.post(f"{API}/ai/write",
                          headers=H(tokens["admin"]),
                          json={"text": "she led team good.", "mode": "improve"},
                          timeout=90)
        assert r.status_code == 200, r.text[:300]
        out = r.json()
        assert isinstance(out.get("text"), str) and len(out["text"]) > 5

    @pytest.mark.parametrize("atype", [
        "quick_brief", "bias_check", "capability_gap", "stakeholder_suggest",
    ])
    def test_ai_analyze_types(self, tokens, cases_admin, atype):
        cid = cases_admin[0]["id"]
        r = requests.post(f"{API}/ai/analyze",
                          headers=H(tokens["admin"]),
                          json={"case_id": cid, "analysis_type": atype},
                          timeout=120)
        assert r.status_code == 200, f"{atype}: {r.status_code} {r.text[:300]}"
        d = r.json()
        assert d["analysis_type"] == atype
        assert isinstance(d.get("structured"), dict)

    def test_ai_analyze_unknown_case(self, tokens):
        r = requests.post(f"{API}/ai/analyze",
                          headers=H(tokens["admin"]),
                          json={"case_id": "nope", "analysis_type": "quick_brief"},
                          timeout=30)
        assert r.status_code == 404

    def test_ai_latest(self, tokens, cases_admin):
        cid = cases_admin[0]["id"]
        r = requests.get(f"{API}/ai/case/{cid}/latest",
                         headers=H(tokens["admin"]), timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d, dict)
        # We previously ran analyses; should have at least one type
        assert len(d) >= 1


# ----------------- Documents -----------------
class TestDocuments:
    def test_upload_list_download_delete(self, tokens, cases_admin):
        cid = cases_admin[0]["id"]
        # Upload
        files = {"file": ("TEST_doc.txt", io.BytesIO(b"hello LDC document test"), "text/plain")}
        data = {"doc_type": "profile"}
        r = requests.post(
            f"{API}/cases/{cid}/documents",
            headers={"Authorization": f"Bearer {tokens['admin']}"},
            files=files, data=data, timeout=120,
        )
        assert r.status_code == 200, f"upload failed: {r.status_code} {r.text[:300]}"
        doc = r.json()
        assert doc["original_filename"] == "TEST_doc.txt"
        assert doc["is_latest"] is True
        doc_id = doc["id"]

        # List
        r = requests.get(f"{API}/cases/{cid}/documents",
                         headers=H(tokens["admin"]), timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert any(d["id"] == doc_id for d in body["documents"])
        assert body["latest_by_type"].get("profile", {}).get("id") == doc_id

        # Download with ?auth=
        r = requests.get(f"{API}/documents/{doc_id}/download?auth={tokens['admin']}", timeout=60)
        assert r.status_code == 200
        assert b"hello LDC document test" in r.content

        # Download without auth -> 401
        r = requests.get(f"{API}/documents/{doc_id}/download", timeout=20)
        assert r.status_code == 401

        # Delete (soft)
        r = requests.delete(f"{API}/cases/{cid}/documents/{doc_id}",
                            headers=H(tokens["admin"]), timeout=15)
        assert r.status_code == 200

        # Verify removed from list
        r = requests.get(f"{API}/cases/{cid}/documents",
                         headers=H(tokens["admin"]), timeout=15)
        ids = [d["id"] for d in r.json()["documents"]]
        assert doc_id not in ids

    def test_upload_bad_doc_type(self, tokens, cases_admin):
        cid = cases_admin[0]["id"]
        files = {"file": ("x.txt", io.BytesIO(b"x"), "text/plain")}
        data = {"doc_type": "bogus_type"}
        r = requests.post(f"{API}/cases/{cid}/documents",
                          headers={"Authorization": f"Bearer {tokens['admin']}"},
                          files=files, data=data, timeout=30)
        assert r.status_code == 400

    def test_upload_case_not_found(self, tokens):
        files = {"file": ("x.txt", io.BytesIO(b"x"), "text/plain")}
        data = {"doc_type": "profile"}
        r = requests.post(f"{API}/cases/nope-id/documents",
                          headers={"Authorization": f"Bearer {tokens['admin']}"},
                          files=files, data=data, timeout=30)
        assert r.status_code == 404
