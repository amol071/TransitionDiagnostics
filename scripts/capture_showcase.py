"""One-shot Playwright screenshot capture for /app/frontend/public/showcase.
Run: /opt/plugins-venv/bin/python3 /app/scripts/capture_showcase.py
"""
import asyncio
import os
from playwright.async_api import async_playwright

BASE = "https://leadership-eval-hub.preview.emergentagent.com"
OUT = "/app/frontend/public/showcase"
os.makedirs(OUT, exist_ok=True)


async def run():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()

        async def shot(name):
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(700)
            path = f"{OUT}/{name}"
            await page.screenshot(path=path, type="jpeg", quality=80)
            print(f"OK: {name}")

        async def login(email, pw_):
            await page.evaluate("() => localStorage.removeItem('ldc_token')")
            await page.goto(f"{BASE}/login")
            await page.wait_for_load_state("networkidle")
            await page.fill('input[type="email"]', email)
            await page.fill('input[type="password"]', pw_)
            await page.click('button[type="submit"]')
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(900)

        # ---- ADMIN journey ----
        await page.goto(f"{BASE}/login")
        await shot("01-login.jpg")
        await page.fill('input[type="email"]', "admin@ldc.io")
        await page.fill('input[type="password"]', "Admin@123")
        await page.click('button[type="submit"]')
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(900)
        await shot("02-landing.jpg")
        await page.goto(f"{BASE}/app"); await shot("03-dashboard-admin.jpg")
        await page.goto(f"{BASE}/app/nominees"); await shot("04-nominees.jpg")
        try:
            await page.click('[data-testid=add-nominee-btn]'); await page.wait_for_timeout(500)
            await shot("05-add-nominee-dialog.jpg"); await page.keyboard.press("Escape"); await page.wait_for_timeout(200)
        except Exception as e: print("add-nominee:", e)
        try:
            await page.click('[data-testid=add-employee-btn]'); await page.wait_for_timeout(500)
            await shot("06-add-employee-dialog.jpg"); await page.keyboard.press("Escape"); await page.wait_for_timeout(200)
        except Exception as e: print("add-employee:", e)
        await page.goto(f"{BASE}/app/status"); await shot("07-status-dashboard.jpg")
        await page.goto(f"{BASE}/admin"); await shot("08-admin-center.jpg")
        try:
            await page.evaluate("() => document.querySelector('[data-testid=master-companies]')?.scrollIntoView({block:'center'})")
            await page.wait_for_timeout(400)
            await shot("09-admin-master-data.jpg")
        except Exception as e: print("master data:", e)

        # Prep — reopen Alice's employee form for later
        alice = await page.evaluate("""async () => {
            const tok = localStorage.getItem('ldc_token');
            const r = await fetch('/api/cases', { headers:{Authorization:'Bearer '+tok } });
            const d = await r.json();
            const a = d.find(c => c.employee?.name === 'Alice Wei');
            await fetch(`/api/cases/${a.id}/reopen`, { method:'POST', headers:{Authorization:'Bearer '+tok, 'Content-Type':'application/json'}, body: JSON.stringify({form:'employee'}) });
            return a.id;
        }""")
        print("Alice case:", alice)

        # Uploads + case detail (as admin)
        await page.goto(f"{BASE}/app/cases/{alice}/uploads"); await shot("10-uploads-center.jpg")
        await page.goto(f"{BASE}/app/cases/{alice}"); await shot("11-case-detail.jpg")

        # ---- EMPLOYEE (Alice) ----
        await login("alice.emp@ldc.io", "Demo@123")
        await page.goto(f"{BASE}/app/cases/{alice}/employee")
        await shot("12-employee-form-top.jpg")
        await page.evaluate("() => window.scrollBy(0, 700)"); await page.wait_for_timeout(300)
        await shot("13-employee-form-core-gcfs.jpg")
        try:
            await page.evaluate("() => document.querySelector('[data-testid=other-gcf-section]')?.scrollIntoView({block:'center'})")
            await page.wait_for_timeout(300)
            await shot("14-employee-form-optional-gcfs.jpg")
        except Exception as e: print("optional gcf:", e)

        # ---- MANAGER (Mary) ----
        await login("mary.mgr@ldc.io", "Demo@123")
        mcase = await page.evaluate("""async () => {
            const tok = localStorage.getItem('ldc_token');
            const r = await fetch('/api/cases', { headers:{Authorization:'Bearer '+tok } });
            const d = await r.json();
            return d[0]?.id;
        }""")
        if mcase:
            await page.goto(f"{BASE}/app/cases/{mcase}/manager"); await shot("15-manager-form.jpg")
            await page.evaluate("() => window.scrollBy(0, 1400)"); await page.wait_for_timeout(400)
            await shot("16-manager-directory-picker.jpg")

        # ---- STAKEHOLDER (Sam) ----
        await login("stake.one@ldc.io", "Demo@123")
        scase = await page.evaluate("""async () => {
            const tok = localStorage.getItem('ldc_token');
            const r = await fetch('/api/cases', { headers:{Authorization:'Bearer '+tok } });
            const d = await r.json();
            return d[0]?.id;
        }""")
        if scase:
            await page.goto(f"{BASE}/app/cases/{scase}/stakeholder"); await shot("17-stakeholder-form.jpg")

        # ---- PANEL (Peter) — bias check is the crown jewel ----
        await login("peter.panel@ldc.io", "Demo@123")
        await page.goto(f"{BASE}/app/cases/{alice}/panel")
        await shot("18-panel-review-top.jpg")
        await page.evaluate("() => window.scrollBy(0, 700)"); await page.wait_for_timeout(300)
        await shot("19-panel-consolidated-matrix.jpg")
        try:
            await page.evaluate("() => document.querySelector('[data-testid=bias-panel]')?.scrollIntoView({block:'start'})")
            await page.wait_for_timeout(400)
            await shot("20-bias-check-top.jpg")
            await page.evaluate("() => window.scrollBy(0, 500)"); await page.wait_for_timeout(300)
            await shot("21-bias-check-mismatches-rater-patterns.jpg")
            await page.evaluate("() => window.scrollBy(0, 500)"); await page.wait_for_timeout(300)
            await shot("22-bias-check-language-signals.jpg")
            await page.evaluate("() => window.scrollBy(0, 500)"); await page.wait_for_timeout(300)
            await shot("23-bias-check-panel-probes.jpg")
        except Exception as e: print("bias panel:", e)

        # ---- HR (Hana) ----
        await login("hr.lead@ldc.io", "Demo@123")
        await page.goto(f"{BASE}/app/cases/{alice}/hr")
        await shot("24-hr-summary-top.jpg")
        await page.evaluate("() => window.scrollBy(0, 700)"); await page.wait_for_timeout(300)
        await shot("25-hr-summary-strengths.jpg")

        # ---- WIREFRAMES public page ----
        await page.goto(f"{BASE}/wireframes")
        await shot("26-wireframes.jpg")

        await browser.close()


if __name__ == "__main__":
    asyncio.run(run())
