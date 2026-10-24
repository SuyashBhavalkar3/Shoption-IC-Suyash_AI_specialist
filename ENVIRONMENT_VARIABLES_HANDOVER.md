# All Environment Variables by Project Folder

> [!NOTE]
> All sensitive production credentials, tokens, passwords, and API keys have been redacted and replaced with descriptive `<PLACEHOLDER>` tags for security and secret protection compliance.
> Actual active keys are preserved in your local `.env.handover.local` file (ignored by Git).

## Project Folder: `LeadLens Phase 2/server`
**File**: `LeadLens Phase 2/server/.env`

```env
MASTER_DATABASE_URL="sqlite+aiosqlite:///./master.db"
TENANT_DATABASE_URL_TEMPLATE="sqlite+aiosqlite:///./tenant_{db_name}.db"
PROVISIONING_STRATEGY="dynamic"
JWT_SECRET="<JWT_SECRET_KEY>"
JWT_ALGORITHM="HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
APP_NAME="LeadLens Backend"
APP_ENV="development"
DEBUG=True
JWT_SECRET="<JWT_SECRET_KEY>"
JWT_ALGORITHM="HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

EMAIL_PROVIDER="smtp"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="<SMTP_USER_EMAIL>"
SMTP_PASSWORD="<SMTP_APP_PASSWORD>"
SMTP_FROM_EMAIL="<SMTP_FROM_EMAIL>"
SMTP_TLS=True

# ==============================================================================
# AZURE BLOB STORAGE (Call Recordings & Attachments)
# ==============================================================================
AZURE_STORAGE_CONNECTION_STRING=""
AZURE_STORAGE_CONTAINER_NAME="call-recordings"
AZURE_STORAGE_ACCOUNT_NAME="shoptioncdnsa"
AZURE_STORAGE_SAS_TOKEN="<AZURE_STORAGE_SAS_TOKEN>"
AZURE_STORAGE_CONTAINER_URL="https://shoptioncdnsa.blob.core.windows.net/call-recordings?<AZURE_STORAGE_SAS_TOKEN>"

META_ACCESS_TOKEN=<META_ACCESS_TOKEN>
Bre_WABA_ID=745367028452487
META_APP_ID=1278416177206133
PHONE_NUMBER_ID=733726233157245
META_API_VERSION=v25.0
ERP_API_KEY=<ERP_API_KEY>
ERP_API_SECRET=<ERP_API_SECRET>
ERP_BASE_URL=https://proderp.gbru.in
```

## Project Folder: `LeadLens Phase 2/admin_portal`
**File**: `LeadLens Phase 2/admin_portal/.env`

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_USE_MOCKS=false
ANALYSIS_BASE_URL=https://103.189.172.76.sslip.io
NEXT_PUBLIC_ANALYSIS_BASE_URL=http://localhost:8001

META_ACCESS_TOKEN=<META_ACCESS_TOKEN>
Bre_WABA_ID=745367028452487
META_APP_ID=1278416177206133
PHONE_NUMBER_ID=733726233157245
META_API_VERSION=v25.0
ERP_API_KEY=<ERP_API_KEY>
ERP_API_SECRET=<ERP_API_SECRET>
ERP_BASE_URL=https://proderp.gbru.in
NEXT_PUBLIC_ERP_BASE_URL=https://proderp.gbru.in
```

## Project Folder: `LeadLens Phase 2/mobile_app_new`
**File**: `LeadLens Phase 2/mobile_app_new/.env`

```env
# FastAPI Server URLs

# ── LOCAL MOBILE TESTING (Device on Wi-Fi connecting to Mac IP:Port) ──
API_BASE_URL=http://192.168.1.96:8000
CRM_BASE_URL=http://192.168.1.96:8000

# ── EMULATOR / ADB REVERSE TESTING ──
# API_BASE_URL=http://127.0.0.1:8000
# CRM_BASE_URL=http://127.0.0.1:8000

# ── PRODUCTION / AZURE STAGING ──
# API_BASE_URL=https://shoption-calltracker-api-cjdjatchb5bzb9dp.centralindia-01.azurewebsites.net
```

## Project Folder: `LeadLens Phase 2/leadlens_enterprise_app`
**File**: `LeadLens Phase 2/leadlens_enterprise_app/.env`

```env
# LeadLens Enterprise Environment Configuration

