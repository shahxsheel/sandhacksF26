# Vultr Single-Server Deployment Checklist

This document details the deployment plan for running the Next.js 16 standalone application container ([Dockerfile](/Users/shahxsheel/.t3/projects/sandhacks/Dockerfile)) on a single Vultr Cloud Compute instance with automated HTTPS.

---

## 1. Current State vs. Documented Plan

* **Documented plan only:** No Vultr virtual machine, firewall group, DNS record, or cloud resource has been provisioned.
* **Local runtime verification:** As noted in [docs/SETUP.md](/Users/shahxsheel/.t3/projects/sandhacks/docs/SETUP.md#L72), the local Docker daemon (Colima) is stopped/unavailable, so the container image has not been built or executed locally. The standalone Next.js build and TypeScript typecheck pass in the local Node environment ([docs/SETUP.md](/Users/shahxsheel/.t3/projects/sandhacks/docs/SETUP.md#L66)).
* **Authorized budget:** The user supplied a USD 100 total Vultr cap in response to the provisioning and public-demo request. Prepare a small single-server deployment within this cap; no server has been created yet. See [budgets](BUDGETS.md).
* **API verification:** The initial check was rejected because this machine's IP was not allowlisted. The user added `128.54.145.198/32`; a subsequent read-only account request returned HTTP 200. No VM has been provisioned and account payment readiness has not been established by a provisioning attempt.

---

## 2. Prerequisites and Blockers

Before provisioning any cloud resources, verify the following prerequisites:

| Requirement | Description | Status |
| --- | --- | --- |
| **Public Demo** | Deploy the completed demo as part of the requested autonomous setup. | Requested; application workflow still to build |
| **Agreed Spending Cap** | USD 100 total for this project's Vultr resources. | Confirmed |
| **Account Credits / Billing Readiness** | Active Vultr account with linked payment method or prepaid balance. | External prerequisite |
| **Vultr API Key & IP Allowlist** | Key saved in ignored local configuration. User added this workstation's IP; existing entries were preserved. | Verified: account API HTTP 200 |
| **SSH Key Access** | Public SSH key uploaded to **Account > SSH Keys** for root/admin access. | External prerequisite |
| **Domain & DNS Control** | Needed for the named-domain HTTPS recipe below. A domain purchase is optional and has not been authorized. | Optional choice before public hosting |

> [!WARNING]
> Keep `VULTR_API_KEY` restricted to local provisioning tools. Never bake this credential into the Docker image or place it in the runtime environment of the deployed application.

---

## 3. Recommended Architecture (Simplest One-Server Docker + HTTPS)

* **Compute:** 1x Vultr Cloud Compute instance (Regular or High Performance, 1 vCPU, 2 GB RAM, Ubuntu 24.04 LTS x64). No Kubernetes, no GPU.
* **Ingress / HTTPS:** Caddy handles automated TLS certificates on ports 80/443 and proxies to `app:3000` over the private Compose network.
* **Application:** Next.js 16 standalone container built from [Dockerfile](/Users/shahxsheel/.t3/projects/sandhacks/Dockerfile), running under the unprivileged `node` user on internal port 3000.
* **Firewall (Vultr Firewall Group):**
  * `22/TCP` — SSH (restrict to administrator source IP if static)
  * `80/TCP` — HTTP (for ACME challenge and HTTP-to-HTTPS redirect)
  * `443/TCP` — HTTPS (public traffic)
  * Port 3000 is **not** exposed to the public internet; Next.js binds strictly to localhost/internal network.

---

## 4. Step-by-Step Deployment Checklist

### Phase 1: Pre-provisioning Approvals & Credentials

- [x] Record the requested public-demo deployment scope.
- [x] Record USD 100 total cap. Verify the actual plan price and expected server lifetime before provisioning; the example hardware size below is not a quoted price.
- [ ] Verify Vultr account has active payment method / credit readiness.
- [ ] Upload developer public SSH key to Vultr Console (**Account > SSH Keys**).
- [ ] If using the Vultr CLI or API:
  - Generate an API key under **Account > API**.
  - Under **Access Control**, add your current public IP address (`<your-ip>/32`).
  - Preserve existing allowlist entries; do not change access for unrelated users or applications.

### Phase 2: Provision Cloud Compute & Firewall

- [ ] Create a Vultr Firewall Group (`sandhacks-fw`):
  ```sh
  # Inbound rules:
  # TCP 22   (SSH)   - Source: <admin-ip>/32 (or 0.0.0.0/0 if dynamic)
  # TCP 80   (HTTP)  - Source: 0.0.0.0/0, ::/0
  # TCP 443  (HTTPS) - Source: 0.0.0.0/0, ::/0
  ```
- [ ] Deploy a Cloud Compute instance:
  * **Location:** Nearest region to target users
  * **OS:** Ubuntu 24.04 LTS x64
  * **Plan:** Standard Cloud Compute (2 GB RAM, 1 vCPU)
  * **SSH Keys:** Select uploaded SSH key
  * **Firewall Group:** Attach `sandhacks-fw`
- [ ] Record the assigned public IPv4 address.

### Phase 3: DNS Setup

- [ ] Create a DNS `A` record mapping `yourdomain.example.com` to the instance IPv4 address.
- [ ] Verify DNS propagation:
  ```sh
  dig +short yourdomain.example.com
  ```

### Phase 4: Server Initialization & Docker Setup

- [ ] SSH into the newly provisioned instance:
  ```sh
  ssh root@<instance-ipv4>
  ```
- [ ] Update packages and install Docker Engine & Compose plugin:
  ```sh
  apt-get update && apt-get upgrade -y
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  ```

### Phase 5: Production Runtime Secrets

- [ ] Prepare deployment directory:
  ```sh
  mkdir -p /opt/sandhacks
  cd /opt/sandhacks
  ```
- [ ] Create `/opt/sandhacks/runtime.env` owned strictly by `root:root` with permissions `0600`:
  ```sh
  cat << 'EOF' > /opt/sandhacks/runtime.env
  NODE_ENV=production
  PORT=3000
  HOSTNAME=0.0.0.0
  DATABASE_URL=postgresql://...
  GEMINI_API_KEY=...
  ELEVENLABS_API_KEY=...
  EOF
  chmod 600 /opt/sandhacks/runtime.env
  ```
  *(Never put `VULTR_API_KEY` in this file).*

### Phase 6: Application & Reverse Proxy Deployment

- [ ] Transfer or clone the repository to `/opt/sandhacks/app`.
- [ ] Create `/opt/sandhacks/docker-compose.yml`:
  ```yaml
  services:
    app:
      build:
        context: ./app
        dockerfile: Dockerfile
      restart: unless-stopped
      env_file:
        - /opt/sandhacks/runtime.env
      expose:
        - "3000"

    caddy:
      image: caddy:2-alpine
      restart: unless-stopped
      ports:
        - "80:80"
        - "443:443"
      volumes:
        - ./Caddyfile:/etc/caddy/Caddyfile:ro
        - caddy_data:/data
        - caddy_config:/config
      depends_on:
        - app

  volumes:
    caddy_data:
    caddy_config:
  ```
- [ ] Create `/opt/sandhacks/Caddyfile`:
  ```caddyfile
  yourdomain.example.com {
      reverse_proxy app:3000
  }
  ```
- [ ] Build and start the stack:
  ```sh
  docker compose -f /opt/sandhacks/docker-compose.yml up -d --build
  ```

### Phase 7: Post-deployment Validation

- [ ] Inspect running containers:
  ```sh
  docker compose -f /opt/sandhacks/docker-compose.yml ps
  ```
- [ ] Check application container logs:
  ```sh
  docker compose -f /opt/sandhacks/docker-compose.yml logs app
  ```
- [ ] Verify health check endpoint over public HTTPS:
  ```sh
  curl -i https://yourdomain.example.com/api/health
  # Expected: HTTP/2 200 with JSON health payload
  ```
- [ ] Verify TLS certificate validity:
  ```sh
  curl -Iv https://yourdomain.example.com 2>&1 | grep -i "SSL certificate"
  ```
- [ ] Verify port 3000 is not accessible from external networks:
  ```sh
  curl --connect-timeout 5 http://<instance-ipv4>:3000 || echo "Port 3000 is securely unreachable"
  ```

### Phase 8: Teardown / Destroy (When Retiring Instance)

- [ ] Stop and remove Docker containers and volumes:
  ```sh
  docker compose -f /opt/sandhacks/docker-compose.yml down -v
  ```
- [ ] When retirement is authorized, destroy the VM to stop its compute charges. Check separately for any project snapshots, volumes, or other billable resources before declaring all charges stopped:
  ```sh
  # Using vultr-cli:
  vultr-cli instance delete <instance-id>
  ```

---

## 5. Primary Documentation Sources

* [Vultr API Documentation & Access Control](https://docs.vultr.com/)
* [Vultr Manage API IP Allowlist](https://docs.vultr.com/how-to-manage-the-vultr-api-ip-allowlist-for-an-organization-user)
* [Vultr CLI GitHub Repository](https://github.com/vultr/vultr-cli)
* [Vultr Cloud Compute Overview](https://www.vultr.com/docs/)
* [Caddy Reverse Proxy Documentation](https://caddyserver.com/docs/quick-starts/reverse-proxy)
* [Next.js Standalone Deployment Output](https://nextjs.org/docs/app/building-your-application/deploying#docker-image)
