# Peloton Workout Report

A personal workout report hosted on GitHub Pages. The scheduled GitHub Actions workflow refreshes workout history, badges, and streaks from Peloton, commits the generated JSON, and deploys the report. Changes under `docs/` also trigger a deployment.

## GitHub setup

1. In **Settings → Pages**, set the build source to **GitHub Actions**.
2. Add the Peloton Bearer token as an Actions secret named `PELOTON_TOKEN`. Do not put the token in the repository, workflow files, or Pages output. For local use, the collector reads `collector/peloton_token.txt`; that file is ignored by Git.
3. Ensure the repository Actions setting permits the workflow’s `GITHUB_TOKEN` to write contents. The refresh job needs this permission to commit updated workout data to `main`.
4. Keep the `github-pages` deployment environment available for the Pages deploy job.

The workflow refreshes daily at 07:00 UTC. You can also run **Actions → Refresh Peloton data → Run workflow** on `main`.

## Custom domain and Cloudflare

The intended site is [https://peloton.guitard.ca/](https://peloton.guitard.ca/). The repository’s **Settings → Pages** already has this custom domain configured; a CNAME file is not used by this GitHub Actions publishing workflow. In Cloudflare, set a CNAME for `peloton` pointing to `ericguitard.github.io`. Check that Cloudflare proxy or redirect rules do not forward visitors to `guitard.ca`; using DNS-only while GitHub verifies the record and provisions HTTPS is a useful troubleshooting step.

The deployment workflow checks the report and `data/peloton_data.json` at the custom domain after publishing. To enable targeted cache purges in Cloudflare, configure:

- Actions variable `CLOUDFLARE_ZONE_ID` for the `guitard.ca` zone.
- Actions secret `CLOUDFLARE_API_TOKEN` with only the Cloudflare cache purge permission for that zone.

The purge is skipped when either value is missing. Never place the token in a variable or commit it to the repository.

## Privacy and maintenance

The report and `docs/data/peloton_data.json` are public. Workout history, badges, streaks, and the Peloton username in the JSON can be viewed by anyone. The page asks search engines not to index the data, but this does not make it private. Remove the public data or change hosting if you do not want it publicly available.

Peloton’s API is unofficial and may change. If the collector fails, check the Actions run and refresh `PELOTON_TOKEN` if Peloton has expired it. The workflow pins third-party actions to commit SHAs; Dependabot checks for updates weekly.
