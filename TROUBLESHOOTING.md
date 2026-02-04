# Troubleshooting: "The site cannot be reached"

You're running the **API in WSL** and opening the **browser on Windows**. Here’s what to check.

---

## 1. Use the WSL IP instead of localhost (most common fix)

WSL2 has its own network. From a **Windows** browser, `localhost` sometimes doesn’t reach services in WSL. Use the **WSL IP** instead.

**In your WSL terminal**, get the IP:

```bash
hostname -I | awk '{print $1}'
```

Example: `172.24.123.45`

**In your Windows browser**, open:

- **API / Swagger:** `http://<WSL_IP>:8000/docs`  
  e.g. `http://172.24.123.45:8000/docs`
- **React app:** `http://<WSL_IP>:5173`  
  e.g. `http://172.24.123.45:5173`

Replace `<WSL_IP>` with the number from the command above.

---

## 2. Allow the ports in Windows Firewall

Windows Firewall can block access to WSL.

1. Open **Windows Defender Firewall** → **Advanced settings** → **Inbound Rules**.
2. **New Rule** → Port → TCP, ports **8000** and **5173** → Allow the connection.
3. Or temporarily turn off the firewall to test (turn it back on after).

---

## 3. Start both servers correctly

**In WSL (from project root or server/):**

```bash
# Terminal 1 – API (must use --host 0.0.0.0)
cd /mnt/c/Users/earne/OneDrive/Desktop/k-atalog/server
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**In WSL or Windows – client:**

```bash
# Terminal 2 – React app
cd client
npm run dev
```

Then open in the browser (using WSL IP if localhost fails):

- App: `http://<WSL_IP>:5173` or `http://localhost:5173`
- API docs: `http://<WSL_IP>:8000/docs` or `http://localhost:8000/docs`

---

## 4. Check that the API is listening

**In WSL**, while the API is running:

```bash
curl -s http://127.0.0.1:8000/api/v1/health
```

You should see: `{"status":"ok","service":"Katalog API"}`.

If that works in WSL but the browser still can’t reach it, use the WSL IP in the browser (step 1) or check the firewall (step 2).

---

## 5. If the React app loads but API calls fail

The client proxies `/api` to `http://127.0.0.1:8000`. If the **client** runs in WSL, that’s correct. If the **client** runs in Windows and the **API** runs in WSL, the proxy still targets Windows’ `127.0.0.1:8000`, which WSL2 usually forwards to WSL. If it doesn’t:

- Run **both** the API and the client in WSL, and open the app using the WSL IP (e.g. `http://<WSL_IP>:5173`).

---

## Quick checklist

| Step | Action |
|------|--------|
| 1 | Get WSL IP: `hostname -I \| awk '{print $1}'` in WSL |
| 2 | Open `http://<WSL_IP>:8000/docs` in the Windows browser |
| 3 | If that fails, add firewall rules for TCP 8000 and 5173 |
| 4 | Start API with `--host 0.0.0.0` and client with `npm run dev` |
| 5 | Use `http://<WSL_IP>:5173` for the app if localhost:5173 doesn’t work |
