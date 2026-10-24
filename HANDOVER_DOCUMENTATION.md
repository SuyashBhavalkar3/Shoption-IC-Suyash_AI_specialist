# Shoption - Engineering Handover & Transition Documentation
**Role**: AI Specialist & Full-Stack Solutions Individual Contributor (IC)  
**Author**: Suyash  
**Target Audience**: Incoming Software Engineer / AI Specialist / Technical Lead  
**Last Updated**: October 2026  
**Repository Root**: `shoption_Suyash_IC`

---

## 1. Executive Summary & Welcome

Welcome to the team! This repository represents the complete portfolio of engineering systems, enterprise SaaS platforms, AI automation pipelines, IoT mobile applications, and web services developed during my tenure as an AI Specialist / Individual Contributor at **Shoption**.

Shoption's ecosystem bridges digital enterprise SaaS, conversational commerce, and real-world agricultural & hardware solutions (GBRU). The systems in this repository primarily solve five core business challenges:
1. **Field Sales Call Tracking & Governance (LeadLens Ecosystem)**: Tracking SIM-based call activity for field sales representatives ("Warriors"), synchronizing call records to multi-tenant backends, auto-recording, audio transcription, and LLM-driven sentiment analysis.
2. **AI-Powered Customer Engagement & WhatsApp Bots**: Multilingual (English, Hindi, Marathi) RAG assistants answering farmer and dealer enquiries using Qdrant vector databases and Groq LLMs.
3. **Automated Customer Communication & Funnel SaaS**: Scheduled campaign dispatching via WhatsApp Cloud API, ERP synchronization, and funnel drop-off analytics.
4. **Smart Agricultural IoT & E-Commerce (GBRU)**: Flutter mobile apps for IoT hardware telemetry (solar security cameras, agricultural pumps) and full-featured e-commerce storefronts with payment gateway (PayU) and shipping logistics (India Post).
5. **Data Cleaning & Lead Ingestion Pipelines**: Automated sanitization of raw lead CSVs and Meta (Facebook) Lead Ads ingestion pipelines to feed cleanly into CRM systems.

> [!IMPORTANT]
> **Master Secrets & Environment Variables Registry**:  
> For the complete, project-by-project catalog of all `.env` files, production/UAT connection strings, API keys, and rotation instructions, see [ENVIRONMENT_VARIABLES_HANDOVER.md](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/ENVIRONMENT_VARIABLES_HANDOVER.md).

---

## 2. Architecture & Ecosystem Overview

```mermaid
graph TD
    subgraph "Field Sales & LeadLens Ecosystem"
        LL_MOB["Flutter Call Tracker<br/>(mobile_app / mobile_app_new)"] -->|SIM Call Logs| LL_SRV["FastAPI Backend<br/>(Bridge Multi-Tenant)"]
        LL_REC["Accessibility Recorder<br/>(extension_app)"] -->|Audio Recordings| AZ_BLOB["Azure Blob Storage"]
        AZ_BLOB --> LL_SENT["Sentiment & Transcription<br/>(Sarvam AI + Groq)"]
        LL_SRV --> LL_ADMIN["Admin Dashboard<br/>(Next.js + Firebase Admin)"]
        LL_SRV --> DUMMY_WH["Webhook Consumer<br/>(dummy_server)"]
    end

    subgraph "Conversational AI & Customer Engagement"
        WA_USR["Farmer / Dealer (WhatsApp)"] --> WA_CLOUD["Meta WhatsApp Cloud API"]
        WA_CLOUD --> WA_BOT["FastAPI Bot Engine<br/>(whatsapp_bot_automation)"]
        WA_BOT --> QD_DB["Qdrant Vector DB<br/>(Agritech Knowledge Base)"]
        WA_BOT --> GROQ["Groq LLM<br/>(Marathi / Hindi / English)"]
        CC_MGR["Customer Communication Manager<br/>(FastAPI + Next.js + APScheduler)"] -->|Templates & Broadcasts| WA_CLOUD
        CC_MGR --> ERP["Shoption ERP Server"]
    end

    subgraph "Funnel Analytics & Lead Operations"
        META_ADS["Meta Lead Ads"] --> META_AUTO["Meta Leads Ingestion<br/>(meta_leads_automation)"]
        CSV_RAW["Raw Sales CSVs"] --> CSV_SAN["CSV Sanitizer App<br/>(sanitize_excel_automation)"]
        CSV_SAN --> CRM["Enterprise CRM"]
        USER_EVT["Web Traffic"] --> FUNNEL_SRV["Funnel SaaS Backend<br/>(FastAPI + PostgreSQL)"]
        FUNNEL_SRV --> FUNNEL_UI["Funnel Dashboard<br/>(Next.js + Supabase)"]
    end

    subgraph "GBRU Hardware & E-Commerce"
        IOT_DEV["Smart Cameras & Pumps"] --> IOT_APP["Flutter IoT App<br/>(Smart GBRU)"]
        CUST["Retail / B2B Buyers"] --> GBRU_WEB["GBRU Next.js Storefront<br/>(PayU + India Post)"]
        CUST --> HELP_PORTAL["Product Help & Warranty<br/>(Next-Intl: En/Hi/Mr)"]
    end
```