# Android Emulator (points directly to host Mac localhost)
API_BASE_URL=http://10.0.2.2:8000

# Physical Device on same Wi-Fi (Current Mac IP: 192.168.1.36):
# API_BASE_URL=http://192.168.1.36:8000

# Production / Azure Staging alternative:
# API_BASE_URL=https://shoption-calltracker-api-cjdjatchb5bzb9dp.centralindia-01.azurewebsites.net
```

## Project Folder: `LeadLens Phase 2/extension_app`
**File**: `LeadLens Phase 2/extension_app/.env`

```env
URL=http://192.168.1.96:8000
AUTH_LOGIN_URL=http://192.168.1.96:8000/auth/login
```

## Project Folder: `track_calls_automation/server`
**File**: `track_calls_automation/server/.env`

```env
# JWT
JWT_SECRET_KEY=<JWT_SECRET_KEY>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Local/Dev Environment: Supabase PostgreSQL Database URL (consistent name)
# DATABASE_URL=postgresql://postgres.rtxyhcsxakkmrklxvpqd:<PASSWORD>@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require

# Production Environment: Azure PostgreSQL Database URL (uncomment on production if not using Azure Configuration Settings)
# DATABASE_URL=postgresql+psycopg2://shoptionadmin:<PASSWORD>@shoption-call-trackdb.postgres.database.azure.com:5432/calltracking_testing?sslmode=require

DATABASE_URL=postgresql+psycopg2://shoptionadmin:<PASSWORD>@shoption-call-trackdb.postgres.database.azure.com:5432/calltracking_prod?sslmode=require

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=<SMTP_USERNAME>
SMTP_PASSWORD=<SMTP_APP_PASSWORD>
SMTP_FROM_EMAIL=<SMTP_FROM_EMAIL>

# Firebase Configuration
# FIREBASE_COLLECTION_NAME=uat_leadlens_shoption
FIREBASE_COLLECTION_NAME=leadlens_shoption
```

## Project Folder: `track_calls_automation/admin_dashboard_page`
**File**: `track_calls_automation/admin_dashboard_page/.env`

```env
NEXT_PUBLIC_API_BASE_URL=https://shoption-calltracker-api-cjdjatchb5bzb9dp.centralindia-01.azurewebsites.net
DATABASE_URL=postgresql+psycopg2://shoptionadmin:<PASSWORD>@shoption-call-trackdb.postgres.database.azure.com:5432/calltracking_prod?sslmode=require
# NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
# NEXT_PUBLIC_API_BASE_URL=https://shoption-calltracker-ap-testing-hgcpd2f2dshygtef.centralindia-01.azurewebsites.net

FIREBASE_PROJECT_ID=shoption-af244
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-jeprh@shoption-af244.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<FIREBASE_RSA_PRIVATE_KEY_HERE>\n-----END PRIVATE KEY-----\n"
```

## Project Folder: `track_calls_automation/product_web_page`
**File**: `track_calls_automation/product_web_page/.env.local`

```env
# Staging / Production Backend API URL
# NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
# NEXT_PUBLIC_API_BASE_URL=https://shoption-calltracker-api-cjdjatchb5bzb9dp.centralindia-01.azurewebsites.net
NEXT_PUBLIC_API_BASE_URL=https://shoption-calltracker-ap-testing-hgcpd2f2dshygtef.centralindia-01.azurewebsites.net

# Firebase Admin SDK credentials (server-side only)
FIREBASE_PROJECT_ID=shoption-af244
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-jeprh@shoption-af244.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<FIREBASE_RSA_PRIVATE_KEY_HERE>\n-----END PRIVATE KEY-----\n"
```

## Project Folder: `track_calls_automation/mobile_app`
**File**: `track_calls_automation/mobile_app/.env`

```env
# FastAPI Server URLs (Uncomment the one you want to use)

# ── LOCAL DEVELOPMENT ──
# Option A: Android Emulator testing (10.0.2.2 maps to localhost of your mac)
# API_BASE_URL=http://10.0.2.2:8000
# API_BASE_URL=http://10.238.101.13:8000
# API_BASE_URL=http://192.168.1.48:8000

# Option B: Physical Device testing on same Wi-Fi (Replace with your Mac's LAN IP)
# API_BASE_URL=http://192.168.1.10:8000

# API_BASE_URL=http://192.168.1.44:8000
# API_BASE_URL=http://192.168.1.23:8000

