import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import crypto from "crypto";
import fetch from "node-fetch";

dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));

const DEMO = (process.env.DEMO_MODE || "false").toLowerCase() === "true";
const SECRET = process.env.SERVER_JWT_SECRET || "dev-secret";
const API_KEYS = {
  ai: process.env.AI_KEY || "sk_ai_demo",
};

const USERS = {
  alice: {
    password: process.env.ALICE_PW || "password",
    allowedSecrets: ["ai"],
  },
  bob: { password: process.env.BOB_PW || "hunter2", allowedSecrets: [] },
};

const usedJtis = new Map();
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// status endpoint: useful for clients to detect demo mode
app.get("/api/status", (req, res) => {
  res.json({ ok: true, demo: DEMO, server: "oodi-secure-v2" });
});

// login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = USERS[username];
  if (!user || user.password !== password)
    return res.status(401).json({ error: "invalid credentials" });
  const token = jwt.sign(
    { sub: username, iss: "oodi-server", aud: "oodi-client" },
    SECRET,
    { expiresIn: "1h" }
  );
  res.json({ token });
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "no auth" });
  try {
    const payload = jwt.verify(auth.slice(7), SECRET);
    req.user = payload.sub;
    next();
  } catch (e) {
    return res.status(401).json({ error: "invalid auth" });
  }
}

app.post("/api/get-secret-token", authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!API_KEYS[name]) return res.status(403).json({ error: "no such secret" });
  const user = USERS[req.user];
  if (!user || !user.allowedSecrets.includes(name))
    return res.status(403).json({ error: "forbidden" });
  const jti = crypto.randomBytes(12).toString("hex");
  const token = jwt.sign(
    { name, scope: ["generate"], iss: "oodi-server", aud: "oodi-proxy", jti },
    SECRET,
    { expiresIn: "60s" }
  );
  usedJtis.set(jti, Date.now() + 65 * 1000);
  setTimeout(() => usedJtis.delete(jti), 70 * 1000);
  res.json({ token });
});

function verifyToken(req, res, next) {
  const t =
    req.body.token ||
    req.headers["x-client-token"] ||
    (req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ") &&
      req.headers.authorization.slice(7));
  if (!t) {
    if (DEMO) {
      // In demo mode, allow unauthenticated proxy calls for easier demoing.
      console.warn(
        "[DEMO MODE] proxy call without token - allowing for demo only"
      );
      req.secretName = "ai";
      return next();
    }
    return res.status(401).json({ error: "no token" });
  }
  try {
    const payload = jwt.verify(t, SECRET);
    if (!payload.jti) return res.status(401).json({ error: "no jti" });
    if (!usedJtis.has(payload.jti))
      return res.status(401).json({ error: "token expired or replayed" });
    usedJtis.delete(payload.jti);
    if (!payload.scope || !payload.scope.includes("generate"))
      return res.status(403).json({ error: "insufficient scope" });
    req.secretName = payload.name;
    next();
  } catch (e) {
    return res.status(401).json({ error: "invalid token" });
  }
}

// proxy AI
app.post("/api/proxy/ai", verifyToken, async (req, res) => {
  try {
    const key = API_KEYS[req.secretName];
    if (!key) return res.status(500).json({ error: "server missing api key" });
    const { prompt } = req.body;
    // Call external AI - here we simulate with internal endpoint
    const response = await fetch(
      "http://localhost:" +
        (process.env.PORT || 3000) +
        "/external/ai/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key },
        body: JSON.stringify({ prompt }),
      }
    );
    const json = await response.json();
    res.json({ ok: true, reply: json.reply });
  } catch (err) {
    console.error("proxy ai error", err);
    res.status(500).json({ error: "proxy error" });
  }
});

// mock external AI endpoint
app.post("/external/ai/generate", (req, res) => {
  const key = req.headers["x-api-key"] || req.body.apiKey;
  if (!key || key !== API_KEYS.ai)
    return res.status(403).json({ error: "invalid external api key" });
  const prompt = req.body.prompt || "";
  const fakeReply = `AI (simulated) reply for: "${prompt}"`;
  res.json({ ok: true, reply: fakeReply });
});

// simple endpoints for demo logs and todo
const TODOS = [];
app.post("/api/log", (req, res) => {
  console.log("CLIENT LOG:", req.body.msg);
  res.json({ ok: true });
});
app.post("/api/todo/add", (req, res) => {
  TODOS.push(req.body.text);
  res.json({ ok: true });
});
app.post("/api/todo/list", (req, res) => {
  res.json({ ok: true, items: TODOS });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Secure Oodi server running on", PORT, "DEMO_MODE=" + DEMO)
);