---

## 3. High-Level Project Inventory

| # | Project Directory | Domain | Primary Tech Stack | Status |
|---|---|---|---|---|
| **1** | [`LeadLens Phase 2`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/LeadLens%20Phase%202) | Enterprise SaaS & Call Tracker | FastAPI, PostgreSQL, Flutter, Azure Storage | Active / Production-Ready |
| **2** | [`sentimental analysis for leadlens shoption`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/sentimental%20analysis%20for%20leadlens%20shoption) | Audio AI & Sentiment Analysis | Next.js 16, Sarvam AI, Groq LLM, FFmpeg | Functional |
| **3** | [`track_calls_automation`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/track_calls_automation) | Call Tracking Ecosystem Bundle | Flutter, FastAPI, Next.js, Firebase Admin | Live / Deployed |
| **4** | [`customer_communicatio_manager`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/customer_communicatio_manager) | Omnichannel Communication | FastAPI, APScheduler, Meta Cloud API, Next.js | Active |
| **5** | [`cutomer_funnel_SaaS_platform`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/cutomer_funnel_SaaS_platform) | User Funnel Analytics | FastAPI, Alembic, Next.js, Supabase | Functional |
| **6** | [`whatsapp_bot_automation`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/whatsapp_bot_automation) | Agritech Multilingual RAG Bot | FastAPI, Qdrant Vector DB, Groq LLM, OpenAI | Functional |
| **7** | [`Smart GBRU`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/Smart%20GBRU) & [`SmartGBRU_IOT_App`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/SmartGBRU_IOT_App) | Smart Hardware / Agri-IoT | Flutter (Android/iOS/Desktop) | In Development |
| **8** | [`gbru_shoption_v2`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/gbru_shoption_v2) | Modern E-Commerce Storefront | Next.js 16, PayU, India Post, Meta CAPI | Production |
| **9** | [`Gbru websites`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/Gbru%20websites) | E-Commerce Test & Prod Prototypes | React 18, Vite | Archived / Reference |
| **10**| [`sanitize_excel_automation`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/sanitize_excel_automation) | CRM Data Pre-processing | Next.js 16, Lucide, Tailwind | Active Utility |
| **11**| [`filter_crm_data`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/filter_crm_data) | CLI CRM Sanitizer | Python 3, Pandas | Utility Script |
| **12**| [`meta_leads_automation`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/meta_leads_automation) | Lead Ads Webhook Ingestion | Next.js 16, Meta Graph API | Utility |
| **13**| [`product_help_warranty_page`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/product_help_warranty_page) | Multilingual Warranty Portal | Next.js 16, `next-intl` (en, hi, mr) | Active |
| **14**| [`shoption_website`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/shoption_website) | Corporate Website | Next.js 16, Lenis Smooth Scroll | Live |
| **15**| [`dummy_server`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/dummy_server) | Webhook Test Harness | FastAPI, HMAC-SHA256, SQLite, Next.js | Testing Utility |
| **16**| [`mqtt_dummy_website`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/mqtt_dummy_website) | IoT Simulator & DL Benchmarking | Next.js 16, Socket.io, Deep Learning Models | Testing Utility |
| **17**| [`uat_api_page`](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/uat_api_page) | UAT API Testing Dashboard | Next.js 16, Server Key Verification | QA Portal |

