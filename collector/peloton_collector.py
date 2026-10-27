"""
peloton_collector.py - pulls your Peloton data through Peloton's (unofficial) web API.

What it does
  fetch_all() reads your workout history (Peloton's own CSV export, fetched through the API),
  your achievements (badge names + times earned) and your profile overview, and returns them
  as one compact dict. peloton_mcp_server.py calls it when you press Update data in the report.
  Run this file directly (py peloton_collector.py) to write peloton_data.json instead, which
  the report can also load with "Load a file".

Authentication
  Peloton now signs in through Auth0, so this uses the Bearer token your browser already has.
  One-time setup: sign in at members.onepeloton.com, press F12 > Network, refresh, click any
  request to api.onepeloton.com and copy the value after "Authorization: Bearer ".
  Paste it alone into peloton_token.txt next to this script. It lasts roughly a year; when it
  expires the script stops with a clear message and you paste a fresh one.
  Keep peloton_token.txt private - it is as good as your password for reading your account.

GitHub Actions
  The nightly workflow passes the token in the PELOTON_TOKEN environment variable (a repository
  secret) and runs:  python collector/peloton_collector.py --out docs/data/peloton_data.json

Requires: Python 3.9+ and `pip install requests`
Peloton does not publish this API and can change it at any time; use it only for your own data.
"""
import argparse, csv, io, json, os, sys, time, logging
from datetime import datetime, timezone
from pathlib import Path

import requests

# ---------------------------------------------------------------- settings
HERE = Path(__file__).resolve().parent
TOKEN_FILE = HERE / "peloton_token.txt"
JSON_OUT = HERE / "peloton_data.json"
LOG_FILE = HERE / "PelotonRefresh.log"
TIMEZONE = "America/Edmonton"  # time zone for CSV timestamps; change to America/Toronto etc. if needed
API = "https://api.onepeloton.com"
# ---------------------------------------------------------------------------

# logs go to a file and stderr only: stdout is reserved for the MCP protocol
_handlers = [logging.StreamHandler(sys.stderr)]
if not os.environ.get("GITHUB_ACTIONS"):          # no log file on GitHub's runners
    _handlers.append(logging.FileHandler(LOG_FILE, encoding="utf-8"))
logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s", handlers=_handlers)
log = logging.getLogger("peloton")


class PelotonError(Exception):
    pass


class Peloton:
    def __init__(self, token: str):
        self.s = requests.Session()
        self.s.headers.update({
            "Authorization": f"Bearer {token}",
            "Peloton-Platform": "web",
            "User-Agent": "Mozilla/5.0 (personal workout report)",
            "Accept": "application/json",
        })

    def get(self, path, params=None, raw=False, tries=4):
        for attempt in range(tries):
            r = self.s.get(API + path, params=params, timeout=60)
            if r.status_code == 401:
                raise PelotonError("Peloton rejected the token (401). Paste a fresh Bearer token into peloton_token.txt or the PELOTON_TOKEN secret.")
            if r.status_code in (429, 500, 502, 503, 504):
                wait = 5 * (attempt + 1)
                log.info(f"{r.status_code} on {path}; retrying in {wait}s")
                time.sleep(wait)
                continue
            r.raise_for_status()
            time.sleep(0.4)                      # be gentle with Peloton's servers
            return r.content if raw else r.json()
        r.raise_for_status()


def num(v):
    try:
        return float(str(v).replace(",", "")) if v not in ("", None) else 0.0
    except ValueError:
        return 0.0