# ── PRODUCTION / AZURE STAGING ──
# Active when building APK for deployment to testers/Play Store
API_BASE_URL=https://shoption-calltracker-api-cjdjatchb5bzb9dp.centralindia-01.azurewebsites.net
# API_BASE_URL=https://shoption-calltracker-ap-testing-hgcpd2f2dshygtef.centralindia-01.azurewebsites.net
```

## Project Folder: `whatsapp_bot_automation`
**File**: `whatsapp_bot_automation/.env`

```env
# Webhook verify token (you can change this to any secure string)
VERIFY_TOKEN=my_secure_whatsapp_token_123

# Meta WhatsApp Cloud API credentials
PHONE_NUMBER_ID=1161273803736000
ACCESS_TOKEN=<META_WHATSAPP_ACCESS_TOKEN>
API_VERSION=v25.0

GROQ_API_KEY=<GROQ_API_KEY>
GROQ_MODEL=llama-3.3-70b-versatile

OPENAI_API_KEY=<OPENAI_API_KEY>

QDRANT_URL=https://79805876-29f4-43ca-a40b-0637394fe60b.us-east-1-1.aws.cloud.qdrant.io
QDRANT_API_KEY=<QDRANT_API_KEY>
```

## Project Folder: `customer_communicatio_manager/server`
**File**: `customer_communicatio_manager/server/.env`

```env
# Ayush's FB account

# META_ACCESS_TOKEN=<META_ACCESS_TOKEN>
# #WABA_ID=1999738377287460
# Bre_WABA_ID=1015468127681241
# PHONE_NUMBER_ID=1161273803736000
# META_API_VERSION=v24.0


# Shoption's FB account

META_ACCESS_TOKEN=<META_ACCESS_TOKEN>
Bre_WABA_ID=745367028452487
META_APP_ID=1278416177206133
PHONE_NUMBER_ID=733726233157245
META_API_VERSION=v25.0
ERP_API_KEY=<ERP_API_KEY>
ERP_API_SECRET=<ERP_API_SECRET>
ERP_BASE_URL=https://proderp.gbru.in
```

## Project Folder: `customer_communicatio_manager/client`
**File**: `customer_communicatio_manager/client/.env.local`

```env
# NEXT_PUBLIC_API_KEY=<ERP_API_KEY>
# NEXT_PUBLIC_API_SECRET=<ERP_API_SECRET>
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
# NEXT_PUBLIC_API_BASE_URL=https://wacommunication-backend-test-c2bscke5ebhgbjca.centralindia-01.azurewebsites.net
# NEXT_PUBLIC_ERP_BASE_URL=https://uaterp.gbru.in
NEXT_PUBLIC_FIREBASE_API_KEY=<FIREBASE_API_KEY>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=shoption-af244.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=shoption-af244
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=shoption-af244.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=390986258141
NEXT_PUBLIC_FIREBASE_APP_ID=1:390986258141:web:e1845b7a8e142e5ad82d34
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-E5FEE5EC6M
NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL=firebase-adminsdk-jeprh@shoption-af244.iam.gserviceaccount.com
NEXT_PUBLIC_FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<FIREBASE_RSA_PRIVATE_KEY_HERE>\n-----END PRIVATE KEY-----\n"
```

## Project Folder: `cutomer_funnel_SaaS_platform/funnel_server`
**File**: `cutomer_funnel_SaaS_platform/funnel_server/.env`

```env
APP_NAME="Analytics Platform MVP"
APP_ENV=development
DATABASE_URL="postgresql+psycopg2://shoptionadmin:<PASSWORD>@shoption-call-trackdb.postgres.database.azure.com:5432/usereng_prod?sslmode=require"
CORS_ORIGINS='["http://localhost:5173","http://127.0.0.1:5173"]'
AUTO_CREATE_TABLES=true
JWT_SECRET="<JWT_SECRET>"
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Project Folder: `cutomer_funnel_SaaS_platform/customer_funnel`
**File**: `cutomer_funnel_SaaS_platform/customer_funnel/.env.local`

