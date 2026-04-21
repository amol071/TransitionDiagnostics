"""Tests for EmployeeForm.other_gcf_comments persistence."""
import os
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


def _login(email, pw):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": pw}, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()["token"]


def H(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def admin_tok():
    return _login("admin@ldc.io", "Admin@123")


@pytest.fixture(scope="module")
def alice_tok():
    return _login("alice.emp@ldc.io", "Demo@123")


@pytest.fixture(scope="module")
def alice_case(alice_tok):
    r = requests.get(f"{API}/cases", headers=H(alice_tok), timeout=15)
    assert r.status_code == 200
    cases = r.json()
    assert cases, "Alice should have at least one case"
    return cases[0]["id"]


class TestOtherGcfComments:
    def test_reopen_and_get(self, admin_tok, alice_tok, alice_case):
        r = requests.post(f"{API}/cases/{alice_case}/reopen", headers=H(admin_tok),
                          json={"form": "employee"}, timeout=15)
        assert r.status_code == 200
        r = requests.get(f"{API}/cases/{alice_case}/employee-form", headers=H(alice_tok), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "_id" not in data
        assert "other_gcf_comments" in data
        assert isinstance(data["other_gcf_comments"], list)

    def test_put_and_persist_other_gcf(self, alice_tok, alice_case):
        payload = {
            "overall_reflection": "TEST reflection",
            "contributions": [],
            "capability_responses": [],
            "other_gcf_comments": [
                {"gcf_key": "1.1", "gcf_label": "Initiative",
                 "comment": "TEST initiative comment"},
                {"gcf_key": "3.4", "gcf_label": "Delivering Results",
                 "comment": "TEST delivery comment"},
            ],
            "status": "draft",
        }
        r = requests.put(f"{API}/cases/{alice_case}/employee-form",
                         headers=H(alice_tok), json=payload, timeout=15)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert "_id" not in data
        assert len(data["other_gcf_comments"]) == 2
        keys = {o["gcf_key"] for o in data["other_gcf_comments"]}
        assert keys == {"1.1", "3.4"}

        # GET and verify persistence
        r = requests.get(f"{API}/cases/{alice_case}/employee-form", headers=H(alice_tok), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data["other_gcf_comments"]) == 2
        got = {o["gcf_key"]: o["comment"] for o in data["other_gcf_comments"]}
        assert got["1.1"] == "TEST initiative comment"
        assert got["3.4"] == "TEST delivery comment"
        for o in data["other_gcf_comments"]:
            assert o["gcf_label"]

    def test_clear_other_gcf(self, alice_tok, alice_case):
        payload = {
            "overall_reflection": "",
            "contributions": [{"area": "", "role": "", "impact": "", "stakeholders": ""}],
            "capability_responses": [],
            "other_gcf_comments": [],
            "status": "draft",
        }
        r = requests.put(f"{API}/cases/{alice_case}/employee-form",
                         headers=H(alice_tok), json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json()["other_gcf_comments"] == []
        # verify GET
        r = requests.get(f"{API}/cases/{alice_case}/employee-form", headers=H(alice_tok), timeout=15)
        assert r.json()["other_gcf_comments"] == []

    def test_three_other_gcf(self, alice_tok, alice_case):
        payload = {
            "overall_reflection": "",
            "contributions": [],
            "capability_responses": [],
            "other_gcf_comments": [
                {"gcf_key": "1.1", "gcf_label": "Initiative", "comment": "c1"},
                {"gcf_key": "3.1", "gcf_label": "Customer Centricity", "comment": "c2"},
                {"gcf_key": "3.5", "gcf_label": "Institution Building", "comment": "c3"},
            ],
            "status": "draft",
        }
        r = requests.put(f"{API}/cases/{alice_case}/employee-form",
                         headers=H(alice_tok), json=payload, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data["other_gcf_comments"]) == 3
