#!/usr/bin/env python3
"""
Quiz Competition Backend Speed and Load Tester  v2.0
=====================================================
Self-contained Python concurrency testing utility.
Handles Render.com cold starts, authenticated endpoints,
and generates a premium interactive HTML dashboard report.
""" 

import sys
import subprocess

# ── 1. Auto-install dependencies ──────────────────────────────────────────────
for pkg in ["httpx"]:
    try:
        __import__(pkg)
    except ImportError:
        print(f"[\033[94mINFO\033[0m] Installing missing package '{pkg}'...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"[\033[92mOK\033[0m] '{pkg}' installed.")

import httpx
import asyncio
import time
import argparse
import random
import uuid
import json
import statistics

# ── Console colour helpers ─────────────────────────────────────────────────────
R  = '\033[0m'
BD = '\033[1m'
CY = '\033[96m'
GR = '\033[92m'
YL = '\033[93m'
RD = '\033[91m'
BL = '\033[94m'
MG = '\033[95m'

# ── Metrics store ──────────────────────────────────────────────────────────────
class Tracker:
    def __init__(self):
        self.t0 = self.t1 = 0.0
        self.by_ep: dict = {}
        self.ok = self.fail = 0
        self.errors: list = []

    def log(self, ep, method, latency_s, code, success, msg=None):
        if success:
            self.ok += 1
        else:
            self.fail += 1
            if msg:
                self.errors.append({
                    "time": time.strftime("%H:%M:%S"),
                    "ep": ep, "method": method,
                    "code": code, "msg": str(msg)[:200]
                })
        key = f"{method} {ep}"
        if key not in self.by_ep:
            self.by_ep[key] = {"ep": ep, "method": method,
                                "ms": [], "ok": 0, "fail": 0, "codes": {}}
        d = self.by_ep[key]
        d["ms"].append(latency_s * 1000)
        if success:
            d["ok"] += 1
        else:
            d["fail"] += 1
        d["codes"][code] = d["codes"].get(code, 0) + 1

    def summary(self):
        elapsed = max(self.t1 - self.t0, 0.001)
        total   = self.ok + self.fail
        rows = []
        for d in self.by_ep.values():
            ms = sorted(d["ms"])
            n  = len(ms)
            def pct(p): return ms[max(0, int(n * p) - 1)] if n else 0.0
            n_tot = d["ok"] + d["fail"]
            rows.append({
                "ep":      d["ep"],
                "method":  d["method"],
                "total":   n_tot,
                "ok":      d["ok"],
                "fail":    d["fail"],
                "rate":    d["ok"] / n_tot * 100 if n_tot else 0,
                "min":     ms[0]  if ms else 0,
                "avg":     sum(ms)/n if n else 0,
                "med":     pct(0.50),
                "p90":     pct(0.90),
                "p95":     pct(0.95),
                "max":     ms[-1] if ms else 0,
                "codes":   d["codes"],
            })
        return {
            "elapsed":  elapsed,
            "total":    total,
            "ok":       self.ok,
            "fail":     self.fail,
            "rate":     self.ok / total * 100 if total else 0,
            "rps":      total / elapsed,
            "rows":     rows,
            "errors":   self.errors[:60],
        }

# ── Scenario A: authenticated baseline (sequential) ───────────────────────────
async def scenario_a(base_url: str, admin_reg: str, admin_pw: str, tracker: Tracker):
    print(f"\n{BD}{BL}══ Scenario A — Authenticated Baseline Latency Check ══{R}")

    token = None
    # warm up + login
    try:
        async with httpx.AsyncClient(timeout=60.0) as c:
            print(f"  Warming up server & logging in as admin...", end=" ", flush=True)
            t0 = time.perf_counter()
            res = await c.post(f"{base_url}/api/login/",
                               json={"register_no": admin_reg, "password": admin_pw})
            lat = time.perf_counter() - t0
            ok  = res.status_code == 200
            tracker.log("api/login/ [admin]", "POST", lat, res.status_code, ok)
            if ok:
                token = res.json().get("access")
                print(f"{GR}200 ({lat*1000:.0f} ms) ✓{R}")
            else:
                print(f"{RD}{res.status_code} — admin login failed. "
                      f"Baseline checks will run without auth.{R}")
    except Exception as e:
        print(f"{RD}ERROR: {e}{R}")

    hdrs = {"Authorization": f"Bearer {token}"} if token else {}

    routes = [
        ("api/winners/",                    "GET"),
        ("api/leaderboard/?round_id=1",     "GET"),
        ("api/current-round/",              "GET"),
        ("api/results/",                    "GET"),
        ("api/notifications/",              "GET"),
    ]
    async with httpx.AsyncClient(headers=hdrs, timeout=60.0) as c:
        for route, method in routes:
            url = f"{base_url}/{route}"
            print(f"  {CY}{method}{R} {url} … ", end="", flush=True)
            t0 = time.perf_counter()
            try:
                r = await c.get(url) if method == "GET" else await c.post(url)
                lat = time.perf_counter() - t0
                ok  = r.status_code < 400
                tracker.log(route, method, lat, r.status_code, ok)
                clr = GR if ok else RD
                print(f"{clr}{r.status_code} ({lat*1000:.0f} ms){R}")
            except Exception as e:
                lat = time.perf_counter() - t0
                tracker.log(route, method, lat, 0, False, str(e))
                print(f"{RD}FAILED – {e}{R}")

# ── Scenario B: Virtual-user concurrent load ───────────────────────────────────
async def vu_task(vu_id: int, base_url: str, n_reqs: int, duration: float,
                  tracker: Tracker, session: str, stagger_s: float):
    """One virtual-user coroutine."""
    await asyncio.sleep(stagger_s)   # staggered start

    async with httpx.AsyncClient(
        headers={"User-Agent": f"QuizTester/2.0 VU-{vu_id}"},
        timeout=httpx.Timeout(60.0, connect=30.0)
    ) as c:

        reg_no = f"LT{session}{vu_id:04d}"

        # ── Step 1: Register ──────────────────────────────────────────────────
        t0 = time.perf_counter()
        registered = False
        try:
            r = await c.post(f"{base_url}/api/register/", json={
                "name":        f"LoadTest VU {vu_id}",
                "register_no": reg_no,
                "department":  "LoadTest",
                "email":       f"vu{session}{vu_id}@lt.test",
                "password":    "LtPass@9999",
            })
            lat = time.perf_counter() - t0
            ok  = r.status_code in (200, 201)
            tracker.log("api/register/", "POST", lat, r.status_code, ok)
            registered = ok or r.status_code == 400  # 400 = already exists (re-run)
        except Exception as e:
            tracker.log("api/register/", "POST", time.perf_counter()-t0, 0, False, e)

        # ── Step 2: Login ─────────────────────────────────────────────────────
        token = None
        t0 = time.perf_counter()
        try:
            r = await c.post(f"{base_url}/api/login/",
                             json={"register_no": reg_no, "password": "LtPass@9999"})
            lat = time.perf_counter() - t0
            ok  = r.status_code == 200
            tracker.log("api/login/", "POST", lat, r.status_code, ok)
            if ok:
                token = r.json().get("access")
        except Exception as e:
            tracker.log("api/login/", "POST", time.perf_counter()-t0, 0, False, e)

        if not token:
            return   # cannot continue without a session

        c.headers["Authorization"] = f"Bearer {token}"

        # ── Step 3: Authenticated action loop ─────────────────────────────────
        t_start   = time.perf_counter()
        req_count = 0
        rnd_id    = 1

        ACTIONS = ["current_round", "notifications", "leaderboard",
                   "winners", "questions", "results"]

        while True:
            if n_reqs > 0 and req_count >= n_reqs:
                break
            if duration > 0 and (time.perf_counter() - t_start) >= duration:
                break

            action = random.choice(ACTIONS)
            req_count += 1
            await asyncio.sleep(random.uniform(0.05, 0.25))  # think time

            t0 = time.perf_counter()
            try:
                if action == "current_round":
                    r = await c.get(f"{base_url}/api/current-round/")
                    lat = time.perf_counter() - t0
                    tracker.log("api/current-round/", "GET", lat, r.status_code, r.status_code == 200)
                    if r.status_code == 200:
                        rounds = r.json().get("rounds", [])
                        active = [x["id"] for x in rounds if x.get("status") == "ACTIVE"]
                        if active:
                            rnd_id = active[0]
                        elif rounds:
                            rnd_id = rounds[0]["id"]

                elif action == "notifications":
                    r = await c.get(f"{base_url}/api/notifications/")
                    lat = time.perf_counter() - t0
                    tracker.log("api/notifications/", "GET", lat, r.status_code, r.status_code == 200)

                elif action == "leaderboard":
                    r = await c.get(f"{base_url}/api/leaderboard/?round_id={rnd_id}")
                    lat = time.perf_counter() - t0
                    tracker.log("api/leaderboard/", "GET", lat, r.status_code, r.status_code == 200)

                elif action == "winners":
                    r = await c.get(f"{base_url}/api/winners/")
                    lat = time.perf_counter() - t0
                    tracker.log("api/winners/", "GET", lat, r.status_code, r.status_code == 200)

                elif action == "questions":
                    r = await c.get(f"{base_url}/api/questions/{rnd_id}/")
                    lat = time.perf_counter() - t0
                    # 400/403 is fine (round not active / not qualified) — still measures speed
                    tracker.log("api/questions/<id>/", "GET", lat, r.status_code, r.status_code < 500)

                elif action == "results":
                    r = await c.get(f"{base_url}/api/results/")
                    lat = time.perf_counter() - t0
                    tracker.log("api/results/", "GET", lat, r.status_code, r.status_code == 200)

            except Exception as e:
                tracker.log(f"api/{action}/", "ERR", time.perf_counter()-t0, 0, False, e)

# ── Terminal report ────────────────────────────────────────────────────────────
def print_report(s: dict):
    rate_clr = GR if s["rate"] >= 95 else (YL if s["rate"] >= 80 else RD)

    print(f"\n{BD}{MG}{'═'*88}{R}")
    print(f"{BD}{MG}{'  LOAD TEST RESULTS':^88}{R}")
    print(f"{BD}{MG}{'═'*88}{R}")
    print(f"  Elapsed:        {CY}{s['elapsed']:.2f} s{R}")
    print(f"  Total Requests: {CY}{s['total']}{R}  "
          f"(✓ {GR}{s['ok']}{R}  ✗ {RD}{s['fail']}{R})")
    print(f"  Success Rate:   {rate_clr}{BD}{s['rate']:.2f}%{R}")
    print(f"  Throughput:     {BL}{s['rps']:.2f} req/s{R}")
    print()

    # table header
    H = f"  {'Endpoint':<32} {'M':<5} {'OK/Fail':>10}  {'Rate%':>6}  " \
        f"{'Min':>7}  {'Avg':>7}  {'Med':>7}  {'P95':>7}  {'Max':>7}"
    print(f"{BD}{H}{R}")
    print("  " + "─"*96)

    for row in s["rows"]:
        rc = GR if row["rate"] >= 95 else (YL if row["rate"] >= 80 else RD)
        codes_str = " ".join(f"{k}×{v}" for k, v in sorted(row["codes"].items()))
        print(
            f"  {row['ep']:<32} {row['method']:<5} "
            f"{row['ok']:>5}/{row['fail']:<4}  "
            f"{rc}{row['rate']:>5.1f}%{R}  "
            f"{row['min']:>7.0f}  {row['avg']:>7.0f}  {row['med']:>7.0f}  "
            f"{row['p95']:>7.0f}  {row['max']:>7.0f}"
            f"  {CY}[{codes_str}]{R}"
        )
    print("  " + "─"*96)

    if s["errors"]:
        print(f"\n{RD}{BD}── Top Errors ────────────────────{R}")
        for i, e in enumerate(s["errors"][:8], 1):
            print(f"  {i}. [{e['time']}] {YL}{e['method']}{R} {e['ep']} "
                  f"→ {RD}{e['code'] or 'Timeout'}{R} | {e['msg']}")

# ── HTML report ────────────────────────────────────────────────────────────────
def write_html(s: dict, base_url: str, n_users: int, out: str):
    avg_latency = statistics.mean([r["avg"] for r in s["rows"]]) if s["rows"] else 0
    rows_js   = json.dumps(s["rows"])
    errors_js = json.dumps(s["errors"])

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Quiz Backend — Load Test Report</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  *{{box-sizing:border-box}}
  body{{font-family:'Outfit',sans-serif;background:#080d13;color:#dde4ed;margin:0}}
  .mono{{font-family:'JetBrains Mono',monospace}}
  .card{{background:rgba(17,24,39,.7);border:1px solid rgba(255,255,255,.07);
         border-radius:1.25rem;backdrop-filter:blur(14px);
         box-shadow:0 12px 48px rgba(0,0,0,.45)}}
  .grad-text{{background:linear-gradient(135deg,#34d399,#22d3ee,#818cf8);
              -webkit-background-clip:text;-webkit-text-fill-color:transparent}}
  .ping-dot{{width:10px;height:10px;border-radius:50%;background:#34d399;
             animation:ping 1.2s cubic-bezier(0,0,.2,1) infinite}}
  @keyframes ping{{75%,100%{{transform:scale(2);opacity:0}}}}
  table{{border-collapse:collapse;width:100%}}
  th,td{{padding:.65rem 1rem;text-align:left;vertical-align:middle;white-space:nowrap}}
  tr:hover td{{background:rgba(255,255,255,.03)}}
  .badge{{display:inline-block;padding:.15rem .55rem;border-radius:.4rem;
          font-size:.7rem;font-weight:700}}
  .ok-bar{{height:6px;border-radius:3px;background:linear-gradient(90deg,#34d399,#22d3ee)}}
  .fail-bar{{height:6px;border-radius:3px;background:linear-gradient(90deg,#f87171,#fb923c)}}
</style>
</head>
<body class="min-h-screen pb-16">

<!-- ── Header ──────────────────────────────────────────────────────────── -->
<header style="border-bottom:1px solid rgba(255,255,255,.07);background:rgba(8,13,19,.9);
               backdrop-filter:blur(10px)" class="sticky top-0 z-50 px-8 py-4 flex justify-between items-center">
  <div class="flex items-center gap-3">
    <div class="ping-dot"></div>
    <span class="text-2xl font-extrabold grad-text">QuizBackend · SpeedReport</span>
  </div>
  <span class="mono text-sm text-gray-400">{time.strftime("%Y-%m-%d %H:%M:%S")}</span>
</header>

<main class="max-w-7xl mx-auto px-6 mt-8 space-y-8">

  <!-- ── Config banner ─────────────────────────────────────────────────── -->
  <div class="card p-6 flex flex-wrap gap-6 justify-between items-center">
    <div>
      <p class="text-xs text-emerald-400 uppercase tracking-wider mb-1">Target</p>
      <p class="mono text-xl font-bold text-white">{base_url}</p>
    </div>
    <div class="flex gap-10 flex-wrap">
      <div><p class="text-xs text-gray-400">Virtual Users</p>
           <p class="mono text-lg font-semibold text-white">{n_users} VUs</p></div>
      <div><p class="text-xs text-gray-400">Elapsed</p>
           <p class="mono text-lg font-semibold text-white">{s['elapsed']:.2f} s</p></div>
      <div><p class="text-xs text-gray-400">Total Requests</p>
           <p class="mono text-lg font-semibold text-white">{s['total']}</p></div>
      <div><p class="text-xs text-gray-400">Throughput</p>
           <p class="mono text-lg font-semibold text-white">{s['rps']:.2f} req/s</p></div>
    </div>
  </div>

  <!-- ── KPI cards ─────────────────────────────────────────────────────── -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
    <!-- Success rate -->
    <div class="card p-6">
      <p class="text-sm text-gray-400 mb-2">Success Rate</p>
      <p class="mono text-4xl font-extrabold text-emerald-400">{s['rate']:.1f}%</p>
      <div class="mt-4 bg-gray-800 rounded-full overflow-hidden" style="height:6px">
        <div class="ok-bar" style="width:{min(s['rate'],100):.1f}%"></div>
      </div>
    </div>
    <!-- Throughput -->
    <div class="card p-6">
      <p class="text-sm text-gray-400 mb-2">Throughput</p>
      <p class="mono text-4xl font-extrabold text-sky-400">{s['rps']:.2f}</p>
      <p class="text-xs text-gray-500 mt-4">requests / second</p>
    </div>
    <!-- Avg latency -->
    <div class="card p-6">
      <p class="text-sm text-gray-400 mb-2">Avg Latency</p>
      <p class="mono text-4xl font-extrabold text-amber-400">{avg_latency:.0f}</p>
      <p class="text-xs text-gray-500 mt-4">milliseconds (all endpoints)</p>
    </div>
    <!-- Failures -->
    <div class="card p-6">
      <p class="text-sm text-gray-400 mb-2">Failed Requests</p>
      <p class="mono text-4xl font-extrabold text-rose-500">{s['fail']}</p>
      <p class="text-xs text-gray-500 mt-4">HTTP ≥ 400 or timeouts</p>
    </div>
  </div>

  <!-- ── Charts ────────────────────────────────────────────────────────── -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card p-6">
      <p class="font-bold text-white mb-4">Latency — Avg vs P95 (ms)</p>
      <div style="height:280px"><canvas id="chartLatency"></canvas></div>
    </div>
    <div class="card p-6">
      <p class="font-bold text-white mb-4">Request Share by Endpoint</p>
      <div style="height:280px"><canvas id="chartDist"></canvas></div>
    </div>
  </div>

  <!-- ── Detailed table ────────────────────────────────────────────────── -->
  <div class="card overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-800">
      <p class="font-bold text-white text-lg">Endpoint Performance Details</p>
    </div>
    <div class="overflow-x-auto">
      <table>
        <thead>
          <tr style="background:rgba(255,255,255,.04);font-size:.75rem;color:#6b7280;text-transform:uppercase">
            <th>Endpoint</th><th>Method</th><th class="text-center">OK / Fail</th>
            <th class="text-center">Rate %</th><th class="text-right">Min</th>
            <th class="text-right">Avg</th><th class="text-right">Median</th>
            <th class="text-right">P90</th><th class="text-right">P95</th>
            <th class="text-right">Max</th><th>Status Codes</th>
          </tr>
        </thead>
        <tbody id="tbody" style="font-size:.85rem"></tbody>
      </table>
    </div>
  </div>

  <!-- ── Errors ─────────────────────────────────────────────────────────── -->
  <div id="errSection" class="card p-6 hidden">
    <p class="text-rose-400 font-bold text-lg mb-4">⚠ Error Log (last 60)</p>
    <div style="max-height:280px;overflow-y:auto">
      <table style="font-size:.78rem">
        <thead>
          <tr style="color:#6b7280">
            <th>Time</th><th>Endpoint</th><th>Method</th><th>Code</th><th>Message</th>
          </tr>
        </thead>
        <tbody id="errTbody" class="mono"></tbody>
      </table>
    </div>
  </div>

</main>

<script>
const ROWS   = {rows_js};
const ERRORS = {errors_js};

/* ── Populate table ─────────────────────────────────────────────────────── */
const tbody = document.getElementById('tbody');
ROWS.forEach(r => {{
  const rc = r.rate >= 95 ? '#34d399' : r.rate >= 80 ? '#fbbf24' : '#f87171';
  const codes = Object.entries(r.codes).map(([k,v])=>
    `<span class="badge" style="background:rgba(99,102,241,.2);color:#a5b4fc">
      ${{k}}×${{v}}</span>`).join(' ');
  const tr = document.createElement('tr');
  tr.style.borderTop = '1px solid rgba(255,255,255,.05)';
  tr.innerHTML = `
    <td class="mono" style="color:#e2e8f0;font-weight:600">${{r.ep}}</td>
    <td><span class="badge" style="background:rgba(255,255,255,.08);color:#cbd5e1">${{r.method}}</span></td>
    <td class="mono text-center" style="color:#94a3b8">
      <span style="color:#34d399">${{r.ok}}</span> / <span style="color:#f87171">${{r.fail}}</span>
    </td>
    <td class="text-center mono font-bold" style="color:${{rc}}">${{r.rate.toFixed(1)}}%</td>
    <td class="mono text-right" style="color:#94a3b8">${{r.min.toFixed(0)}}</td>
    <td class="mono text-right font-bold" style="color:#e2e8f0">${{r.avg.toFixed(0)}}</td>
    <td class="mono text-right" style="color:#94a3b8">${{r.med.toFixed(0)}}</td>
    <td class="mono text-right" style="color:#94a3b8">${{r.p90.toFixed(0)}}</td>
    <td class="mono text-right" style="color:#fbbf24;font-weight:600">${{r.p95.toFixed(0)}}</td>
    <td class="mono text-right" style="color:#f87171">${{r.max.toFixed(0)}}</td>
    <td style="min-width:120px">${{codes}}</td>`;
  tbody.appendChild(tr);
}});

/* ── Errors table ───────────────────────────────────────────────────────── */
if (ERRORS.length > 0) {{
  document.getElementById('errSection').classList.remove('hidden');
  const et = document.getElementById('errTbody');
  ERRORS.forEach(e => {{
    const tr = document.createElement('tr');
    tr.style.borderTop = '1px solid rgba(255,255,255,.05)';
    tr.innerHTML = `
      <td style="color:#6b7280;padding:.5rem 1rem">${{e.time}}</td>
      <td style="color:#fca5a5;padding:.5rem 1rem">${{e.ep}}</td>
      <td style="color:#94a3b8;padding:.5rem 1rem">${{e.method}}</td>
      <td style="color:#f87171;font-weight:700;padding:.5rem 1rem">${{e.code||'Timeout'}}</td>
      <td style="color:#d1d5db;padding:.5rem 1rem;max-width:300px;overflow:hidden;
                 text-overflow:ellipsis" title="${{e.msg}}">${{e.msg}}</td>`;
    et.appendChild(tr);
  }});
}}

/* ── Charts ─────────────────────────────────────────────────────────────── */
const PALETTE = ['#34d399','#38bdf8','#818cf8','#fb923c','#f472b6',
                  '#a78bfa','#22d3ee','#fbbf24','#86efac','#f87171'];

new Chart(document.getElementById('chartLatency'), {{
  type: 'bar',
  data: {{
    labels: ROWS.map(r => r.ep),
    datasets: [
      {{ label:'Avg (ms)',  data: ROWS.map(r=>r.avg), backgroundColor:'rgba(56,189,248,.55)',
         borderColor:'#38bdf8', borderWidth:1, borderRadius:5 }},
      {{ label:'P95 (ms)',  data: ROWS.map(r=>r.p95), backgroundColor:'rgba(251,191,36,.55)',
         borderColor:'#fbbf24', borderWidth:1, borderRadius:5 }},
    ]
  }},
  options:{{
    responsive:true, maintainAspectRatio:false,
    plugins:{{ legend:{{ labels:{{ color:'#9ca3af' }} }} }},
    scales:{{
      x:{{ ticks:{{ color:'#9ca3af' }}, grid:{{ display:false }} }},
      y:{{ ticks:{{ color:'#9ca3af' }}, grid:{{ color:'#1f2937' }},
           title:{{ display:true, text:'ms', color:'#9ca3af' }} }}
    }}
  }}
}});

new Chart(document.getElementById('chartDist'), {{
  type:'doughnut',
  data:{{
    labels: ROWS.map(r => r.ep),
    datasets:[{{ data: ROWS.map(r=>r.total),
      backgroundColor: PALETTE.slice(0, ROWS.length),
      borderColor:'#080d13', borderWidth:3
    }}]
  }},
  options:{{
    responsive:true, maintainAspectRatio:false,
    plugins:{{ legend:{{ position:'right', labels:{{ color:'#9ca3af', boxWidth:12 }} }} }}
  }}
}});
</script>
</body>
</html>"""

    try:
        with open(out, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"\n{GR}{BD}HTML report → {out}{R}")
    except Exception as e:
        print(f"{RD}Could not write HTML: {e}{R}")

# ── Main entry point ───────────────────────────────────────────────────────────
async def main():
    p = argparse.ArgumentParser(description="Quiz Backend Load Tester v2")
    p.add_argument("--url",      default="http://127.0.0.1:8000",
                   help="Backend base URL  (no trailing slash)")
    p.add_argument("--users",    type=int,   default=10,
                   help="Concurrent virtual users")
    p.add_argument("--requests", type=int,   default=100,
                   help="Total auth-loop requests per VU")
    p.add_argument("--duration", type=float, default=0,
                   help="Duration-based test (seconds).  Overrides --requests per VU.")
    p.add_argument("--mode",     choices=["quick","load","both"], default="both")
    p.add_argument("--admin-register-no", default="admin",
                   help="Admin register_no used for Scenario A login")
    p.add_argument("--admin-password",    default="admin@123",
                   help="Admin password used for Scenario A login")
    p.add_argument("--output-html", default="speed_test_report.html",
                   help="Path for the HTML dashboard")
    p.add_argument("--stagger",  type=float, default=0.15,
                   help="Seconds between each VU start (reduces cold-start pile-up)")
    args = p.parse_args()

    base_url = args.url.rstrip("/")

    print(f"{BD}{GR}{'═'*70}{R}")
    print(f"{BD}{GR}{'  QUIZ BACKEND PERFORMANCE TESTER  v2.0':^70}{R}")
    print(f"{BD}{GR}{'═'*70}{R}")
    print(f"  URL:          {BD}{base_url}{R}")
    print(f"  Virtual Users:{CY} {args.users}{R}")
    print(f"  Mode:         {CY} {args.mode.upper()}{R}")
    if args.duration > 0:
        print(f"  Duration:     {CY} {args.duration} s per VU{R}")
    else:
        print(f"  Requests:     {CY} {args.requests} per VU{R}")
    print(f"  VU stagger:   {CY} {args.stagger} s{R}")
    print(f"  Admin login:  {CY} {args.admin_register_no}{R}")

    # ── Connectivity check (generous timeout for Render cold-start) ──────────
    print(f"\n  Checking server connectivity (up to 30 s warm-up)…", end=" ", flush=True)
    try:
        async with httpx.AsyncClient(timeout=30.0) as c:
            r = await c.get(f"{base_url}/api/winners/")
            print(f"{GR}online  (HTTP {r.status_code}){R}")
    except Exception as e:
        print(f"{RD}UNREACHABLE — {e}{R}")
        print(f"{YL}  Hint: if using Render free tier, wait ~30 s for cold-start and retry.{R}")
        sys.exit(1)

    tracker = Tracker()
    tracker.t0 = time.perf_counter()

    # ── Scenario A ────────────────────────────────────────────────────────────
    if args.mode in ("quick", "both"):
        await scenario_a(base_url, args.admin_register_no,
                         args.admin_password, tracker)

    # ── Scenario B ────────────────────────────────────────────────────────────
    if args.mode in ("load", "both"):
        print(f"\n{BD}{BL}══ Scenario B — Concurrent Load Test  "
              f"({args.users} VUs) ══{R}")
        session = uuid.uuid4().hex[:5].upper()
        reqs_per_vu = max(1, args.requests // max(args.users, 1))

        tasks = [
            vu_task(
                vu_id=i,
                base_url=base_url,
                n_reqs=reqs_per_vu,
                duration=args.duration,
                tracker=tracker,
                session=session,
                stagger_s=i * args.stagger,
            )
            for i in range(1, args.users + 1)
        ]
        print(f"  Spawning {args.users} virtual users "
              f"(staggered {args.stagger}s apart)…")
        await asyncio.gather(*tasks)
        print(f"  {GR}All VUs finished.{R}")

    tracker.t1 = time.perf_counter()

    s = tracker.summary()
    print_report(s)
    write_html(s, base_url, args.users, args.output_html)

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{RD}Interrupted by user.{R}")