---

## 4. Deep-Dive Project Handover Specifications

### 4.1. LeadLens Enterprise (Phase 2 & Track Calls Ecosystem)

#### Concept & Business Purpose
LeadLens is Shoption's flagship internal & enterprise sales management platform. Field sales executives ("Warriors") make customer phone calls using physical Android phones. The LeadLens mobile application records call metadata (call state, duration, timestamp, recipient number) in the background and pushes it securely to the backend. LeadLens Phase 2 introduces enterprise multi-tenancy, call recording management, autodialers, and audio transcription.

#### Sub-Components:
1. **`LeadLens Phase 2/server` (Enterprise Backend)**:
   - **Architecture**: **Bridge-Model Multi-Tenant Architecture**.
     - **Master Database**: Stores platform owners, organizations metadata, registrations queue, global user routing directory (`email -> org_id -> tenant_user_id`), and 48-hour cryptographic invite setup links (`/setup/{token}`).
     - **Tenant Databases**: Dynamically resolved and pooled SQLAlchemy async engines per client organization containing user rosters, teams, call logs, and recording metadata.
   - **Key Technologies**: Python 3.11+, FastAPI, SQLAlchemy 2.0 (asyncio with `asyncpg` / `aiosqlite`), Alembic (dual migration heads: `alembic/master` and `alembic/tenant`), Pydantic v2, PyJWT, Azure Storage Blob SDK (`azure-storage-blob`).
   - **Setup & Run**:
     ```bash
     cd "LeadLens Phase 2/server"
     python3 -m venv .venv
     source .venv/bin/activate
     pip install -r requirements.txt
     cp .env.example .env
     uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
     ```
   - **Key Config Keys (`.env`)**:
     - `MASTER_DATABASE_URL`: Connection string for central control plane (e.g. PostgreSQL).
     - `TENANT_DATABASE_URL_TEMPLATE`: Template for tenant DBs (e.g. `postgresql+asyncpg://user:pass@host:5432/tenant_{org_id}`).
     - `JWT_SECRET`, `JWT_ALGORITHM`: Cryptographic signature configuration.
     - `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER_NAME`, `AZURE_STORAGE_SAS_TOKEN`: Cloud container where warrior audio recordings are streamed and accessed via short-lived SAS tokens.
     - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`: Used to email 48-hour password activation links upon client registration approval.

2. **`LeadLens Phase 2/mobile_app` & `LeadLens Phase 2/mobile_app_new` (Warrior Mobile App)**:
   - **Framework**: Flutter 3.x (Dart 3.x).
   - **Package Name**: `shoption_call_tracker`
   - **Capabilities**:
     - Runs an Android Foreground Service with a sticky notification ("Call Tracking Active").
     - Android `PhoneStateListener` / `CallLog` broadcast receivers detect incoming, outgoing, and missed SIM calls.
     - Local SQLite database persists call records when the phone is offline and flushes to the server when network connectivity is re-established.
   - **How to Build/Test**:
     ```bash
     cd "LeadLens Phase 2/mobile_app_new"
     flutter pub get
     flutter build apk --release
     ```
   - **Env Keys**: `.env` requires `API_BASE_URL` pointing to the FastAPI host.

3. **`LeadLens Phase 2/extension_app` (Call Recording Automation)**:
   - Native Android AccessibilityService automation tool (`CallRecordTester`) that interacts with OEM native dialers to trigger call recording UI programmatically.

4. **`track_calls_automation` (Production Suite)**:
   - Includes production deployment assets:
     - `server/`: Production FastAPI instance with role-based authorization (Warriors, Group Leaders, Admins, Super Admins) and Owner Passcode + 2FA OTP flow over SMTP.
     - `admin_dashboard_page/`: Next.js 16 portal for operations managers to view live logs, filter by warriors, inspect call durations, export to Excel (`export/route.ts`), and toggle maintenance mode via Firebase Admin.
     - `product_web_page/`: Public landing page with GSAP animations, documentation, demo booking, and maintenance banners.
     - `SECURITY_PRACTICES.md`: Complete zero-trust security and RBAC specifications.

---

### 4.2. LeadLens Call Transcription & Sentiment Analysis

#### Directory: `sentimental analysis for leadlens shoption/sentiment-analysis`
- **Purpose**: Automates the analysis of recorded sales warrior calls to measure lead sentiment, pitch adherence, customer objections, and agent score.
- **Tech Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Sarvam AI API, Groq Cloud API, `@ffmpeg-installer/ffmpeg`.
- **How It Works**:
  1. User/pipeline uploads call audio (`.mp3`, `.m4a`, `.wav`).
  2. Server routes (`/api/transcribe`) use **Sarvam AI** (`NEXT_PUBLIC_SARVAM_API_KEY`) for Indian English, Hindi, and regional language speech-to-text with high accuracy on regional accents.
  3. Server routes (`/api/analyze`) send the transcription to **Groq LLM** (`NEXT_PUBLIC_GROQ_API_KEY`, Llama-3-70b/8b) with structured prompts to extract:
     - Sentiment polarity (Positive, Neutral, Negative, Frustrated, Interested).
     - Customer intent & objections.
     - Key discussion points and action items.
- **Run Locally**:
  ```bash
  cd "sentimental analysis for leadlens shoption/sentiment-analysis"
  npm install
  npm run dev # http://localhost:3000
  ```

---

### 4.3. Agritech Multilingual WhatsApp Assistant (RAG)

#### Directory: `whatsapp_bot_automation`
- **Purpose**: 24/7 automated customer service agent serving farmers, dealers, and distributors across Maharashtra and India in **Marathi**, **Hindi**, and **English**.
- **Tech Stack**: FastAPI, WhatsApp Cloud API, Qdrant Vector Database, Groq LLM, OpenAI Embeddings, Docker.
- **Core Knowledge Base (`knowledge_base/`)**:
  - Detailed product data files: Smart Guard GBRU 4G Solar Security Camera, GBRU Aquaforce 80cc Pro 1.5 Pump, 740 (8mm) Aluminum Cable (500m), solar accessories, warranty terms, and dealer onboarding rules.
- **How RAG Works**:
  1. `ingest.py`: Reads all product markdown and text files, splits them into semantic chunks, generates vector embeddings, and creates a Qdrant collection (`QDRANT_URL`, `QDRANT_API_KEY`).
  2. Incoming WhatsApp message hits webhook (`POST /webhook` verified by `VERIFY_TOKEN`).
  3. Detects language (Marathi/Hindi/English).
  4. Vector similarity search against Qdrant retrieves relevant technical specs, warranty rules, or pricing.
  5. Groq LLM synthesizes an empathetic, clear response in the customer's native language.
- **ERP Integration**: Contains SSH keys (`ERP_private_key/azureprivate.pem`) used to connect to the Shoption Azure ERP VM for backend product stock lookups.
- **Run Locally**:
  ```bash
  cd whatsapp_bot_automation
  python3 -m venv bot_env
  source bot_env/bin/activate
  pip install -r requirements.txt
  # Run ingestion if knowledge base changed:
  python3 ingest.py
  # Start webhook server:
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  ```

---

### 4.4. Customer Communication Manager

#### Directory: `customer_communicatio_manager`
- **Purpose**: Campaign execution and message scheduling system allowing marketing/ops teams to dispatch WhatsApp templates and track delivery statuses.
- **Architecture**:
  - `server/`: FastAPI application utilizing **APScheduler** for cron-like triggers, Meta Cloud API (`META_ACCESS_TOKEN`, `Bre_WABA_ID`, `PHONE_NUMBER_ID`), and Shoption ERP API (`ERP_BASE_URL`, `ERP_API_KEY`, `ERP_API_SECRET`).
  - `client/`: Next.js frontend with Firebase authentication, template builder UI, scheduler dashboard, and message dispatch analytics.
- **Run Locally**:
  ```bash
  # Backend
  cd customer_communicatio_manager/server
  pip install -r requirements.txt
  uvicorn main:app --port 8001 --reload

  # Frontend
  cd customer_communicatio_manager/client
  npm install
  npm run dev # Runs on http://localhost:3000
  ```

---

### 4.5. Customer Funnel SaaS Platform

#### Directory: `cutomer_funnel_SaaS_platform`
- **Purpose**: Self-hosted event collection and conversion funnel analytics engine.
- **Architecture**:
  - `funnel_server/`: FastAPI backend with Alembic migrations, PostgreSQL (`DATABASE_URL`), JWT tokens, event ingestion (`POST /events`), and conversion calculation endpoints (`/api/analytics`).
  - `customer_funnel/`: Next.js web application utilizing `@supabase/ssr` for SaaS client authentication and charts visualizing stage-by-stage drop-off rates.
- **Run Locally**:
  ```bash
  # Backend
  cd cutomer_funnel_SaaS_platform/funnel_server
  pip install -r requirements.txt
  alembic upgrade head
  uvicorn app.main:app --port 8000 --reload

  # Frontend
  cd cutomer_funnel_SaaS_platform/customer_funnel
  npm install
  npm run dev
  ```

---

### 4.6. GBRU Hardware & E-Commerce Storefronts

1. **`gbru_shoption_v2` (Flagship Storefront)**:
   - **Framework**: Next.js 16 (App Router), Tailwind CSS, Lucide icons, pnpm.
   - **Features**: Product catalog (`/products`, `/products/view_product`), direct order checkout (`/place-order`), WhatsApp quick order linking, **PayU Payment Gateway** integration (`PAYU_MERCHANT_ID`, `PAYU_SECRET`), **India Post Shipping API** tracking (`INDIA_POST_BASE_URL`), and Meta Pixel / CAPI event logging (`META_CAPI_ACCESS_TOKEN`).
   - **Run**:
     ```bash
     cd gbru_shoption_v2
     pnpm install
     pnpm dev
     ```

2. **`Smart GBRU` & `SmartGBRU_IOT_App` (IoT Mobile Apps)**:
   - **Framework**: Flutter (Dart).
   - **Purpose**: Mobile companion app for farmers/dealers to monitor IoT solar camera video feeds, solar pump battery voltages, water flow metrics, and remote power toggling.
   - **Run**:
     ```bash
     cd "SmartGBRU_IOT_App/smart_gbru_iot_app"
     flutter pub get
     flutter run
     ```

3. **`product_help_warranty_page` (Warranty Portal)**:
   - **Framework**: Next.js 16 with `next-intl` localization.
   - **Languages**: Marathi (`messages/mr.json`), Hindi (`messages/hi.json`), English (`messages/en.json`).
   - **Purpose**: Allows rural customers to register serial numbers for warranty claims, view video manuals, and contact nearby authorized service centers.

---

### 4.7. Data Sanitization & Ingestion Automations

1. **`sanitize_excel_automation`**:
   - Modern Next.js UI allowing ops staff to drag and drop messy CSVs with hundreds of sales leads.
   - Automatically inspects the first 10 rows to detect headers, aliases dirty field names (e.g. `Client Phone`, `Mob`, `Contact` -> `phone_number`), cleans phone numbers to strict 10-digit Indian format (strips `+91`, leading zeros, dashes, and whitespace), removes duplicates, and exports a CRM-ready CSV.
2. **`meta_leads_automation`**:
   - Ingests leads collected by Meta/Facebook Lead Ads campaigns via Graph API (`META_USER_ACCESS_TOKEN`, `META_PAGE_ID`, `META_AD_ACCOUNT_ID`), applies cleaning rules, and exports sanitized files.
3. **`filter_crm_data`**:
   - Standalone Python utility script (`sanitize_crm.py`) for quick CLI processing of `raw.csv` into `sanitized.csv`.

---

### 4.8. Testing Hいきarnesses, Emulators & Company Portals

1. **`dummy_server`**:
   - Lightweight FastAPI webhook consumer designed to simulate third-party CRMs receiving LeadLens webhooks. Validates HMAC signatures and logs requests to an internal SQLite DB with a companion Next.js viewer.
2. **`mqtt_dummy_website`**:
   - Includes `dealer_dashboard` (Next.js IoT monitoring) and `dl_web_app` (deep learning model accuracy evaluation for agricultural image classification - ANN, CNN, MobileNet).
3. **`shoption_website`**:
   - Shoption's primary corporate landing page built with Next.js 16, Lenis smooth scrolling, policy documentation, and career/contact links.
4. **`uat_api_page`**:
   - QA staging test suite for testing API endpoints with custom authentication headers.

---

## 5. Master Environment Variables & Credentials Reference

> [!WARNING]
> Never commit real secrets or `.env` files into public version control. The keys below outline the configurations required across each system. Real staging and production credentials should be retrieved from the team's password manager or technical lead.

### Core Key Matrix:
| Project | Env File | Key Variables | Description |
|---|---|---|---|
| **LeadLens Server** | `LeadLens Phase 2/server/.env` | `MASTER_DATABASE_URL`<br/>`TENANT_DATABASE_URL_TEMPLATE`<br/>`JWT_SECRET`<br/>`AZURE_STORAGE_CONNECTION_STRING`<br/>`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` | PostgreSQL databases, auth secrets, Azure audio storage container, invite email credentials. |
| **Call Tracker Admin** | `track_calls_automation/admin_dashboard_page/.env` | `DATABASE_URL`<br/>`FIREBASE_PROJECT_ID`<br/>`FIREBASE_CLIENT_EMAIL`<br/>`FIREBASE_PRIVATE_KEY` | Direct Postgres access for fast reporting and Firebase Admin for auth. |
| **Call Tracker Mobile** | `track_calls_automation/mobile_app/.env` | `API_BASE_URL` | Backend URL for warrior call sync. |
| **Sentiment Analysis** | `sentimental analysis.../sentiment-analysis/.env.local` | `NEXT_PUBLIC_SARVAM_API_KEY`<br/>`NEXT_PUBLIC_GROQ_API_KEY` | Sarvam Speech-to-Text API and Groq LLM API. |
| **WhatsApp AI Bot** | `whatsapp_bot_automation/.env` | `VERIFY_TOKEN`<br/>`ACCESS_TOKEN`<br/>`PHONE_NUMBER_ID`<br/>`QDRANT_URL`, `QDRANT_API_KEY`<br/>`GROQ_API_KEY`, `OPENAI_API_KEY` | Meta WhatsApp Cloud API credentials, Qdrant vector database URL/key, LLM keys. |
| **Customer Comm Server**| `customer_communicatio_manager/server/.env` | `META_ACCESS_TOKEN`<br/>`Bre_WABA_ID`<br/>`PHONE_NUMBER_ID`<br/>`ERP_BASE_URL`, `ERP_API_KEY` | WhatsApp Cloud API keys and Shoption ERP credentials. |
| **Funnel Platform** | `cutomer_funnel_SaaS_platform/funnel_server/.env` | `DATABASE_URL`<br/>`JWT_SECRET` | PostgreSQL connection and auth tokens. |
| **Funnel Client** | `cutomer_funnel_SaaS_platform/customer_funnel/.env.local`| `NEXT_PUBLIC_SUPABASE_URL`<br/>`NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase auth and client database. |
| **GBRU Storefront** | `gbru_shoption_v2/.env.local` | `PAYU_MERCHANT_ID`, `PAYU_SECRET`<br/>`INDIA_POST_BASE_URL`<br/>`META_CAPI_ACCESS_TOKEN`<br/>`NEXT_PUBLIC_FIREBASE_*` | PayU payment gateway, shipping tracking, Meta Pixel tracking, Firebase. |
| **Meta Leads App** | `meta_leads_automation/meta_web_app/.env.local` | `META_USER_ACCESS_TOKEN`<br/>`META_PAGE_ID`<br/>`META_AD_ACCOUNT_ID` | Meta Graph API credentials for pulling lead ads. |

