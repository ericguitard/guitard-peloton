# Peloton Workout Report

A self-updating copy of the Workout Report on GitHub Pages. Every night a GitHub Action signs in to Peloton with your token, pulls your workouts, badges and streaks into `docs/data/peloton_data.json`, commits it and republishes the site. The page loads that file whenever it opens.

## One-time setup

1. **Create the repository.** On GitHub, make a new repository (for example `peloton-report`) and upload everything in this folder, keeping the folder structure, including the hidden `.github` and `docs/.nojekyll`.
2. **Add your token as a secret.** Get your Bearer token (sign in at members.onepeloton.com, press F12, open Network, refresh, click any request to `api.onepeloton.com` and copy the value after `Authorization: Bearer`). In the repository go to **Settings → Secrets and variables → Actions → New repository secret**, name it `PELOTON_TOKEN` and paste the token.
3. **Turn on Pages.** **Settings → Pages → Build and deployment → Source: GitHub Actions.**
4. **Run it once.** **Actions → Refresh Peloton data → Run workflow.** When it finishes, the site is at `https://<your-username>.github.io/<repository-name>/`.

After that it runs on its own every night.

## Good to know

- **The site is public.** GitHub Pages sites can be seen by anyone with the link, even from a private repository (unless you are on GitHub Enterprise Cloud), and so can `data/peloton_data.json`. The page asks search engines not to index it, but that does not make it private. The page also shows Peloton's logo and badge images.
- **When the token expires** (roughly once a year), the nightly run fails and GitHub emails you. Paste a fresh token into the `PELOTON_TOKEN` secret and run the workflow again.
- **Timing.** The schedule is 07:00 UTC: midnight Mountain Standard Time, 1:00 a.m. in summer. Change the `cron` line in `.github/workflows/refresh-peloton.yml` for another time. GitHub sometimes starts scheduled runs a little late.
- **Peloton's API is unofficial.** Peloton can change it without notice, and some services block requests from cloud servers. If the nightly run starts failing with 403 errors, Peloton is likely refusing GitHub's servers and the collector will need to run from your own computer instead.
- `collector/peloton_collector.py` still works on your laptop exactly as before (it reads `peloton_token.txt` when the secret is not set), and `fetch_all()` is unchanged for the desktop connector.
