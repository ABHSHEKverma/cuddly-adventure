// ============================================================
// server.js — Backend for Website Rate Limiting Security Gateway
// ============================================================
// This server acts like a simplified Cloudflare entrance controller.
// It tracks how many users are currently "active" and decides
// whether new visitors are allowed in or blocked.
// ============================================================

const express = require("express");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = 3000;

// --------------- CONFIGURATION ---------------
// Maximum number of users allowed at the same time.
// Change this number to test different limits.
const MAX_USERS = 5;

// How long (in milliseconds) a user "slot" stays active
// before it is automatically released. (60 seconds)
const USER_TIMEOUT_MS = 60 * 1000;
// -----------------------------------------------

// In-memory store of active user sessions.
// Each entry: { token, ip, createdAt, timer }
const activeUsers = new Map();

// Serve static files (HTML, CSS, JS) from the "public" folder.
app.use(express.static(path.join(__dirname, "public")));

// ============================================================
// ROUTE: POST /api/request-access
// Called when a visitor clicks "Enter" on the gateway page.
// Decides whether to allow or block the visitor.
// ============================================================
app.post("/api/request-access", express.json(), (req, res) => {
  // Use X-Simulated-IP header for attack simulation, otherwise real IP
  const visitorIP = req.headers["x-simulated-ip"] || req.ip;

  // Check if this IP already has an active session
  for (const [token, session] of activeUsers) {
    if (session.ip === visitorIP) {
      // Already admitted — let them through again with same token
      return res.json({ allowed: true, token });
    }
  }

  // Check the current number of active users
  if (activeUsers.size >= MAX_USERS) {
    // Too many users — block this visitor
    console.log(
      `[BLOCKED] IP: ${visitorIP} | Active users: ${activeUsers.size}/${MAX_USERS}`
    );
    return res.json({ allowed: false });
  }

  // Generate a unique session token for the new user
  const token = crypto.randomBytes(16).toString("hex");

  // Set a timer to automatically release this slot after the timeout
  const timer = setTimeout(() => {
    activeUsers.delete(token);
    console.log(
      `[EXPIRED] Token: ${token.slice(0, 8)}... | Active users: ${activeUsers.size}/${MAX_USERS}`
    );
  }, USER_TIMEOUT_MS);

  // Store the session
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

// ============================================================
// ROUTE: POST /api/leave
// Called when a user leaves the protected site (optional).
// Frees up their slot immediately instead of waiting for timeout.
// ============================================================
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

// ============================================================
// ROUTE: GET /api/status
// Returns the current server status (for the admin dashboard).
// ============================================================
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

// ============================================================
// START SERVER
// ============================================================
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
