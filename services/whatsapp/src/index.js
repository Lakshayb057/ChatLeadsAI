require("dotenv").config();
const connectWhatsApp = require("./whatsapp");
const saveImage = require("./media");
const { notifyBackend } = require("./webhook");
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const sessions = new Map(); // Store active socket instances
const startingSessions = new Set(); // Guard against race conditions

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

async function createSession(sessionId) {
  if (sessions.has(sessionId) || startingSessions.has(sessionId)) {
    console.log(`[${sessionId}] Session already active or starting.`);
    return;
  }

  startingSessions.add(sessionId);
  try {
    const sock = await connectWhatsApp(
      sessionId,
      async (sock, { messages, type }) => {
        console.log(`[${sessionId}] 📨 Handling ${type} upsert with ${messages.length} messages.`);
        if (type !== 'notify') {
          console.log(`[${sessionId}] ℹ️ Ignoring ${type} upsert (not notify).`);
          // We still might want to process 'append' if the user is having issues
          // return; 
        }
        for (const msg of messages) {
          await handleMessage(sessionId, sock, msg);
        }
      },
      (status) => {
        if (status === 'disconnected') {
          sessions.delete(sessionId);
        }
      }
    );

    sessions.set(sessionId, sock);
  } finally {
    startingSessions.delete(sessionId);
  }
}

async function handleMessage(sessionId, sock, msg) {
  try {
    if (!msg.message) return;

    const jid = msg.key.remoteJid;
    const isFromMe = msg.key.fromMe;
    
    // Correctly identify sender in groups vs direct messages
    const senderJid = msg.key.participant || jid;
    const senderName = msg.pushName || senderJid.split('@')[0];

    console.log(`[${sessionId}] 📩 Message received from ${senderName} (${senderJid}) ${isFromMe ? '[Self]' : ''} in ${jid}`);

    if (isFromMe) {
      console.log(`[${sessionId}] ℹ️ Skipping message from self.`);
      return;
    }

    if (msg.message.protocolMessage) {
      console.log(`[${sessionId}] ℹ️ Skipping protocol message.`);
      return;
    }

    let payload = {
      session_id: sessionId,
      sender_jid: senderJid, // Use participant for group context
      group_jid: jid.endsWith('@g.us') ? jid : null,
      sender_name: senderName
    };

    const msgType = Object.keys(msg.message)[0];
    console.log(`[${sessionId}] 📦 Message Type: ${msgType}`);

    // Text & Extended Text
    if (msg.message.conversation || msg.message.extendedTextMessage) {
      payload.text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    } 
    // Images
    else if (msg.message.imageMessage) {
      console.log(`[${sessionId}] 🖼️ Image detected, downloading...`);
      const saved = await saveImage(sock, msg);
      if (saved) {
        payload.text = msg.message.imageMessage.caption || "[image]";
        payload.image_base64 = saved.buffer.toString("base64");
      } else {
        payload.text = msg.message.imageMessage.caption || "[image download failed]";
      }
    }
    // Buttons & Templates
    else if (msg.message.buttonsResponseMessage) {
      payload.text = msg.message.buttonsResponseMessage.selectedButtonId || "";
    }
    else if (msg.message.templateButtonReplyMessage) {
      payload.text = msg.message.templateButtonReplyMessage.selectedId || "";
    }
    else if (msg.message.listResponseMessage) {
      payload.text = msg.message.listResponseMessage.title || "";
    }
    // Document
    else if (msg.message.documentMessage) {
      payload.text = `[document] ${msg.message.documentMessage.caption || msg.message.documentMessage.fileName || ""}`;
    }

    if (payload.text) {
      console.log(`[${sessionId}] 📡 Notifying backend for message: "${payload.text.substring(0, 30)}..."`);
      await notifyBackend(payload);
    } else {
      console.log(`[${sessionId}] ℹ️ No processable text found in ${msgType}.`);
    }
  } catch (err) {
    console.error(`[${sessionId}] ❌ Message Error:`, err.message);
  }
}

// Control Server for Multi-Session Management
const app = express();
app.use(express.json());

app.post('/send-message', async (req, res) => {
  const { session_id, jid, text } = req.body;
  if (!session_id || !jid || !text) {
    return res.status(400).json({ error: "Missing required fields (session_id, jid, text)" });
  }

  const sock = sessions.get(session_id);
  if (!sock) {
    return res.status(404).json({ error: "Session not found or inactive" });
  }

  try {
    await sock.sendMessage(jid, { text });
    res.json({ status: "success" });
  } catch (e) {
    console.error(`[${session_id}] Failed to send message:`, e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: "online",
    sessions: Array.from(sessions.keys()),
    starting: Array.from(startingSessions)
  });
});

app.post('/sessions/start', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: "Missing session_id" });
  
  await createSession(session_id);
  res.json({ status: "initializing", session_id });
});

app.post('/sessions/stop', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: "Missing session_id" });
  
  console.log(`[${session_id}] 🛑 Initiating Total Purge and Unpair...`);
  const sock = sessions.get(session_id);
  const authPath = path.join(__dirname, `../auth/${session_id}`);
  
  try {
    // 1. Force the Unpair signal to the mobile device
    if (sock) {
      console.log(`[${session_id}] 📡 Sending Unpair signal to member's device...`);
      try {
        await sock.logout();
        console.log(`[${session_id}] ✅ Device successfully unpaired.`);
      } catch (e) {
        console.log(`[${session_id}] ⚠️ Device was already offline or unlinked.`);
      }
      sessions.delete(session_id);
    }

    // 2. Shred the authentication vault
    if (fs.existsSync(authPath)) {
      console.log(`[${session_id}] 🗑️ Shredding local auth vault...`);
      fs.rmSync(authPath, { recursive: true, force: true });
    }
    
    res.json({ status: "success", message: "Account fully unpaired and purged" });
  } catch (e) {
    console.error(`[${session_id}] ❌ Purge failed:`, e.message);
    res.json({ status: "error", message: e.message });
  }
});

app.post('/logout', async (req, res) => {
  const { session_id } = req.body;
  const targetId = session_id || "primary_account";
  const sock = sessions.get(targetId);
  if (sock) {
    try {
      await sock.logout();
      sessions.delete(targetId);
      res.json({ status: "success" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(404).json({ error: "Session not active" });
  }
});

const PORT = process.env.PORT || process.env.CONTROL_PORT || 8001;
app.listen(PORT, async () => {
  console.log(`🚀 Multi-Session Hub running on port ${PORT}`);
  
  try {
    console.log("📂 Restoring session fleet from database...");
    const response = await axios.get(`${BACKEND_URL}/sessions/`);
    const dbSessions = response.data;
    
    for (const session of dbSessions) {
      console.log(`[Fleet] Waking up: ${session.session_id}`);
      await createSession(session.session_id);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  } catch (err) {
    console.error("❌ Fleet restoration failed:", err.message);
    createSession("primary_account");
  }
});
