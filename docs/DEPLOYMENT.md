# FirstLink deployment

The private source repository is https://github.com/shahxsheel/sandhacks. Work is checkpointed on `main`. Runtime credentials, generated SSH keys, media, and infrastructure state are excluded from Git.

## Provisioned resources

- Vultr Cloud Compute `vc2-2c-4gb`, 2 vCPU / 4 GB, Los Angeles, Ubuntu 24.04 LTS.
- Verified plan price at provisioning: USD 20/month, within the user's USD 100 total project cap. No backups, GPU, paid database, or extra compute was enabled. This is an ongoing compute rate, not a provider-side hard budget cap.
- One dedicated firewall group permits SSH from the provisioning workstation and public HTTP/HTTPS. Application port 3000 is bound only to localhost behind Caddy.
- Instance identifiers, key references, and the generated private deployment key are in ignored `.deployment/`; do not publish them.
- Public hostname: https://firstlink.144.202.126.31.sslip.io. It uses IP-mapped DNS and requires no domain purchase. The public browser loaded a secure HTTPS context and completed report, note, approval, and acceptance mutations.

## Runtime layout

`/opt/firstlink/source` contains a Git-archived release; `/opt/firstlink/data` persists validated uploads and audio cache; `/opt/firstlink/runtime.env` contains only runtime provider credentials with root-only permissions. Docker passes those variables to the unprivileged app container. The Vultr API key and Neon account credentials are not sent to the VM.

The checked-in `deploy/compose.yml` runs one standalone Next.js image. Host Caddy uses `deploy/Caddyfile` and the `FIRSTLINK_HOST` environment variable to terminate HTTPS. Health checks hit `/api/health`, which never queries Neon or paid providers.

## Release process

The production image includes ffmpeg and runs as uid 1000. It was built on the VM rather than the unavailable local Colima daemon. Host UFW must allow 80 and 443 in addition to the Vultr firewall; omitting the host rules caused the initial certificate challenge to time out. Both layers are now configured and public HTTPS works.

1. Complete source checks, targeted end-to-end tests, and secret scanning; commit and push the reviewed release.
2. Run the explicit database initialization script once against the existing project. Never apply `neon.ts` automatically or create another Neon branch/compute.
3. Transfer the committed source with `git archive`; transfer runtime secrets separately through SSH stdin. Never put secrets in command arguments, logs, or the Docker build context.
4. Build/start Compose, configure Caddy, and verify the home page, health, full role workflow, persisted state, authorized uploads, and public HTTPS.
5. Record the deployed commit and verification evidence here. Do not equate a running VM or successful local build with a complete deployment.

For an existing release on this VM (run from the repository root):

```sh
ssh -i .deployment/id_ed25519 -o UserKnownHostsFile=.deployment/known_hosts root@144.202.126.31 \
  'docker compose -p firstlink -f /opt/firstlink/source/deploy/compose.yml ps'
```

Build and start use the same Compose path with `build` and `up -d`. Avoid printing the resolved Compose environment, container environment, or runtime secret file. Source must come from the reviewed commit; uncommitted local edits are not included by `git archive HEAD`.

## Public checks

The browser loaded a secure context, and report → note → approval → acceptance persisted successfully. A separate deployed-server integration submitted a photo and 7.15-second WAV, received completed ElevenLabs transcription, generated a source-valid Gemini brief, and retrieved cached MP3 narration. Authenticated media returned 200, anonymous requests returned 404, and shared views omitted owner tokens. Full evidence is in [VALIDATION.md](VALIDATION.md). The first reviewed application release was `b01d267def3050ae6dcfcf9731b51da5f2241877`. Its image built successfully on Node 24/Linux and Compose reported healthy after replacement. The previous media report, live Gemini brief, and byte-identical cached narration survived that replacement. The public browser then submitted a witness report, added a note, approved Maya, accepted via a separate shared volunteer context, and refreshed the coordinator to show the accepted status. The 320 px share dialog fits the viewport, with zero page/hydration errors. Browser recording was then verified with a synthetic input stream and live transcription, while physical microphone access remains untested. The release identifier is also stored at `/opt/firstlink/RELEASE`; subsequent documentation-only commits do not change the running application code.

## Retiring resources

The running instance continues to accrue compute charges until deleted. When retirement is authorized, remove this project's instance, firewall group, and deployment SSH key, and check separately for project snapshots/volumes. Do not delete unrelated account resources. Keep ongoing charges below the user's cap and disclose the active plan in the handoff.

## Two-step witness update

Current application release: `afc3f35e94b85888b8c48f995c964e04a12d81da`. Witnesses first read the safety disclaimer and confirm consent, then continue to the observation form. Returning to safety preserves text, photo, and audio drafts. The image built successfully, Compose reported healthy, and a public 320 px browser check passed disclaimer gating, forward/back navigation, and draft retention with zero page errors. No paid provider calls were required for this update.
