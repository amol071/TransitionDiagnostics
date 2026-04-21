"""Seed demo data for LDC AI Platform."""
import uuid
from datetime import datetime, timezone
from core import db, hash_password
from gcf_framework import all_capabilities
from master_data import COMPANIES, FUNCTIONS, BUSINESS_UNITS, LEVELS


async def seed_master_data():
    """Idempotent master-data seed. Runs on every startup to upsert
    Companies, Functions, Business Units and Levels keyed by their `code`.
    Also backfills `company_id`, `function_id`, `bu_id`, `level_id` onto
    existing employees by matching legacy string fields."""
    # Companies
    company_code_to_id: dict = {}
    for c in COMPANIES:
        existing = await db.master_companies.find_one({"code": c["code"]}, {"_id": 0})
        if existing:
            company_code_to_id[c["code"]] = existing["id"]
            await db.master_companies.update_one(
                {"code": c["code"]}, {"$set": {"name": c["name"], "short_name": c.get("short_name")}}
            )
        else:
            doc = {"id": str(uuid.uuid4()), **c}
            await db.master_companies.insert_one(doc)
            company_code_to_id[c["code"]] = doc["id"]

    # Functions
    function_code_to_id: dict = {}
    for f in FUNCTIONS:
        existing = await db.master_functions.find_one({"code": f["code"]}, {"_id": 0})
        if existing:
            function_code_to_id[f["code"]] = existing["id"]
            await db.master_functions.update_one({"code": f["code"]}, {"$set": {"name": f["name"]}})
        else:
            doc = {"id": str(uuid.uuid4()), **f}
            await db.master_functions.insert_one(doc)
            function_code_to_id[f["code"]] = doc["id"]

    # Business Units
    bu_code_to_id: dict = {}
    for b in BUSINESS_UNITS:
        company_id = company_code_to_id.get(b["company_code"])
        existing = await db.master_business_units.find_one({"code": b["code"]}, {"_id": 0})
        if existing:
            bu_code_to_id[b["code"]] = existing["id"]
            await db.master_business_units.update_one(
                {"code": b["code"]},
                {"$set": {"name": b["name"], "company_code": b["company_code"], "company_id": company_id}},
            )
        else:
            doc = {"id": str(uuid.uuid4()), **b, "company_id": company_id}
            await db.master_business_units.insert_one(doc)
            bu_code_to_id[b["code"]] = doc["id"]

    # Levels
    level_code_to_id: dict = {}
    for lv in LEVELS:
        existing = await db.master_levels.find_one({"code": lv["code"]}, {"_id": 0})
        if existing:
            level_code_to_id[lv["code"]] = existing["id"]
            await db.master_levels.update_one(
                {"code": lv["code"]},
                {"$set": {"name": lv["name"], "band": lv["band"], "ldc_level": lv["ldc_level"], "order": lv["order"]}},
            )
        else:
            doc = {"id": str(uuid.uuid4()), **lv}
            await db.master_levels.insert_one(doc)
            level_code_to_id[lv["code"]] = doc["id"]

    # ---- Backfill existing employees with master-data IDs ----
    # Match by: company name/short_name, function name, BU name, level code (e.g. "L2" -> ldc_level 2)
    async for emp in db.employees.find({}):
        patch: dict = {}
        if not emp.get("company_id") and emp.get("company"):
            comp = await db.master_companies.find_one(
                {"$or": [{"name": emp["company"]}, {"short_name": emp["company"]}, {"code": emp["company"]}]},
                {"_id": 0},
            )
            if comp:
                patch["company_id"] = comp["id"]
        if not emp.get("function_id") and emp.get("function"):
            fn = await db.master_functions.find_one(
                {"$or": [{"name": emp["function"]}, {"code": emp["function"]}]}, {"_id": 0}
            )
            if fn:
                patch["function_id"] = fn["id"]
        if not emp.get("bu_id") and emp.get("bu"):
            bu = await db.master_business_units.find_one(
                {"$or": [{"name": emp["bu"]}, {"code": emp["bu"]}]}, {"_id": 0}
            )
            if bu:
                patch["bu_id"] = bu["id"]
        if not emp.get("level_id") and emp.get("level"):
            lv_str = str(emp["level"])
            q: dict = {"$or": [{"code": lv_str}, {"name": lv_str}]}
            if lv_str.upper().startswith("L") and lv_str[1:].isdigit():
                q["$or"].append({"ldc_level": int(lv_str[1:])})
            lv = await db.master_levels.find_one(q, {"_id": 0})
            if lv:
                patch["level_id"] = lv["id"]
        if patch:
            await db.employees.update_one({"id": emp["id"]}, {"$set": patch})


