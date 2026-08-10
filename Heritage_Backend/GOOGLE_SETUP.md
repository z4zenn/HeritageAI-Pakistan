# Google OAuth 2.0 Credentials Setup Guide

Follow these step-by-step instructions to configure Google OAuth 2.0 for the HeritageAI Pakistan project.

---

### Step 1: Go to Google Cloud Console
1. Navigate to the [Google Cloud Developer Console](https://console.cloud.google.com/).
2. Log in with your Google Account.

### Step 2: Create a New Project
1. In the top navigation bar, click the project selection dropdown.
2. Click **New Project** in the top right of the modal.
3. Enter a project name (e.g., `HeritageAI-Pakistan`) and click **Create**. Wait for Google to provision the project.

### Step 3: Configure OAuth Consent Screen
1. On the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (unless you are part of a Google Workspace organization and want to restrict it) and click **Create**.
3. Fill in the required fields:
   - **App name**: `HeritageAI Pakistan`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click **Save and Continue**.
5. Under **Scopes**, click **Add or Remove Scopes**. Enable:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Click **Save and Continue**, add test users if necessary, and finish the setup.

### Step 4: Create OAuth Credentials
1. In the left sidebar, click **Credentials**.
2. Click **+ CREATE CREDENTIALS** at the top of the screen and select **OAuth client ID**.
3. Choose **Web application** under **Application type**.
4. Set a name (e.g., `HeritageAI Web Client`).
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5000`
   - `http://localhost:5173`
6. Under **Authorized redirect URIs**, add this exact callback URL:
   - `http://localhost:5000/api/auth/google/callback`
7. Click **Create**.

### Step 5: Update Your Environment File (`.env`)
1. Google will display your **Client ID** and **Client Secret** on the screen.
2. Open your backend `.env` file (`Heritage_Backend/.env`) and populate the following properties:
   ```env
   GOOGLE_CLIENT_ID=your_actual_client_id_from_google
   GOOGLE_CLIENT_SECRET=your_actual_client_secret_from_google
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   FRONTEND_URL=http://localhost:5173
   SESSION_SECRET=a_random_secure_session_secret_key
   ```
3. Save the `.env` file and restart your backend development server (`npm run dev`).
