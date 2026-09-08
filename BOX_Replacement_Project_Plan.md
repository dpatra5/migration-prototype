# BOX Replacement Project Plan
## Document Migration Utility — VTMF Transition

**Prepared by:** Debabrata Patra  
**Date:** 31-Aug-2026  
**Status:** Draft for Review

---

## 1. Executive Summary

Replace BOX as the document storage platform with Veeva Trial Master File (VTMF) for clinical trial document management. This involves building a migration utility that automates document upload, classification, mapping (Study → Country → Site), and transfer to VTMF, with full audit trail and retry capabilities for unclassified documents.

---

## 2. Detailed Task Breakdown

### Phase 1: Planning & Design (Week 1–2)

| # | Task | Owner | Timeline | Status |
|---|------|-------|----------|--------|
| 1.1 | Finalize scope & requirements with business | Debabrata | Week 1 | To Do |
| 1.2 | Document mapping rules (Study → Country → Site → Doc Type) | Debabrata + Business | Week 1 | To Do |
| 1.3 | Define metadata schema for classification | Debabrata | Week 1 | To Do |
| 1.4 | Architecture design — frontend, backend, connectors | Debabrata | Week 1 | In Progress |
| 1.5 | VTMF API integration design (auth, endpoints, rate limits) | Debabrata | Week 1–2 | To Do |
| 1.6 | BOX data export strategy & format analysis | Debabrata | Week 1 | To Do |
| 1.7 | Security & compliance review (21 CFR Part 11, GxP) | Debabrata + Compliance | Week 2 | To Do |
| 1.8 | Design review with stakeholders | Debabrata | Week 2 | To Do |

### Phase 2: Infrastructure & Environment Setup (Week 2–3)

| # | Task | Owner | Timeline | Status |
|---|------|-------|----------|--------|
| 2.1 | Provision dev/staging/prod environments | Infra Team | Week 2 | Pending (3rd Party) |
| 2.2 | VTMF sandbox access & API credentials | VTMF Admin / Veeva | Week 2 | Pending (3rd Party) |
| 2.3 | BOX API read access for data export | BOX Admin | Week 2 | Pending (3rd Party) |
| 2.4 | FTP/SFTP inbox setup for source documents | Infra Team | Week 2 | Pending (3rd Party) |
| 2.5 | CI/CD pipeline setup (build, test, deploy) | Debabrata | Week 3 | To Do |
| 2.6 | Database provisioning (PostgreSQL) | Infra Team | Week 2 | Pending (3rd Party) |
| 2.7 | Virus scan service integration setup | Security Team | Week 3 | Pending (3rd Party) |

### Phase 3: Backend Development (Week 3–6)

| # | Task | Owner | Timeline | Status |
|---|------|-------|----------|--------|
| 3.1 | BOX connector — read/export documents | Developer | Week 3–4 | To Do |
| 3.2 | VTMF connector — upload/create documents | Developer | Week 3–4 | To Do |
| 3.3 | Document classification engine (metadata matching) | Developer | Week 4–5 | To Do |
| 3.4 | Mapping service (Study → Country → Site hierarchy) | Developer | Week 4–5 | To Do |
| 3.5 | Migration job orchestration (queue, worker, status tracking) | Developer | Week 5 | To Do |
| 3.6 | Virus scan integration | Developer | Week 5 | To Do |
| 3.7 | Audit trail logging service | Developer | Week 5–6 | To Do |
| 3.8 | Retry/adhoc job mechanism for unclassified docs | Developer | Week 6 | To Do |
| 3.9 | REST API layer (FastAPI endpoints) | Developer | Week 5–6 | To Do |
| 3.10 | Notification service (email on job completion) | Developer | Week 6 | To Do |

### Phase 4: Frontend Development (Week 3–6)

| # | Task | Owner | Timeline | Status |
|---|------|-------|----------|--------|
| 4.1 | Dashboard — metrics overview, recent jobs | Debabrata | Week 3 | Done (Prototype) |
| 4.2 | Upload page — trigger migration form | Debabrata | Week 3–4 | Done (Prototype) |
| 4.3 | Mapping page — document mapping view with metadata match | Debabrata | Week 4 | Done (Prototype) |
| 4.4 | Review page — approve/reject migrated docs | Debabrata | Week 4–5 | Done (Prototype) |
| 4.5 | Unclassified docs — retry & adhoc job trigger | Debabrata | Week 5 | Done (Prototype) |
| 4.6 | Audit trail — expandable logs, filters, search | Debabrata | Week 5 | Done (Prototype) |
| 4.7 | Backend integration — replace mock data with real APIs | Debabrata | Week 5–6 | To Do |
| 4.8 | Notifications & Settings pages | Debabrata | Week 5 | Done (Prototype) |
| 4.9 | Accessibility & responsive fixes | Debabrata | Week 6 | Done (Prototype) |

