const express = require("express");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = 3000;

const MAX_USERS = 5;
const USER_TIMEOUT_MS = 60 * 1000;
const activeUsers = new Map();

app.use(express.static(path.join(__dirname, "public")));

app.post("/api/request-access", express.json(), (req, res) => {
  const visitorIP = req.headers["x-simulated-ip"] || req.ip;

  for (const [token, session] of activeUsers) {
    if (session.ip === visitorIP) {
      return res.json({ allowed: true, token });
    }
  }

  if (activeUsers.size >= MAX_USERS) {
    console.log(
      `[BLOCKED] IP: ${visitorIP} | Active users: ${activeUsers.size}/${MAX_USERS}`
    );
    return res.json({ allowed: false });
  }

  const token = crypto.randomBytes(16).toString("hex");

  const timer = setTimeout(() => {
    activeUsers.delete(token);
    console.log(
      `[EXPIRED] Token: ${token.slice(0, 8)}... | Active users: ${activeUsers.size}/${MAX_USERS}`
    );
  }, USER_TIMEOUT_MS);

  activeUsers.set(token, {
    ip: visitorIP,
    createdAt: Date.now(),
    timer,
  });

  console.log(
    `[ALLOWED] IP: ${visitorIP} | Token: ${token.slice(0, 8)}... | Active users: ${activeUsers.size}/${MAX_USERS}`
  );

  return res.json({ allowed: true, token });
});

app.post("/api/leave", express.json(), (req, res) => {
  const { token } = req.body;

  if (token && activeUsers.has(token)) {
    clearTimeout(activeUsers.get(token).timer);
    activeUsers.delete(token);
    console.log(
      `[LEFT] Token: ${token.slice(0, 8)}... | Active users: ${activeUsers.size}/${MAX_USERS}`
    );
  }

  return res.json({ success: true });
});

app.get("/api/status", (_req, res) => {
  const sessions = [];
  for (const [token, session] of activeUsers) {
    sessions.push({
      token: token.slice(0, 8) + "...",
      ip: session.ip,
      age: Math.round((Date.now() - session.createdAt) / 1000) + "s",
    });
  }

  res.json({
    activeUsers: activeUsers.size,
    maxUsers: MAX_USERS,
    timeoutSeconds: USER_TIMEOUT_MS / 1000,
    sessions,
  });
});

app.listen(PORT, () => {
  console.log();
  console.log("==============================================");
  console.log(" Website Rate Limiting Security Gateway");
  console.log("==============================================");
  console.log(` Server running    : http://localhost:${PORT}`);
  console.log(` Max active users  : ${MAX_USERS}`);
  console.log(` Session timeout   : ${USER_TIMEOUT_MS / 1000}s`);
  console.log("==============================================");
  console.log();
});
