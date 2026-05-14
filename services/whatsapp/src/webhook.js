const axios = require("axios");

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
const SESSION_ID = process.env.SESSION_ID || 'primary_account';

async function notifyBackend(data) {
  try {
    const payload = {
      session_id: data.session_id || SESSION_ID,
      ...data
    };
    const response = await axios.post(`${BACKEND_URL}/webhooks/whatsapp`, payload);
    return response.data;
  } catch (err) {
    console.error("Backend notify error:", err.message);
    return null;
  }
}

module.exports = { notifyBackend };