### Phase 5: Testing (Week 6–8)

| # | Task | Owner | Timeline | Status |
|---|------|-------|----------|--------|
| 5.1 | Unit tests — backend services | Developer | Week 6–7 | To Do |
| 5.2 | Unit tests — frontend components | Debabrata | Week 6–7 | To Do |
| 5.3 | Integration testing — BOX → App → VTMF end-to-end | QA / Debabrata | Week 7 | To Do |
| 5.4 | UAT with business users | Business Team | Week 7–8 | To Do |
| 5.5 | Performance testing (large batch migrations) | QA | Week 7 | To Do |
| 5.6 | Security testing & compliance validation | Security Team | Week 8 | To Do |
| 5.7 | Bug fixes & UAT feedback incorporation | Debabrata + Team | Week 8 | To Do |

### Phase 6: Deployment & Go-Live (Week 8–9)

| # | Task | Owner | Timeline | Status |
|---|------|-------|----------|--------|
| 6.1 | Production environment setup | Infra Team | Week 8 | Pending (3rd Party) |
| 6.2 | Data migration — historical BOX documents to VTMF | Debabrata + Team | Week 8–9 | To Do |
| 6.3 | Go-live deployment | Debabrata | Week 9 | To Do |
| 6.4 | Post-go-live monitoring & support | Debabrata + Team | Week 9+ | To Do |
| 6.5 | Handover documentation & training | Debabrata | Week 9 | To Do |

---

## 3. Milestones

| Milestone | Target Date | Criteria |
|-----------|-------------|----------|
| M1: Design Approved | End of Week 2 | Architecture, mapping rules, API design signed off |
| M2: Environments Ready | End of Week 3 | Dev/staging environments, VTMF sandbox, BOX access available |
| M3: Backend MVP | End of Week 5 | Core migration flow working end-to-end (upload → classify → map → transfer) |
| M4: Frontend Integration | End of Week 6 | UI connected to real APIs, all pages functional |
| M5: UAT Complete | End of Week 8 | Business sign-off on functionality |
| M6: Go-Live | End of Week 9 | Production deployment, historical data migrated |

---

## 4. Infrastructure, Environment & Access Needs

| Requirement | Purpose | Owner | Status |
|-------------|---------|-------|--------|
| VTMF sandbox + API credentials | Dev/test integration | Veeva Admin | **Pending** |
| VTMF production tenant | Go-live | Veeva Admin | **Pending** |
| BOX API read-only credentials | Export existing documents | BOX Admin | **Pending** |
| FTP/SFTP server (inbox) | Source document ingestion | Infra Team | **Pending** |
| PostgreSQL database (dev/staging/prod) | Job tracking, audit trail, metadata | Infra Team | **Pending** |
| Application server (dev/staging/prod) | Host backend (FastAPI) + frontend (Vite/React) | Infra Team | **Pending** |
| Virus scan service endpoint | File scanning before migration | Security Team | **Pending** |
| CI/CD pipeline (Jenkins/GitHub Actions) | Automated build & deploy | Debabrata | To Do |
| SSL certificates | HTTPS for all environments | Infra Team | **Pending** |

---

## 5. Resource & Effort Requirements

| Role | Name/Count | Allocation | Duration |
|------|-----------|------------|----------|
| Tech Lead / Full-Stack Dev | Debabrata | 100% | Week 1–9 |
| Backend Developer | 1 resource | 100% | Week 3–8 |
| QA Engineer | 1 resource | 50% | Week 6–8 |
| Infra/DevOps | Shared resource | As needed | Week 2–3, 8 |
| Business Analyst / SME | Business team | 25% | Week 1–2, 7–8 |
| **Total Effort Estimate** | | | **~18 person-weeks** |

---

## 6. Dependencies

| ID | Dependency | Dependent Tasks | Owner | Status |
|----|-----------|-----------------|-------|--------|
| DEP-1 | VTMF sandbox access & API documentation | 3.2, 3.4 | Veeva Admin | **Pending** |
| DEP-2 | BOX API credentials & export permissions | 3.1, 6.2 | BOX Admin | **Pending** |
| DEP-3 | Document mapping rules & metadata schema from business | 1.2, 1.3, 3.3, 3.4 | Business Team | **Pending** |
| DEP-4 | Study/Country/Site hierarchy master data | 3.4, 4.3 | Business Team | **Pending** |
| DEP-5 | Virus scan service availability | 3.6 | Security Team | **Pending** |
| DEP-6 | Infrastructure provisioning | 2.1–2.6 | Infra Team | **Pending** |
| DEP-7 | Compliance/regulatory sign-off on design | 1.7 | Compliance Team | **Pending** |

