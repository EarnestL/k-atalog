# MongoDB setup for Katalog API

This guide covers setting up MongoDB and wiring it securely (connection string in `.env` only, no secrets in code or git).

---

## 1. Where to run MongoDB

### Option A: Local (development)

1. **Install MongoDB Community**  
   - [Windows](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/)  
   - [macOS](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/)  
   - Or use Docker: `docker run -d -p 27017:27017 --name mongodb mongo:7`

2. **Connection string (no auth by default):**
   ```env
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DATABASE_NAME=katalog
   ```

3. **Optional local auth:** Create a user in the `admin` or your DB, then use:
   ```env
   MONGODB_URI=mongodb://username:password@localhost:27017
   ```
   Put this only in `.env`; never commit `.env`.

### Option B: MongoDB Atlas (hosted, good for production)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.

2. **Create a cluster** (e.g. M0 free tier), then:
   - **Database Access** → Add Database User: create a user and password (store the password only in `.env`).
   - **Network Access** → Add IP Address: allow your server’s IP, or `0.0.0.0/0` only for quick dev (restrict later).

3. **Get the connection string:**  
   In Atlas: **Connect** → **Drivers** → copy the URI. It looks like:
   ```text
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<username>` and `<password>` with your DB user. Optionally add the database name:
   ```text
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/katalog?retryWrites=true&w=majority
   ```

4. **Put it only in `.env`:**
   ```env
   MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/katalog?retryWrites=true&w=majority
   MONGODB_DATABASE_NAME=katalog
   ```

---

## 2. Configure the app with `.env`

1. **Create `.env` from the example (do not commit `.env`):**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and set only there:**
   - `MONGODB_URI` – full connection string (including password for Atlas).
   - `MONGODB_DATABASE_NAME` – e.g. `katalog`.

3. **Check that secrets are ignored by git:**
   ```bash
   git check-ignore .env
   ```
   Should output: `.env`  
   The repo `.gitignore` already contains `.env` and `.env.local`.

---

## 3. Security checklist

| Rule | Why |
|------|-----|
| **Store the connection string only in `.env`** | So the password never lives in code or version control. |
| **Never commit `.env` or `.env.local`** | They are in `.gitignore`; avoid force-adding them. |
| **Never log `MONGODB_URI`** | The app only logs “MongoDB connected” or “connection failed”, not the URI. |
| **Use a dedicated DB user** | Create a MongoDB user only for this app (Atlas or local auth). |
| **Least privilege** | Grant that user only the roles it needs (read/write on `katalog` DB, not `admin`). |
| **Restrict network (Atlas)** | In production, allow only your server’s IP in Atlas Network Access. |
| **Prefer TLS** | Atlas uses TLS by default; for local, use `mongodb://...` only in dev. |

---

## 4. Verify the connection

1. Install dependencies (includes `motor`):
   ```bash
   pip install -r requirements.txt
   ```

2. Set `MONGODB_URI` (and optionally `MONGODB_DATABASE_NAME`) in `.env`.

3. Start the API:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

4. In the logs you should see either:
   - `MongoDB connected` – connection succeeded, or  
   - `MongoDB connection failed; check MONGODB_URI and network` – fix URI, network, or Atlas IP access.

5. If you leave `MONGODB_URI` empty (or omit it), the app will log:
   - `MongoDB not configured (using file/hardcoded data)`  
   and will keep using the existing file/hardcoded catalog data.

---

## 5. Using the DB in code (implemented)

- When `MONGODB_URI` is set and the app connects successfully:
  - **Collections** `groups` and `photocards` are used (see `app.core.db`).
  - **Seeding**: If the `groups` collection is empty on startup, the app seeds it from your file or hardcoded data (see `seed_mongodb_if_empty` in `app.services.data_loader`).
  - **Data access**: All API endpoints use the async data layer (`get_groups_async`, `get_group_by_id_async`, `search_catalog_async`, etc.), which reads from MongoDB when connected and from in-memory/file when not.
- The connection string is read only from `.env` via `get_settings().mongodb_uri` and is never logged or exposed.
