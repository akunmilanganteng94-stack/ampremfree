/**
 * AZRYLPREM Backend Service / Firebase Cloud Functions
 * Handles secure proxying to external services:
 * POST https://am.dapjisync.my.id/api/send
 * POST https://am.dapjisync.my.id/api/bulk
 * Secret API keys are strictly kept server-side in environment variables.
 */

const express = require('express');
const app = express();

app.use(express.json());

const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY || 'FREE';
const EXTERNAL_SEND_URL = process.env.EXTERNAL_SEND_URL || 'https://am.dapjisync.my.id/api/send';
const EXTERNAL_BULK_URL = process.env.EXTERNAL_BULK_URL || 'https://am.dapjisync.my.id/api/bulk';

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'AZRYLPREM_CORE',
    timestamp: new Date().toISOString()
  });
});

// Proxy POST /api/send (Verif Gmail)
app.post('/api/send', async (req, res) => {
  const { email, sessionId } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      status: 'Failed',
      message: 'Email wajib diisi.'
    });
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail.endsWith('@gmail.com') && !trimmedEmail.endsWith('@googlemail.com')) {
    return res.status(400).json({
      success: false,
      status: 'Failed',
      message: 'Hanya alamat Gmail (@gmail.com) yang didukung.'
    });
  }

  try {
    const upstreamRes = await fetch(EXTERNAL_SEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': EXTERNAL_API_KEY
      },
      body: JSON.stringify({ email: trimmedEmail })
    });

    const responseText = await upstreamRes.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (upstreamRes.ok) {
      return res.json({
        success: true,
        status: 'Success',
        message: 'Konfirmasi verifikasi berhasil dikirim!',
        instructions: 'Silakan periksa kotak masuk (Inbox) atau folder Spam pada Gmail Anda untuk menyelesaikan proses verifikasi resmi.',
        details: data
      });
    } else {
      return res.status(upstreamRes.status).json({
        success: false,
        status: 'Failed',
        message: data.message || 'Upstream server returned an error.',
        details: data
      });
    }
  } catch (err) {
    return res.status(502).json({
      success: false,
      status: 'Failed',
      message: 'Gagal menghubungi server upstream: ' + err.message
    });
  }
});

// Proxy POST /api/bulk (Bulk execution)
app.post('/api/bulk', async (req, res) => {
  const { total } = req.body;
  const numTotal = Number(total);

  if (isNaN(numTotal) || numTotal < 1) {
    return res.status(400).json({
      success: false,
      status: 'Failed',
      message: 'Total proses harus berupa angka minimal 1.'
    });
  }

  if (numTotal > 5) {
    return res.status(400).json({
      success: false,
      status: 'Failed',
      message: 'Maximum 5 processes per request.'
    });
  }

  try {
    const upstreamRes = await fetch(EXTERNAL_BULK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': EXTERNAL_API_KEY
      },
      body: JSON.stringify({ total: numTotal })
    });

    const responseText = await upstreamRes.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (upstreamRes.ok) {
      return res.json({
        success: true,
        status: 'Completed',
        message: `Eksekusi bulk sebanyak ${numTotal} proses berhasil.`,
        data
      });
    } else {
      return res.status(upstreamRes.status).json({
        success: false,
        status: 'Failed',
        message: data.message || 'Upstream bulk service error.',
        data
      });
    }
  } catch (err) {
    return res.status(502).json({
      success: false,
      status: 'Failed',
      message: 'Gagal menghubungi server bulk upstream: ' + err.message
    });
  }
});

module.exports = app;