---

## 7. Assumptions

1. VTMF API supports bulk document upload with metadata tagging
2. BOX data can be exported via API without manual intervention
3. Existing document naming conventions are consistent enough for auto-classification
4. Business team will provide mapping rules and metadata schema within Week 1
5. Infrastructure team can provision environments within 1 week of request
6. No major changes to Study/Country/Site hierarchy during migration
7. Virus scan service is an existing enterprise service (no new procurement needed)

---

## 8. Risks & Mitigation

| ID | Risk | Impact | Probability | Mitigation |
|----|------|--------|-------------|------------|
| R-1 | VTMF API access delayed | Blocks backend integration | High | Start with mock API; escalate to management for expedited access |
| R-2 | Poor document naming → low auto-classification rate | High unclassified volume | Medium | Build manual review + retry flow (already prototyped); work with business to refine rules |
| R-3 | Large historical data volume slows migration | Go-live delay | Medium | Run historical migration in batches during off-hours; parallel processing |
| R-4 | Compliance requirements add scope | Timeline extension | Medium | Engage compliance team early (Week 1); build audit trail from day 1 |
| R-5 | Resource unavailability (backend dev, QA) | Delayed testing | Medium | Cross-train; Debabrata covers backend gaps if needed |
| R-6 | BOX API rate limiting during export | Slow data extraction | Low | Implement throttling + retry logic; schedule during low-traffic windows |
| R-7 | Network/connectivity issues to VTMF | Failed uploads | Low | Retry mechanism with exponential backoff (already designed) |

---

## 9. Pending Actions from Third Parties

| # | Action Required | From Whom | Information/Decision Needed | Deadline | Status |
|---|----------------|-----------|---------------------------|----------|--------|
| PA-1 | VTMF sandbox credentials & API docs | Veeva Admin | API endpoint URLs, auth method, rate limits | Week 2 | **Not started** |
| PA-2 | BOX read-only API credentials | BOX Admin | OAuth client ID/secret, scoped to clinical docs | Week 2 | **Not started** |
| PA-3 | Document classification rules | Business Team | Mapping of file naming patterns → document types | Week 1 | **Not started** |
| PA-4 | Study/Country/Site master data | Business Team | Complete hierarchy list with IDs | Week 1 | **Not started** |
| PA-5 | Dev/staging server provisioning | Infra Team | Server specs, OS, network zone approvals | Week 2 | **Not started** |
| PA-6 | Database provisioning | Infra Team | PostgreSQL instance with connection details | Week 2 | **Not started** |
| PA-7 | Virus scan service endpoint | Security Team | API endpoint, auth, supported file types | Week 3 | **Not started** |
| PA-8 | Compliance review of architecture | Compliance Team | Sign-off on audit trail design, data flow | Week 2 | **Not started** |
| PA-9 | UAT participation commitment | Business Team | Dedicated time for testing in Week 7–8 | Week 6 | **Not started** |
| PA-10 | Production environment approval | Management | Budget & infra approval for prod deployment | Week 7 | **Not started** |

---

## 10. Current Progress

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend UI Prototype | ✅ Complete | All 8 pages built with Tailwind CSS, accessible, responsive |
| Backend Skeleton | 🟡 In Progress | FastAPI structure, models, schemas defined |
| BOX Connector | ⬜ Not Started | Blocked on BOX API credentials (PA-2) |
| VTMF Connector | ⬜ Not Started | Blocked on VTMF sandbox access (PA-1) |
| Database Schema | 🟡 In Progress | Models defined, needs provisioned DB |
| CI/CD | ⬜ Not Started | Needs infra provisioning |

---

## 11. Next Steps (This Week)

1. [ ] Send access requests for VTMF sandbox (PA-1) and BOX API (PA-2)
2. [ ] Schedule meeting with business team for mapping rules (PA-3, PA-4)
3. [ ] Submit infra provisioning request (PA-5, PA-6)
4. [ ] Engage compliance team for early review (PA-8)
5. [ ] Finalize architecture document for design review
6. [ ] Review this plan with manager

---

*Document version: 1.0 | Last updated: 31-Aug-2026*