```env
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://vxajchrkxiajhblumbws.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
ANALYTICS_API_KEY=<ANALYTICS_API_KEY>
NEXT_PUBLIC_ANALYTICS_API_KEY=<ANALYTICS_API_KEY>
# Firebase configuration

VITE_API_BASE_URL=http://127.0.0.1:8000

VITE_FIREBASE_API_KEY=<FIREBASE_API_KEY>
VITE_FIREBASE_AUTH_DOMAIN=shoption-af244.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=shoption-af244
VITE_FIREBASE_STORAGE_BUCKET=shoption-af244.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=390986258141
VITE_FIREBASE_APP_ID=1:390986258141:web:e1845b7a8e142e5ad82d34
```

## Project Folder: `sentimental analysis for leadlens shoption/sentiment-analysis`
**File**: `sentimental analysis for leadlens shoption/sentiment-analysis/.env.local`

```env
NEXT_PUBLIC_SARVAM_API_KEY=<SARVAM_API_KEY>
NEXT_PUBLIC_GROQ_API_KEY=<GROQ_API_KEY>
```

## Project Folder: `meta_leads_automation/meta_web_app`
**File**: `meta_leads_automation/meta_web_app/.env.local`

```env
META_USER_ACCESS_TOKEN=<META_USER_ACCESS_TOKEN>
META_PAGE_ID=112518168556497
META_AD_ACCOUNT_ID=act_232212386474212
```

## Project Folder: `gbru_shoption_v2`
**File**: `gbru_shoption_v2/.env.local`

```env
# // test

API_BASE_URL=https://uaterp.gbru.in
WEBSITE_BASE_URL=https://recom.gbru.in
API_KEY=<ERP_API_KEY>
API_SECRET=<ERP_API_SECRET>
INDIA_POST_BASE_URL=https://app.indiapost.gov.in/beextcustomer/v1
PAYU_CLIENT_ID=<PAYU_CLIENT_ID>
PAYU_SECRET=<PAYU_SECRET>
PAYU_MERCHANT_ID=8567593
PAYMENT_GATEWAY_URL=https://pg.shoption.in/Payment/StartPayment
CAMPAIGN_NAME=B2C-AO-001
NEXT_PUBLIC_WHATSAPP_LINK=https://wa.me/919114151617?text=Hi
NEXT_PUBLIC_WHATSAPP_ENABLED=1
NEXT_PUBLIC_SUPPORT_PHONE=+919226514174
NEXT_PUBLIC_DISABLE_ENCRYPTION=false
NEXT_PUBLIC_ENC_KEY=<ENCRYPTION_KEY>
NEXT_PUBLIC_FIREBASE_API_KEY=<FIREBASE_API_KEY>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=shoption-af244.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=shoption-af244.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=390986258141
NEXT_PUBLIC_FIREBASE_APP_ID=1:390986258141:web:e1845b7a8e142e5ad82d34
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-E5FEE5EC6M
NEXT_PUBLIC_FIREBASE_PROJECT_ID=shoption-af244
NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL=firebase-adminsdk-jeprh@shoption-af244.iam.gserviceaccount.com
NEXT_PUBLIC_FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<FIREBASE_RSA_PRIVATE_KEY_HERE>\n-----END PRIVATE KEY-----\n"

# customer funnel uat
NEXT_PUBLIC_ANALYTICS_API_KEY=<ANALYTICS_API_KEY>
NEXT_PUBLIC_ANALYTICS_TRACK_URL=https://shoption-usereng-api-uat-becmhmdfbqd0gbcx.centralindia-01.azurewebsites.net/api/events/track
VITE_ANALYTICS_API_KEY=<ANALYTICS_API_KEY>
VITE_ANALYTICS_TRACK_URL=https://shoption-usereng-api-uat-becmhmdfbqd0gbcx.centralindia-01.azurewebsites.net/api/events/track
NEXT_PUBLIC_META_PIXEL_ID=2151289862166451
META_CAPI_ACCESS_TOKEN=<META_CAPI_ACCESS_TOKEN>
NEXT_PUBLIC_META_TEST_EVENT_CODE=TEST50732

# // prod

# API_BASE_URL=https://proderp.gbru.in
# WEBSITE_BASE_URL=https://gbru.shoption.in
# API_KEY=<ERP_API_KEY>
# API_SECRET=<ERP_API_SECRET>
# INDIA_POST_BASE_URL=https://app.indiapost.gov.in/beextcustomer/v1
# PAYU_CLIENT_ID=<PAYU_CLIENT_ID>
# PAYU_SECRET=<PAYU_SECRET>
# PAYU_MERCHANT_ID=12697171
# PAYMENT_GATEWAY_URL=https://shoptionpg.shoption.in/Payment/StartPayment
# CAMPAIGN_NAME=B2C-AO-001
# NEXT_PUBLIC_WHATSAPP_LINK=https://wa.me/919114151617?text=Hi
# NEXT_PUBLIC_WHATSAPP_ENABLED=1
# NEXT_PUBLIC_DISABLE_ENCRYPTION=false
# NEXT_PUBLIC_ENC_KEY=<ENCRYPTION_KEY>
# NEXT_PUBLIC_FIREBASE_API_KEY=<FIREBASE_API_KEY>
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=shoption-af244.firebaseapp.com
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=shoption-af244.firebasestorage.app
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=390986258141
# NEXT_PUBLIC_FIREBASE_APP_ID=1:390986258141:web:e1845b7a8e142e5ad82d34
# NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-E5FEE5EC6M
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=shoption-af244
# NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL=firebase-adminsdk-jeprh@shoption-af244.iam.gserviceaccount.com
# NEXT_PUBLIC_FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<FIREBASE_RSA_PRIVATE_KEY_HERE>\n-----END PRIVATE KEY-----\n"

# customer funnel uat
# NEXT_PUBLIC_ANALYTICS_API_KEY=<ANALYTICS_API_KEY>
# NEXT_PUBLIC_ANALYTICS_TRACK_URL=https://shoption-usereng-api-hjdqfpfthqc2cxgd.centralindia-01.azurewebsites.net/api/events/track
# VITE_ANALYTICS_API_KEY=<ANALYTICS_API_KEY>
# VITE_ANALYTICS_TRACK_URL=https://shoption-usereng-api-hjdqfpfthqc2cxgd.centralindia-01.azurewebsites.net/api/events/track
```

