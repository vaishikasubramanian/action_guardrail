# Action Guardrail
### AI Governance Platform | Pre-execution Agent Action Enforcement
---

## What This Is

Action Guardrail is a **pre-execution governance layer** that intercepts every AI agent tool call before it executes and enforces policy in real time.

Every commercial guardrails platform filters LLM text. None of them govern what an agent **does** after the LLM produces output. An agent can generate a perfectly clean, non-toxic response that then instructs a tool to delete ten thousand database records. This system closes that gap.

```
User Prompt → LLM Agent (Groq) → Tool Call → ⛔ GUARDRAIL ⛔ → Decision
                                                     ↓
                                          BLOCK / REQUIRE_HITL / LOG_AND_ALLOW / ALLOW
```

---

## Live Demo

| Environment | URL |
|---|---|
| Backend API | `http://100.26.9.228:8000` |
| Frontend | `http://action-guardrail-frontend-202607042152.s3-website-us-east-1.amazonaws.com` |
| API Docs | `http://100.26.9.228:8000/docs` |
| Health Check | `http://100.26.9.228:8000/health` |
| Public Demo | `http://action-guardrail-frontend-202607042152.s3-website-us-east-1.amazonaws.com/demo` |

> Update these URLs after AWS deployment.

---

## The Three Policy Outcomes

| Outcome | What happens | Example |
|---|---|---|
| **BLOCK** | Tool call rejected immediately | Delete 500 records → stopped |
| **REQUIRE_HITL** | Paused, human must approve | Email to gmail.com → reviewer decides |
| **LOG_AND_ALLOW** | Executes + audit record created | Read confidential file → allowed but logged |
| **ALLOW** | Executes normally | Delete 5 records → no rule matched |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI (Python 3.11) |
| LLM | Groq API — Llama 3.3 70B |
| Database | SQLite (local) / PostgreSQL (production) |
| Auth | JWT + RBAC (admin / reviewer / auditor) |
| Frontend | React 19 + Vite + Tailwind CSS |
| Container | Docker + Docker Compose |
| Cloud | AWS ECS Fargate + ECR + ALB + S3 + CloudFront |

---

## Project Structure

```
action_guardrail/
├── main.py                          # FastAPI app entry point
├── requirements.txt                 # Python dependencies
├── Dockerfile                       # Production Docker image
├── docker-compose.yml               # Local development setup
├── .env.example                     # Environment variable template
├── policy_rules.yaml                # Declarative policy rules format
│
├── app/
│   ├── agent/
│   │   └── groq_agent.py            # Groq LLM — converts prompt to tool call
│   ├── agents/
│   │   ├── agent_manager.py         # Agent authorization check
│   │   └── agent_seed.py            # Default agents seeded on startup
│   ├── api/
│   │   └── routes.py                # Core guardrail API routes
│   ├── database/
│   │   └── database.py              # SQLAlchemy setup
│   ├── guardrail/
│   │   ├── action_guardrail.py      # Main enforcement orchestrator
│   │   └── policy_engine.py         # Rule evaluation engine
│   ├── hitl/
│   │   └── hitl_manager.py          # Human-in-the-loop queue
│   ├── logs/
│   │   └── audit_logger.py          # Audit trail
│   ├── models/                      # SQLAlchemy database models
│   ├── policies/
│   │   ├── policy_loader.py         # YAML policy loader
│   │   └── policy_seed.py           # Default rules seeded on startup
│   ├── schemas/                     # Pydantic request/response schemas
│   ├── security/                    # JWT, bcrypt, auth middleware
│   └── tools/
│       ├── database_tool.py         # Database operations
│       ├── email_tool.py            # Email operations
│       └── file_tool.py             # File operations
│
├── frontend/
│   ├── src/
│   │   ├── pages/                   # Dashboard, HITL, Audit, Policies, etc.
│   │   ├── components/              # Sidebar, MetricsCards, DecisionCard
│   │   └── api.js                   # Centralized API base URL
│   └── package.json
│
└── deploy/
    ├── ecr_push.sh                  # Build and push Docker image to AWS ECR
    ├── ecs_deploy.sh                # Deploy to AWS ECS Fargate
    └── frontend_deploy.sh           # Deploy React frontend to S3 + CloudFront
```

---

## Quick Start — Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

### 1. Clone and configure

```bash
# Copy environment variables
cp .env.example .env

# Edit .env and add your Groq API key
# GROQ_API_KEY=your_key_here
```

### 2. Start with Docker Compose (recommended)

```bash
docker-compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

### 3. Start manually (alternative)

```bash
# Backend
pip install -r requirements.txt
python -m uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### 4. Log in

