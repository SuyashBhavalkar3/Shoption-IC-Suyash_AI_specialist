# Deploying FastAPI Server to Azure App Service (Linux)

This guide provides step-by-step instructions to deploy the Shoption Call Tracker FastAPI backend to **Azure App Service**.

## Step 1: Create the Azure App Service resource

1. Go to the [Azure Portal](https://portal.azure.com/).
2. Click **Create a resource** and search for **Web App** (App Service).
3. Configure the following details:
   - **Publish**: Code
   - **Runtime stack**: Python 3.10 (or 3.11 / 3.12)
   - **Operating System**: Linux
   - **Pricing Plan**: Basic (B1) or higher for production use.
4. Click **Review + create** and then **Create**.

## Step 2: Configure Environment Variables

Azure App Service injects settings directly as environment variables.

1. In your App Service page, navigate to **Settings** -> **Configuration** in the left menu.
2. Under the **Application settings** tab, click **New application setting** to add the following variables:
   - `SUPABASE_CONNECTION_STRING`: Your PostgreSQL connection string (e.g., `postgresql://...`).
   - `JWT_SECRET_KEY`: A strong random secret key for session JWTs.
   - `JWT_ALGORITHM`: `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440` (24 hours, or your preferred duration).
3. Click **Save** at the top of the page.

## Step 3: Configure Startup Command

Because FastAPI requires an ASGI server, we need to instruct Azure to run the application using `gunicorn` with the `uvicorn` worker class.

1. Navigate to **Settings** -> **Configuration** -> **General settings** tab.
2. In the **Startup Command** field, input the following command:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker --bind=0.0.0.0:8000 app.main:app
   ```
3. Click **Save**.

## Step 4: Deploy your Code

You can deploy the code via **GitHub Actions** or **Local Git / Zip deploy**.

### Option A: Local Git deployment
1. Go to **Deployment** -> **Deployment Center**.
2. Select **Local Git** as the source, and click Save.
3. Copy the Git Clone Uri and deployment credentials provided by Azure.
4. Push your repository's server folder branch directly to that remote.

### Option B: ZIP Deployment (using Azure CLI)
Alternatively, you can compress the `server` folder contents into a `.zip` file (ensuring `app/` and `requirements.txt` are at the root level of the ZIP) and deploy it:
```bash
az webapp deployment source config-zip --resource-group <your-resource-group> --name <your-app-name> --src server.zip
```
