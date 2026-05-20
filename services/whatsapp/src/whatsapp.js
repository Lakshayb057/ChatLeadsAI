const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  delay
} = require("@whiskeysockets/baileys");

const P = require("pino");
const axios = require("axios");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const path = require("path");

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

async function connectWhatsApp(sessionId, onMessage, onStatusChange) {
  const authPath = path.join(__dirname, `../auth/${sessionId}`);
  
  // Ensure auth directory exists
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  
  console.log(`[${sessionId}] Starting WA v${version.join('.')}`);

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    markOnlineOnConnect: true,
    syncFullHistory: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log(`[${sessionId}] New QR Generated`);
      // Retry posting QR in case backend is still starting
      postWithRetry(`${BACKEND_URL}/sessions/update-qr`, {
        session_id: sessionId,
        qr_code: qr,
        status: "linking"
      }).catch(err => console.error(`[${sessionId}] QR Sync failed after retries:`, err.message));
    }

    if (connection === "close") {
      const statusCode = (new Boom(lastDisconnect?.error))?.output?.statusCode;
      
      const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
      const isConflict = statusCode === 440;
      
      // Reconnect for most errors except logout
      const shouldReconnect = !isLoggedOut;
      
      console.log(`[${sessionId}] Connection closed (${statusCode}). Reconnecting: ${shouldReconnect}`);
      
      if (isLoggedOut) {
        console.log(`[${sessionId}] ❌ Session Expired/Logged Out. Purging auth...`);
        if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true });
        if (onStatusChange) onStatusChange('disconnected');
      } 
      else {
        const delayMs = isConflict ? 10000 : 5000;
        console.log(`[${sessionId}] 🔄 Reconnecting in ${delayMs/1000}s...`);
        if (onStatusChange) onStatusChange('reconnecting');
        setTimeout(() => {
          connectWhatsApp(sessionId, onMessage, onStatusChange).then(newSock => {
            if (onStatusChange) onStatusChange('reconnected', newSock);
          });
        }, delayMs);
      }
    }
 else if (connection === "open") {
      console.log(`[${sessionId}] ✅ Connected Successfully`);
      
      // Deep Handshake: Verify session is actually ready
      setTimeout(async () => {
        try {
          await axios.post(`${BACKEND_URL}/sessions/update-qr`, {
            session_id: sessionId,
            qr_code: "",
            status: "connected"
          });
          console.log(`[${sessionId}] 🚀 Fleet synchronization complete.`);
        } catch (err) {
          console.error(`[${sessionId}] Sync failed:`, err.message);
        }
      }, 3000); // 3s delay for deep stability
      
      if (onStatusChange) onStatusChange('connected');
    }
  });

  // Listen for messages
  sock.ev.on("messages.upsert", async (m) => {
    console.log(`[${sessionId}] 📥 Raw Upsert: Type=${m.type}, Messages=${m.messages?.length}`);
    if (onMessage) onMessage(sock, m);
  });

  return sock;
}

// Retry helper: keeps trying until backend accepts the request
async function postWithRetry(url, data, maxAttempts = 10, delayMs = 3000) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await axios.post(url, data, { timeout: 5000 });
      return; // success
    } catch (err) {
      if (i === maxAttempts) throw err;
      console.log(`[Retry ${i}/${maxAttempts}] POST ${url} failed. Retrying in ${delayMs/1000}s...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

module.exports = connectWhatsApp;