Open http://localhost:5173 and use these credentials:

| Role | Username | Password | Can do |
|---|---|---|---|
| Admin | `admin` | `admin123` | Everything |
| Reviewer | `reviewer` | `reviewer123` | Approve/reject HITL |
| Auditor | `auditor` | `auditor123` | Read-only |

---

## Testing the Three Outcomes

### Option A — Natural Language (Dashboard)
Go to Dashboard → type in the Agent Console → click Execute

| What to type | Expected outcome |
|---|---|
| `Delete 500 customer records` | **BLOCK** |
| `Delete 5 records` | **ALLOW** |
| `Send report to user@gmail.com` | **REQUIRE HITL** |
| `Send report to hr@company.com` | **ALLOW** |
| `Read confidential_report.pdf` | **LOG & ALLOW** |

### Option B — One-Click Scenarios
Go to Scenarios page → click any button → see result instantly.

### Option C — API directly

```bash
# BLOCK — delete 500 records
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"demo_agent","tool_name":"database_tool","action":"delete_records","parameters":{"record_count":500}}'

# REQUIRE HITL — external email
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"demo_agent","tool_name":"email_tool","action":"send_email","parameters":{"recipient":"user@gmail.com"}}'

# LOG AND ALLOW — confidential file
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"demo_agent","tool_name":"file_tool","action":"read_file","parameters":{"path":"confidential_report.pdf"}}'

# DRY RUN — simulate without executing
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"demo_agent","tool_name":"database_tool","action":"delete_records","parameters":{"record_count":500},"dry_run":true}'
```

---

## API Reference

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/health` | Health check | None |
| GET | `/` | Root info | None |
| POST | `/login` | Get JWT token | None |
| POST | `/agent` | Natural language → guardrail | None |
| POST | `/execute` | Direct action execution | None |
| GET | `/logs` | All audit logs | None |
| GET | `/metrics` | Decision counts | None |
| GET | `/policies` | List all policies | None |
| PUT | `/policies/{rule_id}` | Update a policy | Admin |
| PATCH | `/policies/{rule_id}/toggle` | Enable/disable policy | Admin |
| GET | `/policy-history` | Policy change history | None |
| POST | `/policy-history/rollback/{id}` | Rollback a policy | Admin |
| GET | `/hitl/pending` | Pending approvals | None |
| POST | `/hitl/approve/{id}` | Approve + execute | Admin/Reviewer |
| POST | `/hitl/reject/{id}` | Reject action | Admin/Reviewer |
| POST | `/simulate` | Simulate without executing | None |
| GET | `/agents` | List agents | Any role |
| PATCH | `/agents/{id}/toggle` | Enable/disable agent | Admin |
| PUT | `/agents/{id}/tools` | Update agent tools | Admin |
| GET | `/users` | List users | Admin |
| PATCH | `/users/{id}/toggle` | Enable/disable user | Admin |
| PUT | `/users/{id}/role` | Change user role | Admin |

Full interactive docs: `http://localhost:8000/docs`

---

## Default Policy Rules

| Rule | Action | Condition | Decision |
|---|---|---|---|
| RULE001 | delete_records | record_count > 100 | **BLOCK** |
| RULE002 | send_email | recipient not @company.com | **REQUIRE HITL** |
| RULE003 | read_file | path contains "confidential" | **LOG & ALLOW** |

Policies can be updated live via the UI or API without restarting.

---

## AWS Deployment

See `deploy/` folder for automated deployment scripts.

**Quick deploy:**
```bash
# 1. Configure AWS CLI
aws configure

# 2. Deploy backend to ECS
chmod +x deploy/ecr_push.sh deploy/ecs_deploy.sh
./deploy/ecr_push.sh
./deploy/ecs_deploy.sh

# 3. Deploy frontend to S3
chmod +x deploy/frontend_deploy.sh
./deploy/frontend_deploy.sh
```

Full instructions: [deploy/README_DEPLOY.md](deploy/README_DEPLOY.md)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key from console.groq.com |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `DATABASE_URL` | No | Defaults to SQLite. Use PostgreSQL for production |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

---

## Production Checklist

- [x] Real LLM provider connected (Groq Llama 3.3 70B)
- [x] JWT authentication with role-based access control
- [x] Structured logging with timestamps
- [x] Global error handler (no stack traces exposed)
- [x] Health check endpoint at `/health`
- [x] Handles concurrent requests (FastAPI async)
- [x] Persistent state (database)
- [x] Docker containerized
- [x] Environment-driven configuration (no hardcoded secrets)
- [x] Deployed to AWS ECS Fargate
- [x] Frontend on AWS S3
- [x] Public demo page (no login required)
