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
import argparse, csv, io, json, os, re, sys, time, logging, math
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
        # Peloton has used both minute-precision and second/ISO-precision
        # timestamps. Normalize either form before parsing so new rows are not
        # silently discarded from the exported history.
        match = re.search(r"\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?", ts)
        if match:
            ts = match.group(0).replace("T", " ")
        try:
            dt = datetime.fromisoformat(ts)
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


def parse_challenge_progress(payload):
    """Export only challenge IDs and the credited metric used by Peloton's UI."""
    result = {}
    for item in payload.get("challenges", []):
        summary = item.get("challenge_summary", item.get("challengeSummary", {}))
        progress = item.get("progress", {})
        challenge_id = summary.get("id", "")
        value = progress.get("metric_value", progress.get("metricValue"))
        if (isinstance(challenge_id, str) and re.fullmatch(r"[0-9a-f]{32}", challenge_id)
                and isinstance(value, (int, float)) and not isinstance(value, bool)
                and math.isfinite(value) and value >= 0):
            result[challenge_id] = {"value": value}
    return result


def challenge_field(obj, snake, camel):
    return obj.get(snake, obj.get(camel)) if isinstance(obj, dict) else None


def challenge_number(value):
    return (isinstance(value, (int, float)) and not isinstance(value, bool)
            and math.isfinite(value) and value >= 0)


def challenge_date(value):
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return datetime.fromtimestamp(value, timezone.utc).isoformat()
    if isinstance(value, str) and value:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.replace(tzinfo=parsed.tzinfo or timezone.utc).astimezone(timezone.utc).isoformat()
    return None


def parse_active_challenge(item, now=None):
    """Allowlist catalogue fields; never publish participants or account data."""
    summary = challenge_field(item, "challenge_summary", "challengeSummary") or {}
    detail = challenge_field(item, "challenge_detail", "challengeDetail") or {}
    progress = item.get("progress") or {}
    if challenge_field(progress, "has_joined", "hasJoined") is not True:
        return None
    cid = summary.get("id", "")
    if not isinstance(cid, str) or not re.fullmatch(r"[0-9a-f]{32}", cid):
        return None
    if summary.get("status") != "current":
        return None
    start = challenge_date(challenge_field(summary, "start_time", "startTime"))
    end = challenge_date(challenge_field(summary, "end_time", "endTime"))
    now = now or datetime.now(timezone.utc)
    if (start and datetime.fromisoformat(start) > now) or (end and datetime.fromisoformat(end) <= now):
        return None
    value = challenge_field(progress, "metric_value", "metricValue")
    display = challenge_field(progress, "metric_display_value", "metricDisplayValue")
    unit = challenge_field(progress, "metric_display_unit", "metricDisplayUnit")
    tiers = []
    for tier in detail.get("tiers", []):
        target = challenge_field(tier, "metric_value", "metricValue")
        if not challenge_number(target) or not target or not challenge_field(tier, "has_reward", "hasReward"):
            continue
        tiers.append({"value": target, "title": str(tier.get("title") or "Goal")[:100],
                      "display_value": str(challenge_field(tier, "metric_display_value", "metricDisplayValue") or target)[:100],
                      "display_unit": str(challenge_field(tier, "metric_display_unit", "metricDisplayUnit") or unit or "")[:100]})
    tiers.sort(key=lambda tier: tier["value"])
    current_tier = challenge_field(progress, "current_tier", "currentTier") or {}
    next_tier = challenge_field(progress, "next_tier", "nextTier")
    joined = challenge_field(progress, "has_joined", "hasJoined")
    completed = (challenge_number(value) and tiers and value >= tiers[-1]["value"]) or (
        joined is True and ("next_tier" in progress or "nextTier" in progress) and next_tier is None
        and challenge_field(current_tier, "has_reward", "hasReward") is True)
    if completed:
        return None
    return {"id": cid, "title": str(summary.get("title") or "Peloton challenge")[:300],
            "description": str(summary.get("description") or "")[:2000],
            "start": start, "end": end, "status": "current", "completed": False, "joined": True,
            "value": value if challenge_number(value) else None,
            "display_value": str(display)[:100] if display is not None else None,
            "display_unit": str(unit or "")[:100], "tiers": tiers}


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

    # The CSV export can be edge-cached by Peloton. Include a per-request cache
    # key so a manual refresh cannot silently reuse an older workout snapshot.
    csv_bytes = p.get(
        f"/api/user/{uid}/workout_history_csv",
        params={"timezone": TIMEZONE, "_": int(time.time())},
        raw=True,
    )
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

    # Reps and collection-specific challenges cannot be reconstructed from CSV.
    # Use the same credited progress as Peloton's challenge page, never a guess
    # from class titles. Do not export participant or account details.
    challenge_progress = {}
    active_challenges = None
    try:
        catalogue = p.get(
            f"/api/user/{uid}/challenges/current",
            params={"has_joined": "true", "_": int(time.time())},
        )
        challenge_progress = parse_challenge_progress(catalogue)
        active_challenges = []
        seen = set()
        for item in catalogue["challenges"]:
            summary = challenge_field(item, "challenge_summary", "challengeSummary") or {}
            cid = summary.get("id", "")
            if not isinstance(cid, str) or not re.fullmatch(r"[0-9a-f]{32}", cid) or cid in seen:
                continue
            seen.add(cid)
            # Details supply all reward tiers, including goals beyond the next badge.
            details = p.get(f"/api/user/{uid}/challenge/{cid}")
            challenge = parse_active_challenge(details)
            if challenge is not None:
                active_challenges.append(challenge)
        log.info("Challenge progress: %d totals", len(challenge_progress))
        log.info("Active incomplete challenges: %d", len(active_challenges))
    except (requests.RequestException, PelotonError, TypeError, ValueError, AttributeError, KeyError, OverflowError):
        active_challenges = None
        log.warning("Challenge progress unavailable; workout history is still updated")

    return {
        "source": "peloton-api", "username": username,
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "fields": FIELDS, "rows": [[w[f] for f in FIELDS] for w in workouts],
        "badges": badges,
        "streaks": {"current_weekly": streaks.get("current_weekly"), "best_weekly": streaks.get("best_weekly"),
                    "current_daily": streaks.get("current_daily")},
        "peloton_counts": counts,
        "challenge_progress": challenge_progress,
        "active_challenges": active_challenges,
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