## Project Folder: `Gbru websites/website-react-prod`
**File**: `Gbru websites/website-react-prod/.env`

```env
# React App Configuration
VITE_APP_NAME=Gbru
VITE_APP_TITLE=Gbru - Modern E-commerce Store
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Modern E-commerce Website

# API Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_API_TIMEOUT=10000

# ERPNext API Integration
VITE_ERPNEXT_API_KEY=<ERP_API_KEY>
VITE_ERPNEXT_API_SECRET=<ERP_API_SECRET>
VITE_Prabhat_Base=https://proderp.gbru.in
VITE_PAYMENT_PRABHAT=https://shoptionpg.shoption.in
VITE_CAMPAIGN_NAME=B2C-AO-001
VITE_MIXPANEL_TOKEN=<MIXPANEL_TOKEN>

# Authentication
REACT_APP_JWT_SECRET=your-jwt-secret-key-here
REACT_APP_SESSION_TIMEOUT=3600000

# Payment Gateway
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key_here
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id_here

# Google Services
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# SMS/OTP Service
REACT_APP_SMS_API_KEY=your_sms_api_key_here
REACT_APP_SMS_SENDER_ID=GBRU

# Image/File Upload
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
REACT_APP_MAX_FILE_SIZE=5242880

# Analytics
REACT_APP_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
REACT_APP_FACEBOOK_PIXEL_ID=your_facebook_pixel_id

# Environment
NODE_ENV=development
REACT_APP_ENV=development

# Database (if using local backend)
DATABASE_URL=mongodb://localhost:27017/gbru-ecommerce

# Email Service
REACT_APP_EMAIL_SERVICE_ID=your_emailjs_service_id
REACT_APP_EMAIL_TEMPLATE_ID=your_emailjs_template_id
REACT_APP_EMAIL_PUBLIC_KEY=your_emailjs_public_key

# Social Media Links
REACT_APP_FACEBOOK_URL=https://facebook.com/gbru
REACT_APP_INSTAGRAM_URL=https://instagram.com/gbru
REACT_APP_TWITTER_URL=https://twitter.com/gbru

# App Settings
REACT_APP_CURRENCY=USD
REACT_APP_CURRENCY_SYMBOL=$
REACT_APP_DEFAULT_LANGUAGE=en
REACT_APP_TIMEZONE=America/New_York
```

## Project Folder: `Gbru websites/website-react-test`
**File**: `Gbru websites/website-react-test/.env`

