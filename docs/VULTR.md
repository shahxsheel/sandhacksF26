# Vultr hosting

FirstLink runs on one Vultr Cloud Compute VM in Los Angeles: `vc2-2c-4gb` (2 vCPU, 4 GB RAM), Ubuntu 24.04 LTS. The plan price verified at provisioning was **$20/month**. The user's total project cap is **$100**; the VM continues accruing charges until deleted. No GPU, backup, additional cloud volume, or managed database was enabled.

Public demo: https://firstlink.144.202.126.31.sslip.io

## Verified deployment

- The official API initially rejected the workstation IP. The user added its `/32` without removing existing access entries; the next account check succeeded.
- One project SSH key and firewall group were created. SSH is restricted to the administrator IP; public ports 80 and 443 are allowed by both the Vultr firewall and host UFW. The app's port 3000 binds only to `127.0.0.1`.
- Docker and Compose build/run the standalone Next.js container. The image includes ffmpeg and runs as unprivileged `node`; uploads and narration cache persist under `/opt/firstlink/data`.
- Host Caddy terminates automated HTTPS and proxies to localhost. The public browser loaded a secure context and completed report, note, approval, and acceptance mutations.
- The container health check is healthy and uses a cheap endpoint with no database or paid provider call.

## Release and operations

Use the checked-in [Compose file](../deploy/compose.yml) and [Caddyfile](../deploy/Caddyfile). The exact layout, release evidence, and retirement instructions are in [DEPLOYMENT.md](DEPLOYMENT.md). Do not use a second Caddy container or expose app port 3000 publicly.

Runtime secrets are supplied from root-owned mode-0600 `/opt/firstlink/runtime.env`. The Vultr API key remains on the provisioning workstation and is never passed to the app. Generated SSH keys and infrastructure identifiers are in ignored `.deployment/`.

IP-mapped `sslip.io` DNS provides the demo hostname without a domain purchase. No custom domain or Best Domain Name eligibility is claimed.

## References

- [Vultr API](https://docs.vultr.com/)
- [Vultr API IP allowlist](https://docs.vultr.com/how-to-manage-the-vultr-api-ip-allowlist-for-an-organization-user)
- [Official Vultr CLI](https://github.com/vultr/vultr-cli)
- [Caddy reverse proxy](https://caddyserver.com/docs/quick-starts/reverse-proxy)
- [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