def parse_csv(text):
    """Turn Peloton's CSV into compact workout records for the report."""
    out = []
    for row in csv.DictReader(io.StringIO(text)):
        ts = (row.get("Workout Timestamp") or "").split(" (")[0].strip()   # e.g. "2026-10-12 06:05 (MDT)"
        try:
            dt = datetime.strptime(ts, "%Y-%m-%d %H:%M")
        except ValueError:
            continue
        inst = (row.get("Instructor Name") or "").strip()
        typ = (row.get("Type") or "").strip()
        disc = (row.get("Fitness Discipline") or "").strip()
        # Strength+ and Breathwrk sessions arrive with no instructor and no class type
        if disc == "Strength" and not inst and not typ:
            disc = "Strength+"
        elif disc == "Meditation" and not inst and not typ:
            disc = "Breathwrk"
        out.append({
            "date": dt.strftime("%Y-%m-%d"), "time": dt.strftime("%H:%M"),
            "disc": disc, "inst": inst, "type": typ,
            "title": (row.get("Title") or "").strip(),
            "live": (row.get("Live/On-Demand") or "").strip(),
            "len": int(num(row.get("Length (minutes)"))),
            "out": num(row.get("Total Output")), "dist": num(row.get("Distance (km)") or row.get("Distance (mi)")),
            "spd": num(row.get("Avg. Speed (kph)") or row.get("Avg. Speed (mph)")),
            "hr": num(row.get("Avg. Heartrate")), "cal": num(row.get("Calories Burned")),
        })
    return out


FIELDS = ["date", "time", "disc", "inst", "type", "title", "live", "len", "out", "dist", "spd", "hr", "cal"]


def fetch_all():
    """Return {source, username, generated, fields, rows, badges, streaks, peloton_counts}."""
    token = os.environ.get("PELOTON_TOKEN", "").strip()
    if not token:
        if not TOKEN_FILE.exists():
            raise PelotonError(f"Missing {TOKEN_FILE.name} (or the PELOTON_TOKEN secret). See the setup notes at the top of peloton_collector.py.")
        token = TOKEN_FILE.read_text(encoding="utf-8").strip()
    token = token.removeprefix("Bearer ").strip()
    p = Peloton(token)

    me = p.get("/api/me")
    uid, username = me["id"], me.get("username", "")
    log.info(f"Signed in as {username}")

    csv_bytes = p.get(f"/api/user/{uid}/workout_history_csv", params={"timezone": TIMEZONE}, raw=True)
    workouts = parse_csv(csv_bytes.decode("utf-8-sig", errors="replace"))
    log.info(f"Workout history: {len(workouts)} workouts")
    if not workouts:
        raise PelotonError("Peloton returned no workouts - keeping the existing data.")

    badges = []
    ach = p.get(f"/api/user/{uid}/achievements")
    for cat in ach.get("categories", []):
        for a in cat.get("achievements", []):
            t = a.get("template", {})
            if a.get("count"):
                badges.append({"name": t.get("name", ""), "category": cat.get("name", ""), "count": a.get("count", 0)})
    log.info(f"Achievements: {len(badges)} earned")

    ov = p.get(f"/api/user/{uid}/overview", params={"version": 1})
    streaks = ov.get("streaks", {}) or {}
    counts = {w.get("name"): w.get("count") for w in (ov.get("workout_counts", {}) or {}).get("workouts", [])}

    return {
        "source": "peloton-api", "username": username,
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "fields": FIELDS, "rows": [[w[f] for f in FIELDS] for w in workouts],
        "badges": badges,
        "streaks": {"current_weekly": streaks.get("current_weekly"), "best_weekly": streaks.get("best_weekly"),
                    "current_daily": streaks.get("current_daily")},
        "peloton_counts": counts,
    }


def main():
    ap = argparse.ArgumentParser(description="Fetch your Peloton data into peloton_data.json")
    ap.add_argument("--out", default=str(JSON_OUT), help="where to write the JSON (default: next to this script)")
    args = ap.parse_args()
    data = fetch_all()
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    log.info(f"Wrote {out} ({len(data['rows'])} workouts)")


if __name__ == "__main__":
    try:
        main()
    except (PelotonError, requests.RequestException) as e:
        log.error(str(e))
        sys.exit(1)
