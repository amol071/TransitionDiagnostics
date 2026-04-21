"""Tests for master-data routes (Companies, Functions, Business Units, Levels)
and for POST /api/employees denormalization + RBAC.

Covers:
- GET /api/master/companies, /functions, /business-units, /levels, /all
- Auth required (401 without token)
- POST /api/employees denormalizes master IDs -> strings (admin)
- POST /api/employees forbidden (403) for non admin/coordinator
- POST /api/employees with legacy (no master ids) still works
- Seed idempotency (counts identical on repeat calls)
- Regression smoke for /api/cases, /api/capabilities, /api/employees,
  /api/dashboard/summary, login
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE_URL = line.split("=", 1)[1].strip()
                break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


def H(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login",
                      json={"email": "admin@ldc.io", "password": "Admin@123"}, timeout=30)
    assert r.status_code == 200, r.text[:200]
    return r.json()["token"]


@pytest.fixture(scope="module")
def manager_token():
    r = requests.post(f"{API}/auth/login",
                      json={"email": "mary.mgr@ldc.io", "password": "Demo@123"}, timeout=30)
    assert r.status_code == 200
    return r.json()["token"]


@pytest.fixture(scope="module")
def employee_token():
    r = requests.post(f"{API}/auth/login",
                      json={"email": "alice.emp@ldc.io", "password": "Demo@123"}, timeout=30)
    assert r.status_code == 200
    return r.json()["token"]


# -------------------------------- Master: Companies --------------------------------
class TestMasterCompanies:
    def test_unauthenticated(self):
        r = requests.get(f"{API}/master/companies", timeout=15)
        assert r.status_code == 401

    def test_list(self, admin_token):
        r = requests.get(f"{API}/master/companies", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 8, f"expected >=8 companies, got {len(data)}"
        # required fields + no _id
        for c in data:
            assert "_id" not in c
            assert isinstance(c.get("name"), str) and c["name"]
            assert isinstance(c.get("code"), str) and c["code"]
            assert "short_name" in c
            assert "id" in c
        codes = {c["code"] for c in data}
        assert {"GCPL", "GPL", "GAVL", "GIL", "G&B", "GCAP", "GHF", "GFL"}.issubset(codes)


# -------------------------------- Master: Functions --------------------------------
class TestMasterFunctions:
    def test_unauthenticated(self):
        r = requests.get(f"{API}/master/functions", timeout=15)
        assert r.status_code == 401

    def test_list(self, admin_token):
        r = requests.get(f"{API}/master/functions", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 20, f"expected >=20 functions, got {len(data)}"
        for f in data:
            assert "_id" not in f
            assert f.get("code") and f.get("name")


# -------------------------------- Master: Business Units ----------------------------
class TestMasterBusinessUnits:
    def test_unauthenticated(self):
        r = requests.get(f"{API}/master/business-units", timeout=15)
        assert r.status_code == 401

    def test_list_and_company_link(self, admin_token):
        r_bu = requests.get(f"{API}/master/business-units",
                            headers=H(admin_token), timeout=15)
        assert r_bu.status_code == 200
        bus = r_bu.json()
        assert len(bus) >= 25, f"expected >=25 BUs, got {len(bus)}"

        r_co = requests.get(f"{API}/master/companies",
                            headers=H(admin_token), timeout=15)
        comps_by_code = {c["code"]: c for c in r_co.json()}
        for b in bus:
            assert "_id" not in b
            assert b.get("code") and b.get("name")
            assert b.get("company_code") in comps_by_code, \
                f"BU {b['code']} references unknown company_code {b.get('company_code')}"
            # company_id should match the company record
            assert b.get("company_id") == comps_by_code[b["company_code"]]["id"], \
                f"BU {b['code']} company_id does not match company {b['company_code']}"


# -------------------------------- Master: Levels ------------------------------------
class TestMasterLevels:
    def test_unauthenticated(self):
        r = requests.get(f"{API}/master/levels", timeout=15)
        assert r.status_code == 401

    def test_list_and_order(self, admin_token):
        r = requests.get(f"{API}/master/levels", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        lv = r.json()
        assert len(lv) == 9, f"expected 9 levels, got {len(lv)}"
        orders = [x["order"] for x in lv]
        assert orders == sorted(orders), "levels not sorted by order asc"
        for x in lv:
            assert "_id" not in x
            assert x.get("code") and x.get("name")
            assert x.get("band")
            assert x.get("ldc_level") in (1, 2, 3, 4), \
                f"ldc_level out of range for {x.get('code')}: {x.get('ldc_level')}"


# -------------------------------- Master: /all --------------------------------------
class TestMasterAll:
    def test_unauthenticated(self):
        r = requests.get(f"{API}/master/all", timeout=15)
        assert r.status_code == 401

    def test_aggregated(self, admin_token):
        r = requests.get(f"{API}/master/all", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("companies", "functions", "business_units", "levels"):
            assert k in d, f"missing key {k}"
            assert isinstance(d[k], list)
        assert len(d["companies"]) >= 8
        assert len(d["functions"]) >= 20
        assert len(d["business_units"]) >= 25
        assert len(d["levels"]) == 9


# -------------------------------- POST /api/employees -------------------------------
class TestEmployeeDenorm:
    def test_forbidden_for_manager(self, manager_token):
        r = requests.post(f"{API}/employees",
                          headers=H(manager_token),
                          json={"emp_id": "TEST_MGR_X", "name": "X"},
                          timeout=15)
        assert r.status_code == 403

    def test_forbidden_for_employee(self, employee_token):
        r = requests.post(f"{API}/employees",
                          headers=H(employee_token),
                          json={"emp_id": "TEST_EMP_X", "name": "X"},
                          timeout=15)
        assert r.status_code == 403

    def test_unauthenticated(self):
        r = requests.post(f"{API}/employees",
                          json={"emp_id": "TEST_NOAUTH", "name": "X"}, timeout=15)
        assert r.status_code == 401

    def test_denormalization_with_master_ids(self, admin_token):
        mr = requests.get(f"{API}/master/all",
                          headers=H(admin_token), timeout=15).json()
        comp = next(c for c in mr["companies"] if c["code"] == "GCPL")
        fn = next(f for f in mr["functions"] if f["code"] == "ENG")
        bu = next(b for b in mr["business_units"] if b["code"] == "GCPL-HC")
        lv = next(x for x in mr["levels"] if x["code"] == "M2")

        emp_id = f"TEST_DN_{uuid.uuid4().hex[:6]}"
        payload = {
            "emp_id": emp_id, "emp_code": emp_id,
            "name": "TEST Denorm User",
            "email": f"{emp_id.lower()}@test.example",
            "company_id": comp["id"], "function_id": fn["id"],
            "bu_id": bu["id"], "level_id": lv["id"],
        }
        r = requests.post(f"{API}/employees", headers=H(admin_token),
                          json=payload, timeout=15)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["company_id"] == comp["id"]
        assert d["function_id"] == fn["id"]
        assert d["bu_id"] == bu["id"]
        assert d["level_id"] == lv["id"]
        # Denormalized strings
        assert d.get("company") in (comp.get("short_name"), comp.get("name"))
        assert d.get("function") == fn["name"]
        assert d.get("bu") == bu["name"]
        assert d.get("level") == lv["code"]
        assert "_id" not in d
        # GET to verify persistence
        r2 = requests.get(f"{API}/employees", headers=H(admin_token), timeout=15)
        rec = next((e for e in r2.json() if e.get("emp_id") == emp_id), None)
        assert rec is not None, "employee not persisted"
        assert rec["function"] == fn["name"]
        assert rec["bu"] == bu["name"]
        assert rec["level"] == lv["code"]

    def test_legacy_payload_without_master_ids(self, admin_token):
        emp_id = f"TEST_LEG_{uuid.uuid4().hex[:6]}"
        payload = {
            "emp_id": emp_id, "emp_code": emp_id,
            "name": "TEST Legacy User",
            "email": f"{emp_id.lower()}@test.example",
            "company": "NovaCorp", "bu": "Digital Platforms",
            "function": "Engineering", "level": "L2",
        }
        r = requests.post(f"{API}/employees", headers=H(admin_token),
                          json=payload, timeout=15)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["company"] == "NovaCorp"
        assert d["function"] == "Engineering"
        assert "company_id" not in d or d.get("company_id") is None

    def test_unknown_master_ids_gracefully_ignored(self, admin_token):
        emp_id = f"TEST_BOGUS_{uuid.uuid4().hex[:6]}"
        payload = {
            "emp_id": emp_id, "emp_code": emp_id,
            "name": "TEST Bogus IDs",
            "email": f"{emp_id.lower()}@test.example",
            "company_id": "does-not-exist",
            "function_id": "does-not-exist",
            "bu_id": "does-not-exist",
            "level_id": "does-not-exist",
        }
        r = requests.post(f"{API}/employees", headers=H(admin_token),
                          json=payload, timeout=15)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        # No crash; strings not populated
        assert d.get("company") in (None, "")
        assert d.get("function") in (None, "")
        assert d.get("bu") in (None, "")
        assert d.get("level") in (None, "")


# -------------------------------- Seed idempotency ----------------------------------
class TestSeedIdempotency:
    def test_repeated_calls_constant_counts(self, admin_token):
        a = requests.get(f"{API}/master/all", headers=H(admin_token), timeout=15).json()
        b = requests.get(f"{API}/master/all", headers=H(admin_token), timeout=15).json()
        assert len(a["companies"]) == len(b["companies"])
        assert len(a["functions"]) == len(b["functions"])
        assert len(a["business_units"]) == len(b["business_units"])
        assert len(a["levels"]) == len(b["levels"])

    def test_no_duplicate_company_codes(self, admin_token):
        r = requests.get(f"{API}/master/companies",
                         headers=H(admin_token), timeout=15).json()
        codes = [c["code"] for c in r]
        assert len(codes) == len(set(codes)), f"duplicate company codes: {codes}"

    def test_no_duplicate_bu_codes(self, admin_token):
        r = requests.get(f"{API}/master/business-units",
                         headers=H(admin_token), timeout=15).json()
        codes = [c["code"] for c in r]
        assert len(codes) == len(set(codes)), f"duplicate BU codes: {codes}"

    def test_no_duplicate_level_codes(self, admin_token):
        r = requests.get(f"{API}/master/levels",
                         headers=H(admin_token), timeout=15).json()
        codes = [c["code"] for c in r]
        assert len(codes) == len(set(codes))


# -------------------------------- Regression smoke ----------------------------------
class TestRegression:
    def test_login(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": "admin@ldc.io", "password": "Admin@123"}, timeout=15)
        assert r.status_code == 200
        assert "token" in r.json()

    def test_cases(self, admin_token):
        r = requests.get(f"{API}/cases", headers=H(admin_token), timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_capabilities(self, admin_token):
        r = requests.get(f"{API}/capabilities", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list) and len(r.json()) >= 8

    def test_employees(self, admin_token):
        r = requests.get(f"{API}/employees", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list) and len(r.json()) >= 1

    def test_dashboard_summary(self, admin_token):
        r = requests.get(f"{API}/dashboard/summary",
                         headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("total_cases", "in_progress", "finalized", "renominations", "my_pending"):
            assert k in d
