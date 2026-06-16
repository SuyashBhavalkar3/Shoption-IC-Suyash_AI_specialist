# LeadLens Webhook Consumer (Dummy Server)

This is a lightweight FastAPI and Uvicorn-based dummy server designed to consume and verify webhooks sent by LeadLens.

## Requirements

Ensure you have Python 3.8+ installed.

## Setup Instructions

1. **Create and Activate Virtual Environment**:
   ```bash
   python3 -m venv dummy_env
   source dummy_env/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables**:
   Configure the following environment variables. The server will fall back to default dummy values if not specified.
   - `LEADLENS_SECRET_KEY`: Used for the GET endpoint handshake verification (Default: `my_dummy_secret`).
   - `LEADLENS_SECRET_TOKEN`: Used as the HMAC key to verify signatures of the POST event payloads (Default: `my_dummy_token`).

   Example export (macOS/Linux):
   ```bash
   export LEADLENS_SECRET_KEY="my_dummy_secret"
   export LEADLENS_SECRET_TOKEN="my_dummy_token"
   ```

3. **Run the Server**:
   Run the Uvicorn server on port `8000`:
   ```bash
   uvicorn main:app --port 8000 --reload
   ```

## Endpoints

### 1. Webhook Handshake (GET `/webhook`)
Validates subscription requests.
- **Parameters**:
  - `hub.mode` (must be `subscribe`)
  - `hub.verify_token` (must match `LEADLENS_SECRET_KEY`)
  - `hub.challenge`
- **Response**: Returns the exact challenge code as a plain text response with a `200 OK` status, or `403 Forbidden` if verification fails.

### 2. Webhook Event Consumption (POST `/webhook`)
Processes incoming event payloads.
- **Headers**:
  - `X-LeadLens-Signature`: SHA256 HMAC of request body using `LEADLENS_SECRET_TOKEN` (can be prefixed with `sha256=`).
- **Body**: JSON event payload.
- **Response**: Returns `{"status": "success"}` on verification success, or `403 Forbidden` on invalid signature.

---

## Render Deployment (Docker)

To deploy this server to **Render**:

1. **Push your code** to a GitHub/GitLab repository.
2. **Create a New Web Service** on Render:
   - Select your repository.
   - Choose **Docker** as the Runtime.
3. **Configure Environment Variables** in the Render service settings:
   - `LEADLENS_SECRET_KEY` (e.g. `my_dummy_secret`)
   - `LEADLENS_SECRET_TOKEN` (e.g. `my_dummy_token`)
4. **Deploy**: Render will build the Dockerfile and automatically map its internal `$PORT` to host the service.