---

## 6. Development Workflow & Prerequisites

### Required Local Tools
- **Python**: 3.11 or higher (`python3 --version`)
- **Node.js**: v18.x or v20.x LTS (`node --version`)
- **Package Managers**: `npm`, `pnpm` (install with `npm i -g pnpm`)
- **Flutter SDK**: 3.16+ with Android SDK tools (`flutter doctor`)
- **Docker & Docker Compose**: For running local PostgreSQL and Qdrant containers
- **FFmpeg**: Required for audio slicing and sentiment processing (`brew install ffmpeg` on macOS)

### Python Virtual Environment Recommendation
Each Python service has its own dedicated dependencies. Always activate or create a dedicated virtual environment in that specific directory:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## 7. Immediate Priorities & Pending Recommendations for the Joinee

Here are the highest-impact items recommended for your first 30 days:

1. **LeadLens Phase 2 Multi-Tenant Rollout**:
   - The master and tenant database separation logic is fully coded in `LeadLens Phase 2/server/app/core/database.py`. Verify tenant creation migrations (`alembic/tenant`) when onboarding new tenant organizations.
   - Coordinate with Android team to verify Google Play Store background service compliance for the Android foreground call tracker.
2. **WhatsApp Bot Production Hardening**:
   - Update `whatsapp_bot_automation/knowledge_base/` files whenever GBRU releases new pump or solar camera models.
   - Run `python3 ingest.py` after modifying markdown files to refresh Qdrant embeddings.