```env
# React App Configuration
VITE_APP_NAME=Gbru
VITE_APP_TITLE=Gbru - Modern E-commerce Store
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Modern E-commerce Website

# API Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_API_TIMEOUT=10000

# ERPNext API Integration
VITE_ERPNEXT_API_KEY=<ERP_API_KEY>
VITE_ERPNEXT_API_SECRET=<ERP_API_SECRET>
VITE_Prabhat_Base=https://uaterp.gbru.in
VITE_PAYMENT_PRABHAT=https://pg.shoption.in
VITE_CAMPAIGN_NAME=B2C-AO-001
VITE_MIXPANEL_TOKEN=<MIXPANEL_TOKEN>

# Authentication
REACT_APP_JWT_SECRET=your-jwt-secret-key-here
REACT_APP_SESSION_TIMEOUT=3600000

# Payment Gateway
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key_here
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id_here

# Google Services
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# SMS/OTP Service
REACT_APP_SMS_API_KEY=your_sms_api_key_here
REACT_APP_SMS_SENDER_ID=GBRU

# Image/File Upload
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
REACT_APP_MAX_FILE_SIZE=5242880

# Analytics
REACT_APP_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
REACT_APP_FACEBOOK_PIXEL_ID=your_facebook_pixel_id

# Environment
NODE_ENV=development
REACT_APP_ENV=development

# Database (if using local backend)
DATABASE_URL=mongodb://localhost:27017/gbru-ecommerce

# Email Service
REACT_APP_EMAIL_SERVICE_ID=your_emailjs_service_id
REACT_APP_EMAIL_TEMPLATE_ID=your_emailjs_template_id
REACT_APP_EMAIL_PUBLIC_KEY=your_emailjs_public_key

# Social Media Links
REACT_APP_FACEBOOK_URL=https://facebook.com/gbru
REACT_APP_INSTAGRAM_URL=https://instagram.com/gbru
REACT_APP_TWITTER_URL=https://twitter.com/gbru

# App Settings
REACT_APP_CURRENCY=USD
REACT_APP_CURRENCY_SYMBOL=$
REACT_APP_DEFAULT_LANGUAGE=en
REACT_APP_TIMEZONE=America/New_York
```

## Project Folder: `mqtt_dummy_website/dealer_dashboard`
**File**: `mqtt_dummy_website/dealer_dashboard/.env.local`

```env
API_BASE_URL=https://proderp.gbru.in
X_API_KEY=<ERP_API_KEY>
X_API_SECRET=<ERP_API_SECRET>
PING_TIME=2
```

## Project Folder: `mqtt_dummy_website/app`
**File**: `mqtt_dummy_website/app/.env`

```env
NEXT_PUBLIC_API_BASE_URL=https://uatsmart.gbru.in
NEXT_PUBLIC_X_API_KEY=<ERP_API_KEY>
NEXT_PUBLIC_X_API_SECRET=<ERP_API_SECRET>
```

## Project Folder: `uat_api_page`
**File**: `uat_api_page/.env`

```env
API_BASE_URL=http://uaterp.gbru.in/api/method/shoption_chatbot.apis.faqs.get_faqs
SERVER_KEY=<ERP_API_KEY>
SERVER_SECRET=<ERP_API_SECRET>
```

## Project Folder: `stt_gpu_hosting`
**File**: `stt_gpu_hosting/.env`

```env
INDIC_HOST=0.0.0.0
INDIC_PORT=8001
MODEL_DIR=/app/models
DEFAULT_DECODING=ctc
DEFAULT_LANGUAGE=auto
MAX_FILE_SIZE_MB=250
MAX_AUDIO_DURATION_SEC=3600
GROQ_API_KEY=<GROQ_API_KEY>
GROQ_MODEL=openai/gpt-oss-120b
```

## Project Folder: `shoption_website`
**File**: `shoption_website/.env.local`

```env
ERP_BASE_URL=https://proderp.gbru.in
SHOPTION_API_KEY=<ERP_API_KEY>
SHOPTION_API_SECRET=<ERP_API_SECRET>
PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.shoption.calltracker
APP_STORE_URL=https://apps.apple.com/app/id6440000000
```

## Project Folder: `dummy_server`
**File**: `dummy_server/.env`

```env
LEADLENS_SECRET_KEY=leadlens_live_secret_key_placeholder
LEADLENS_SECRET_TOKEN=shoption_leadlens_webhook_token_2026
```