async def seed_all():
    # Always run master-data seed first (idempotent, runs every startup)
    await seed_master_data()

    # Skip demo users/cases if already seeded
    existing = await db.users.find_one({"email": "admin@ldc.io"})
    if existing:
        return False

    now = datetime.now(timezone.utc).isoformat()

    # ---- Users ----
    users = [
        {"email": "admin@ldc.io", "name": "Anita Admin", "roles": ["admin", "coordinator"], "password": "Admin@123"},
        {"email": "coord@ldc.io", "name": "Carl Coordinator", "roles": ["coordinator"], "password": "Admin@123"},
        {"email": "alice.emp@ldc.io", "name": "Alice Wei", "roles": ["employee"], "password": "Demo@123", "emp_id": "EMP001"},
        {"email": "bob.emp@ldc.io", "name": "Bob Sharma", "roles": ["employee"], "password": "Demo@123", "emp_id": "EMP002"},
        {"email": "diana.emp@ldc.io", "name": "Diana Park", "roles": ["employee"], "password": "Demo@123", "emp_id": "EMP003"},
        {"email": "mary.mgr@ldc.io", "name": "Mary Kline", "roles": ["manager"], "password": "Demo@123", "emp_id": "MGR001"},
        {"email": "peter.panel@ldc.io", "name": "Peter Obi", "roles": ["panel"], "password": "Demo@123"},
        {"email": "sara.panel@ldc.io", "name": "Sara Lindgren", "roles": ["panel"], "password": "Demo@123"},
        {"email": "hr.lead@ldc.io", "name": "Hana Ito", "roles": ["hr", "hrbp"], "password": "Demo@123"},
        {"email": "stake.one@ldc.io", "name": "Sam Reddy", "roles": ["stakeholder"], "password": "Demo@123"},
    ]
    user_ids = {}
    for u in users:
        doc = {
            "id": str(uuid.uuid4()),
            "email": u["email"],
            "name": u["name"],
            "roles": u["roles"],
            "password_hash": hash_password(u["password"]),
            "emp_id": u.get("emp_id"),
            "created_at": now,
        }
        await db.users.insert_one(doc)
        user_ids[u["email"]] = doc["id"]

    # ---- Employees ----
    employees = [
        {"emp_id": "EMP001", "emp_code": "A001", "name": "Alice Wei", "email": "alice.emp@ldc.io",
         "company": "NovaCorp", "bu": "Digital Platforms", "function": "Engineering", "level": "L2",
         "manager_id": user_ids["mary.mgr@ldc.io"], "hrbp_id": user_ids["hr.lead@ldc.io"]},
        {"emp_id": "EMP002", "emp_code": "A002", "name": "Bob Sharma", "email": "bob.emp@ldc.io",
         "company": "NovaCorp", "bu": "Consumer Products", "function": "Marketing", "level": "L2",
         "manager_id": user_ids["mary.mgr@ldc.io"], "hrbp_id": user_ids["hr.lead@ldc.io"]},
        {"emp_id": "EMP003", "emp_code": "A003", "name": "Diana Park", "email": "diana.emp@ldc.io",
         "company": "NovaCorp", "bu": "Operations", "function": "Supply Chain", "level": "L2",
         "manager_id": user_ids["mary.mgr@ldc.io"], "hrbp_id": user_ids["hr.lead@ldc.io"]},
    ]
    # --- 22 additional dummy employees with Indian names ---
    _extra = [
        ("Arjun Desai", "Digital Platforms", "Engineering"),
        ("Priya Menon", "Consumer Products", "Product"),
        ("Vikram Iyer", "Finance", "Corporate Finance"),
        ("Meera Krishnan", "Operations", "Supply Chain"),
        ("Rohan Gupta", "Sales", "Enterprise Sales"),
        ("Ananya Nair", "Consumer Products", "Brand Marketing"),
        ("Kiran Rao", "People & Culture", "HR Business Partner"),
        ("Ishaan Kapoor", "Technology", "Platform Engineering"),
        ("Tara Singh", "Digital Platforms", "Product Management"),
        ("Aditya Mehta", "Strategy", "Corporate Strategy"),
        ("Divya Shetty", "Analytics", "Data Science"),
        ("Rahul Bhatt", "Technology", "Site Reliability"),
        ("Sneha Pillai", "Digital Platforms", "Design"),
        ("Karthik Venkataraman", "Platform", "Cloud Engineering"),
        ("Neha Agarwal", "Legal", "Commercial Legal"),
        ("Manish Joshi", "Operations", "Manufacturing"),
        ("Pooja Ramanathan", "Research", "Consumer Research"),
        ("Suresh Chandran", "Operations", "Logistics"),
        ("Riya Bansal", "Digital Platforms", "Growth"),
        ("Aakash Kulkarni", "Technology", "DevOps"),
        ("Shalini Patel", "Consumer Products", "Brand Strategy"),
        ("Harish Reddy", "Technology", "Cybersecurity"),
    ]
    _bu_levels = ["L2", "L2", "L3", "L2", "L2", "L3"]
    for i, (name, bu, func) in enumerate(_extra, start=4):
        employees.append({
            "emp_id": f"EMP{i:03d}", "emp_code": f"A{i:03d}",
            "name": name,
            "email": f"{name.lower().replace(' ', '.')}@novacorp.example",
            "company": "NovaCorp", "bu": bu, "function": func,
            "level": _bu_levels[i % len(_bu_levels)],
            "manager_id": user_ids["mary.mgr@ldc.io"], "hrbp_id": user_ids["hr.lead@ldc.io"],
        })
    emp_docs = {}
    for e in employees:
        d = {"id": str(uuid.uuid4()), **e, "created_at": now}
        await db.employees.insert_one(d)
        emp_docs[e["emp_id"]] = d

    # ---- Capabilities — Godrej Capability Framework (all 4 levels) ----
    cap_docs = {}  # key: (level, pillar, gcf, competency_order) -> doc
    for (level, pillar, p_order, gcf, g_order, c_order, name, code, order) in all_capabilities():
        d = {
            "id": str(uuid.uuid4()),
            "code": code,
            "name": name,
            "pillar": pillar,
            "pillar_order": p_order,
            "gcf": gcf,
            "gcf_order": g_order,
            "competency_order": c_order,
            "level": level,
            "order": order,
        }
        await db.capabilities.insert_one(d)
        cap_docs[(level, pillar, gcf, c_order)] = d

    def cap(level, pillar, gcf, c_order):
        return cap_docs[(level, pillar, gcf, c_order)]

    # ---- Cases ----
    fy = "FY26"
    alice_emp = emp_docs["EMP001"]
    bob_emp = emp_docs["EMP002"]
    diana_emp = emp_docs["EMP003"]
    panel_ids = [user_ids["peter.panel@ldc.io"], user_ids["sara.panel@ldc.io"]]

    case_alice = {
        "id": str(uuid.uuid4()), "employee_id": alice_emp["id"], "fiscal_year": fy,
        "is_renomination": False, "is_launched": True, "is_panel_launched": True,
        "status": "panel_in_progress",
        "assigned_manager_id": user_ids["mary.mgr@ldc.io"],
        "assigned_panel_ids": panel_ids,
        "assigned_hrbp_id": user_ids["hr.lead@ldc.io"],
        "assigned_hr_id": user_ids["hr.lead@ldc.io"],
        "coordinator_id": user_ids["admin@ldc.io"],
        "created_at": now, "updated_at": now,
    }
    case_bob = {
        "id": str(uuid.uuid4()), "employee_id": bob_emp["id"], "fiscal_year": fy,
        "is_renomination": True, "is_launched": True, "is_panel_launched": False,
        "status": "employee_submitted",
        "assigned_manager_id": user_ids["mary.mgr@ldc.io"],
        "assigned_panel_ids": panel_ids,
        "assigned_hrbp_id": user_ids["hr.lead@ldc.io"],
        "assigned_hr_id": user_ids["hr.lead@ldc.io"],
        "coordinator_id": user_ids["admin@ldc.io"],
        "created_at": now, "updated_at": now,
    }
    case_diana = {
        "id": str(uuid.uuid4()), "employee_id": diana_emp["id"], "fiscal_year": fy,
        "is_renomination": False, "is_launched": False, "is_panel_launched": False,
        "status": "draft",
        "assigned_manager_id": user_ids["mary.mgr@ldc.io"],
        "assigned_panel_ids": [],
        "assigned_hrbp_id": user_ids["hr.lead@ldc.io"],
        "assigned_hr_id": user_ids["hr.lead@ldc.io"],
        "coordinator_id": user_ids["admin@ldc.io"],
        "created_at": now, "updated_at": now,
    }
    for c in [case_alice, case_bob, case_diana]:
        await db.cases.insert_one(c)

    # ---- Employee self-form (Alice submitted) ----
    cap_list = list(cap_docs.values())
    alice_emp_form = {
        "id": str(uuid.uuid4()), "case_id": case_alice["id"],
        "contributions": [
            {"area": "Platform migration to cloud", "role": "Tech lead for payments domain",
             "impact": "Reduced infra cost 28%; zero-downtime migration for 12M users",
             "stakeholders": "VP Eng, CFO, Platform PMO"},
            {"area": "Engineering culture initiative", "role": "Co-founder of internal guild",
             "impact": "Lifted engineering NPS from 32 to 61 over 2 quarters",
             "stakeholders": "HRBP, EM cohort"},
        ],
        "capability_responses": [
            {"capability_id": cap(3, "Leading Business", "Acting Strategically", 1)["id"], "current_level": "Meets",
             "current_rationale": "Shaped multi-quarter payments roadmap.",
             "demonstrated_next": True,
             "rationale": "Drove 2-year platform thesis shared with BU heads."},
            {"capability_id": cap(3, "Leading Business", "Customer Centricity", 1)["id"], "current_level": "Meets",
             "current_rationale": "Owns cost model for payments.",
             "demonstrated_next": False, "rationale": ""},
            {"capability_id": cap(3, "Leading Business", "Delivering Results", 1)["id"], "current_level": "Exceeds",
             "current_rationale": "Delivered 3 complex programs on time.",
             "demonstrated_next": True,
             "rationale": "Cross-BU migration executed despite ambiguous scope."},
            {"capability_id": cap(3, "Leading Others", "Developing Others", 1)["id"], "current_level": "Meets",
             "current_rationale": "Coaches 4 ICs monthly.",
             "demonstrated_next": False,
             "rationale": "Still building structured development for senior engineers."},
        ],
        "overall_reflection": "I believe I have consistently shown the ability to operate at the next level through cross-BU delivery and platform thinking, while I continue to invest in scaling talent development.",
        "status": "submitted", "submitted_at": now, "updated_at": now,
    }
    await db.employee_forms.insert_one(alice_emp_form)

    # ---- Manager form (Alice submitted by Mary) ----
    alice_mgr_form = {
        "id": str(uuid.uuid4()), "case_id": case_alice["id"],
        "capability_responses": [
            {"capability_id": cap(3, "Leading Business", "Acting Strategically", 1)["id"], "current_level": "Meets",
             "current_rationale": "Proven strategic thinker in payments domain.",
             "demonstrated_next": True,
             "rationale": "Her platform thesis shaped BU planning in Q3."},
            {"capability_id": cap(3, "Leading Business", "Customer Centricity", 1)["id"], "current_level": "Meets",
             "current_rationale": "Strong grasp of payment unit economics.",
             "demonstrated_next": True,
             "rationale": "Reframed infra spend in CFO review."},
            {"capability_id": cap(3, "Leading Business", "Delivering Results", 1)["id"], "current_level": "Exceeds",
             "current_rationale": "Consistently delivers under pressure.",
             "demonstrated_next": True, "rationale": "Migration was flawless."},
            {"capability_id": cap(3, "Leading Others", "Developing Others", 1)["id"], "current_level": "Meets",
             "current_rationale": "Coaches direct reports.",
             "demonstrated_next": False,
             "rationale": "Limited evidence of growing senior leaders yet."},
        ],
        "stakeholders": [
            {"name": "Sam Reddy", "email": "stake.one@ldc.io", "relationship": "Peer - Product"},
            {"name": "Leah Tan", "email": "leah@novacorp.example", "relationship": "Cross-BU partner"},
            {"name": "Vikram Shah", "email": "vikram@novacorp.example", "relationship": "Skip-level report"},
        ],
        "overall_rationale": "Alice is ready for next-level leadership in strategic, business and execution pillars. People development is the primary growth area before full readiness.",
        "readiness": "moderate",
        "status": "submitted", "submitted_at": now, "updated_at": now,
    }
    await db.manager_forms.insert_one(alice_mgr_form)

    # ---- Stakeholder feedback for Alice ----
    alice_stk = {
        "id": str(uuid.uuid4()), "case_id": case_alice["id"],
        "stakeholder_name": "Sam Reddy", "stakeholder_email": "stake.one@ldc.io",
        "capability_responses": [
            {"capability_id": cap(3, "Leading Business", "Acting Strategically", 1)["id"], "current_level": "Meets",
             "demonstrated_next": True, "rationale": "Brings enterprise view to planning."},
            {"capability_id": cap(3, "Leading Others", "Developing Others", 1)["id"], "current_level": "Below",
             "demonstrated_next": False, "rationale": "Could invest more in mentoring beyond immediate team."},
        ],
        "comments": "Strong operator. Occasionally terse in cross-functional debates.",
        "status": "submitted", "submitted_at": now, "updated_at": now,
    }
    await db.stakeholder_feedbacks.insert_one(alice_stk)

    # ---- Bob (renomination) employee form ----
    bob_emp_form = {
        "id": str(uuid.uuid4()), "case_id": case_bob["id"],
        "contributions": [
            {"area": "Brand relaunch", "role": "Marketing lead",
             "impact": "Revenue lift 14% YoY in the relaunched line.",
             "stakeholders": "CMO, BU GM, Agency partners"},
        ],
        "capability_responses": [
            {"capability_id": cap(3, "Leading Business", "Acting Strategically", 1)["id"], "current_level": "Meets",
             "demonstrated_next": True,
             "rationale": "Drove three-year brand positioning since last LDC."},
            {"capability_id": cap(3, "Leading Business", "Institution Building", 1)["id"], "current_level": "Exceeds",
             "demonstrated_next": True,
             "rationale": "Customer research re-shaped portfolio roadmap."},
        ],
        "overall_reflection": "Since the last LDC I have addressed prior development areas in strategic framing and cross-BU influence.",
        "status": "submitted", "submitted_at": now, "updated_at": now,
    }
    await db.employee_forms.insert_one(bob_emp_form)

    # ---- Prior-cycle Bob case (for renomination comparison) ----
    prior_now = datetime.now(timezone.utc).replace(year=datetime.now(timezone.utc).year - 1).isoformat()
    case_bob_prior = {
        "id": str(uuid.uuid4()), "employee_id": bob_emp["id"], "fiscal_year": "FY25",
        "is_renomination": False, "is_launched": True, "is_panel_launched": True,
        "status": "closed",
        "assigned_manager_id": user_ids["mary.mgr@ldc.io"],
        "assigned_panel_ids": panel_ids,
        "assigned_hrbp_id": user_ids["hr.lead@ldc.io"],
        "assigned_hr_id": user_ids["hr.lead@ldc.io"],
        "coordinator_id": user_ids["admin@ldc.io"],
        "created_at": prior_now, "updated_at": prior_now,
    }
    await db.cases.insert_one(case_bob_prior)

    # prior manager form
    await db.manager_forms.insert_one({
        "id": str(uuid.uuid4()), "case_id": case_bob_prior["id"],
        "capability_responses": [
            {"capability_id": cap(3, "Leading Business", "Acting Strategically", 1)["id"], "current_level": "Meets",
             "demonstrated_next": False, "rationale": "Brand operator — limited cross-BU framing."},
            {"capability_id": cap(3, "Leading Business", "Institution Building", 1)["id"], "current_level": "Meets",
             "demonstrated_next": True, "rationale": "Customer intimacy demonstrated."},
        ],
        "stakeholders": [],
        "overall_rationale": "Bob operates reliably within own line but needs broader strategic framing and cross-BU influence before readiness.",
        "readiness": "weak",
        "status": "submitted", "submitted_at": prior_now, "updated_at": prior_now,
    })
    # prior panel reviews
    for pm in panel_ids:
        await db.panel_reviews.insert_one({
            "id": str(uuid.uuid4()), "case_id": case_bob_prior["id"], "panel_member_id": pm,
            "capability_ratings": [
                {"capability_id": cap(3, "Leading Business", "Acting Strategically", 1)["id"], "rating": "Moderate", "rationale": "Needs stronger multi-year framing"},
                {"capability_id": cap(3, "Leading Business", "Institution Building", 1)["id"], "rating": "Strong", "rationale": "Customer-first is a clear strength"},
            ],
            "overall_rating": "weak",
            "overall_rationale": "Not yet ready. Strategic breadth and cross-BU influence are development areas. Retest in 12 months with evidence of platform-level thinking.",
            "discussion_notes": "",
            "status": "submitted", "submitted_at": prior_now, "updated_at": prior_now,
        })
    # prior HR
    await db.hr_reviews.insert_one({
        "id": str(uuid.uuid4()), "case_id": case_bob_prior["id"],
        "strengths": ["Customer-first mindset consistently demonstrated across product launches",
                      "Reliable execution within own brand portfolio"],
        "improvements": ["Strategic framing beyond own brand — articulate multi-year thesis",
                         "Cross-BU influence and stakeholder alignment",
                         "Coaching and developing future leaders"],
        "overall_summary": "Bob is a dependable brand operator with strong customer intuition. Development is needed in strategic breadth and cross-BU influence before next-level readiness. We recommend reassessing in 12 months with concrete evidence of multi-year portfolio thinking.",
        "additional_feedback": "Encourage shadowing cross-BU planning cycles.",
        "development_plan": "1) Lead a cross-BU initiative within 6 months. 2) Present a 3-year portfolio thesis to leadership. 3) Mentor two L1 leaders.",
        "readiness": "weak",
        "status": "submitted", "submitted_at": prior_now, "updated_at": prior_now,
    })

    # ---- Audit seed ----
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()), "case_id": case_alice["id"],
        "user_id": user_ids["admin@ldc.io"], "user_name": "Anita Admin",
        "action": "launch_case", "entity": "case", "details": {"stage": "case"},
        "timestamp": now,
    })
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()), "case_id": case_alice["id"],
        "user_id": user_ids["admin@ldc.io"], "user_name": "Anita Admin",
        "action": "launch_panel", "entity": "case", "details": {"stage": "panel"},
        "timestamp": now,
    })

    return True