3. **Sentiment Analysis Pipeline Connection**:
   - Currently, `sentimental analysis for leadlens shoption` works via manual audio upload or API routes. The next architectural milestone is automatically queuing recordings stored in Azure Blob Storage directly into the Sarvam AI transcription endpoint via background Celery/APScheduler worker.
4. **Clean up Deprecated / Duplicate Folders**:
   - Notice that `customer_communicatio_manager` has both a typo version (`customer_communicatio_manager`) and a clean version (`customer_communication_manager`). The typo folder contains the active `server/` and `client/` codebases. You may safely consolidate these into a single clean directory after verifying existing symlinks or deployment configs.
5. **Team Communication & Warrior Onboarding**:
   - Keep `track_calls_automation/task.txt` in mind: operational warrior emails need to be assigned matching employee IDs in the database for proper reporting.

---

## 8. Key Reference Contacts & Files

- **Architecture Deep-Dive**: [LeadLens Phase 2 README](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/LeadLens%20Phase%202/server/README.md)
- **Security & RBAC Specifications**: [SECURITY_PRACTICES.md](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/track_calls_automation/SECURITY_PRACTICES.md)
- **WhatsApp Bot Knowledge Transfer**: [v1.0_KT](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/whatsapp_bot_automation/v1.0_KT)
- **Lead Sanitization Specs**: [CSV Sanitizer README](file:///Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/sanitize_excel_automation/README.md)

Good luck with the transition and taking Shoption's AI and engineering infrastructure to new heights!
