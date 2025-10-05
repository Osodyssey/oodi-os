import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';

dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5000' }));

const SECRET = process.env.SERVER_JWT_SECRET || 'dev-secret';
// ذخیرهٔ کلیدهای حساس روی سرور (مثال)
const API_KEYS = {
  stripe: process.env.STRIPE_KEY || 'real-stripe-key-should-be-here'
};

// simple in-memory user DB (demo)
const USERS = {
  alice: { password: process.env.ALICE_PW || 'password', allowedSecrets: ['stripe'] },
  bob: { password: process.env.BOB_PW || 'hunter2', allowedSecrets: [] }
};

// store used jti to prevent replay (in-memory demo). In production use Redis.
const usedJtis = new Map();

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// login endpoint -> returns user JWT (for demo)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS[username];
  if (!user || user.password !== password) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ sub: username, iss: 'oodi-server', aud: 'oodi-client' }, SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// helper middleware to extract user JWT from Authorization header
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'no auth' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload.sub;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid auth' });
  }
}

// generate short-lived token for secret name
app.post('/api/get-secret-token', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!API_KEYS[name]) return res.status(403).json({ error: 'no such secret' });
  const user = USERS[req.user];
  if (!user || !user.allowedSecrets.includes(name)) return res.status(403).json({ error: 'forbidden' });
  // token with scope and jti
  const jti = crypto.randomBytes(12).toString('hex');
  const token = jwt.sign({ name, scope: ['pay'], iss: 'oodi-server', aud: 'oodi-proxy', jti }, SECRET, { expiresIn: '60s' });
  // store jti with TTL to prevent replay
  usedJtis.set(jti, Date.now() + 65 * 1000);
  setTimeout(()=> usedJtis.delete(jti), 70*1000);
  res.json({ token });
});

// middleware برای چک کردن توکن و جواز scope و جلوگیری از replay
function verifyToken(req, res, next) {
  const t = req.body.token || req.headers['x-client-token'] || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') && req.headers.authorization.slice(7));
  if (!t) return res.status(401).json({ error: 'no token' });
  try {
    const payload = jwt.verify(t, SECRET);
    // check jti reuse
    if (!payload.jti) return res.status(401).json({ error: 'no jti' });
    if (!usedJtis.has(payload.jti)) return res.status(401).json({ error: 'token expired or replayed' });
    // optionally remove jti to enforce one-time use
    usedJtis.delete(payload.jti);
    // check scope
    if (!payload.scope || !payload.scope.includes('pay')) return res.status(403).json({ error: 'insufficient scope' });
    req.secretName = payload.name;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// proxy endpoint
app.post('/api/proxy/pay', verifyToken, (req, res) => {
  const key = API_KEYS[req.secretName];
  // In production, you would call the external API using `key` here.
  console.log('proxying a pay request using secret:', req.secretName);
  res.json({ ok: true, usedSecret: req.secretName });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Secure server listening on', PORT));
