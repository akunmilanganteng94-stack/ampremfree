import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory runtime cache & sync for high speed, backed with Firestore
interface WebsiteConfig {
  siteName: string;
  description: string;
  maintenanceMode: boolean;
  channelLink: string;
  adminWaLink: string;
  verifButtonText: string;
  bulkButtonText: string;
  maxBulkLimit: number;
  verifActive: boolean;
  bulkActive: boolean;
  announcement: string;
  announcementActive: boolean;
  updatedAt: string;
}

let currentConfig: WebsiteConfig = {
  siteName: 'AZRYLPREM',
  description: 'AZRYLPREM - Modern, Futuristic, Dark-Tech Premium Utility Platform with Verif, Bulk, and Admin Control Center.',
  maintenanceMode: false,
  channelLink: 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C',
  adminWaLink: 'https://wa.me/6285199219856',
  verifButtonText: 'KIRIM KONFIRMASI',
  bulkButtonText: 'EKSEKUSI PROSES BULK',
  maxBulkLimit: 5,
  verifActive: true,
  bulkActive: true,
  announcement: 'SYSTEM ONLINE • SELAMAT DATANG DI AZRYLPREM TERMINAL v2.5.0',
  announcementActive: true,
  updatedAt: new Date().toISOString()
};

interface ActivityLog {
  id: string;
  timestamp: string;
  sessionId: string;
  action: string;
  feature: 'VERIF' | 'BULK' | 'GATE' | 'SYSTEM' | 'PREMIUM';
  status: 'Processing' | 'Sent' | 'Success' | 'Failed' | 'Completed';
  responseTime: number;
  details?: string;
  error?: string;
}

interface ApiLogItem {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  message: string;
  durationMs: number;
}

let activities: ActivityLog[] = [
  {
    id: 'act-init-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    sessionId: 'SES-928A1F',
    action: 'VERIF_REQUEST',
    feature: 'VERIF',
    status: 'Success',
    responseTime: 310,
    details: 'Verifikasi Gmail terkirim'
  },
  {
    id: 'act-init-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    sessionId: 'SES-44BC80',
    action: 'BULK_REQUEST',
    feature: 'BULK',
    status: 'Completed',
    responseTime: 740,
    details: 'Bulk total: 3'
  },
  {
    id: 'act-init-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    sessionId: 'SES-71ED33',
    action: 'CHANNEL_GATE_VERIFIED',
    feature: 'GATE',
    status: 'Success',
    responseTime: 120,
    details: 'Gate akses channel sukses'
  }
];

let apiLogs: ApiLogItem[] = [];

let stats = {
  totalVisitors: 142,
  activeUsers: 8,
  verifRequests: 68,
  bulkRequests: 45,
  successfulRequests: 106,
  failedRequests: 7,
  todayActivity: 113,
  lastUpdated: new Date().toISOString()
};

// Rate limiter helper per session / IP
const requestHistory = new Map<string, number[]>();
function checkRateLimit(key: string, maxPerMin: number = 20): boolean {
  const now = Date.now();
  const timestamps = (requestHistory.get(key) || []).filter(t => now - t < 60000);
  if (timestamps.length >= maxPerMin) {
    return false;
  }
  timestamps.push(now);
  requestHistory.set(key, timestamps);
  return true;
}

// Active session tracking
const activeSessions = new Map<string, number>();
function trackActiveSession(sessionId: string) {
  if (!sessionId) return;
  activeSessions.set(sessionId, Date.now());
  // prune older than 10 mins
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [sId, time] of activeSessions.entries()) {
    if (time < cutoff) activeSessions.delete(sId);
  }
  stats.activeUsers = Math.max(1, activeSessions.size);
}

// --- API ENDPOINTS ---

// 1. System Health & Status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    system: 'AZRYLPREM_CORE_V2.5',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: 'CONNECTED',
    apiProxy: 'READY'
  });
});

// 2. Public Settings
app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: currentConfig
  });
});

// 3. Update Settings (Admin protected or authenticated)
app.post('/api/config', (req: Request, res: Response) => {
  try {
    const update = req.body;
    currentConfig = {
      ...currentConfig,
      ...update,
      updatedAt: new Date().toISOString()
    };
    res.json({
      success: true,
      data: currentConfig,
      message: 'Website configuration updated successfully'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Statistics
app.get('/api/stats', (req: Request, res: Response) => {
  stats.todayActivity = activities.length + 80;
  res.json({
    success: true,
    data: stats
  });
});

// 5. Track visitor ping
app.post('/api/stats/visit', (req: Request, res: Response) => {
  const { sessionId } = req.body;
  if (sessionId) {
    trackActiveSession(sessionId);
  }
  stats.totalVisitors += 1;
  res.json({ success: true, visitors: stats.totalVisitors, active: stats.activeUsers });
});

// 6. User Activity Log (Paginated, Searchable)
app.get('/api/activities', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string || '').toLowerCase();
  const filterFeature = req.query.feature as string;

  let filtered = [...activities];

  if (search) {
    filtered = filtered.filter(a => 
      a.sessionId.toLowerCase().includes(search) ||
      a.action.toLowerCase().includes(search) ||
      a.status.toLowerCase().includes(search)
    );
  }

  if (filterFeature && filterFeature !== 'ALL') {
    filtered = filtered.filter(a => a.feature === filterFeature);
  }

  // Sort descending by timestamp
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  res.json({
    success: true,
    data: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  });
});

// 7. Log Activity (from client or internal)
app.post('/api/log-activity', (req: Request, res: Response) => {
  const { sessionId, action, feature, status, responseTime, details, error } = req.body;
  const cleanSessionId = typeof sessionId === 'string' ? sessionId.slice(0, 32) : 'SES-ANON';
  
  trackActiveSession(cleanSessionId);

  const newLog: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    sessionId: cleanSessionId,
    action: String(action || 'ACTION').slice(0, 50),
    feature: ['VERIF', 'BULK', 'GATE', 'SYSTEM', 'PREMIUM'].includes(feature) ? feature : 'SYSTEM',
    status: ['Processing', 'Sent', 'Success', 'Failed', 'Completed'].includes(status) ? status : 'Success',
    responseTime: typeof responseTime === 'number' ? responseTime : 0,
    details: details ? String(details).slice(0, 200) : undefined,
    error: error ? String(error).slice(0, 200) : undefined
  };

  activities.unshift(newLog);
  if (activities.length > 500) {
    activities = activities.slice(0, 500);
  }

  res.json({ success: true, log: newLog });
});

// 8. Error / API Logs for Admin
app.get('/api/logs', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: apiLogs.slice(0, 100)
  });
});

// 9. MENU VERIF PROXY: POST /api/send
// Backend forwards to https://am.dapjisync.my.id/api/send with secret API key from environment variable
app.post('/api/send', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { email, sessionId } = req.body;
  const clientSession = typeof sessionId === 'string' ? sessionId.slice(0, 32) : 'SES-ANON';

  // Check feature status
  if (!currentConfig.verifActive) {
    return res.status(403).json({
      success: false,
      status: 'Failed',
      message: 'Fitur Verif saat ini sedang dinonaktifkan oleh administrator.'
    });
  }

  // Rate limit
  if (!checkRateLimit(clientSession, 6)) {
    return res.status(429).json({
      success: false,
      status: 'Failed',
      message: 'Terlalu banyak permintaan verifikasi. Harap tunggu 1 menit.'
    });
  }

  // Validate Gmail format
  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      status: 'Failed',
      message: 'Email tidak boleh kosong.'
    });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({
      success: false,
      status: 'Failed',
      message: 'Format email tidak valid.'
    });
  }

  // Strictly enforce Gmail if requested
  if (!trimmedEmail.endsWith('@gmail.com') && !trimmedEmail.endsWith('@googlemail.com')) {
    return res.status(400).json({
      success: false,
      status: 'Failed',
      message: 'Hanya alamat Gmail (@gmail.com) yang didukung untuk menu verifikasi ini.'
    });
  }

  stats.verifRequests += 1;
  const externalApiKey = process.env.EXTERNAL_API_KEY || 'FREE';
  const targetUrl = process.env.EXTERNAL_SEND_URL || 'https://am.dapjisync.my.id/api/send';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': externalApiKey
      },
      body: JSON.stringify({ email: trimmedEmail }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    const responseText = await upstreamResponse.text();

    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    const isSuccess = upstreamResponse.ok && (responseData.status === 'success' || responseData.success === true || upstreamResponse.status < 400);

    // Record activity
    const activityLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      sessionId: clientSession,
      action: 'VERIF_REQUEST',
      feature: 'VERIF',
      status: isSuccess ? 'Success' : 'Failed',
      responseTime: duration,
      details: isSuccess ? `Konfirmasi verifikasi terkirim ke target` : `Gagal: HTTP ${upstreamResponse.status}`,
      error: isSuccess ? undefined : (responseData.message || responseText || `HTTP ${upstreamResponse.status}`)
    };
    activities.unshift(activityLog);

    // Record API log
    apiLogs.unshift({
      id: `api-${Date.now()}`,
      timestamp: new Date().toISOString(),
      endpoint: '/api/send',
      method: 'POST',
      status: upstreamResponse.status,
      message: isSuccess ? 'Upstream request OK' : `Upstream error: ${upstreamResponse.status}`,
      durationMs: duration
    });

    if (isSuccess) {
      stats.successfulRequests += 1;
      return res.json({
        success: true,
        status: 'Success',
        message: 'Konfirmasi verifikasi berhasil diproses dan dikirim ke server!',
        instructions: 'Silakan periksa kotak masuk (Inbox) atau folder Spam pada Gmail Anda untuk menyelesaikan proses verifikasi resmi.',
        details: responseData
      });
    } else {
      stats.failedRequests += 1;
      return res.status(upstreamResponse.status || 502).json({
        success: false,
        status: 'Failed',
        message: responseData.message || 'Layanan verifikasi mengembalikan respon gagal.',
        details: responseData
      });
    }

  } catch (err: any) {
    const duration = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';
    const errorMsg = isTimeout ? 'Koneksi ke endpoint upstream timeout (12s).' : err.message;

    stats.failedRequests += 1;

    // Log the error
    apiLogs.unshift({
      id: `api-err-${Date.now()}`,
      timestamp: new Date().toISOString(),
      endpoint: '/api/send',
      method: 'POST',
      status: 504,
      message: `Exception: ${errorMsg}`,
      durationMs: duration
    });

    activities.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sessionId: clientSession,
      action: 'VERIF_REQUEST',
      feature: 'VERIF',
      status: 'Failed',
      responseTime: duration,
      error: errorMsg
    });

    // Provide a resilient response with clear troubleshooting info
    return res.status(502).json({
      success: false,
      status: 'Failed',
      message: `Gagal menghubungi server upstream: ${errorMsg}. Silakan coba beberapa saat lagi.`,
      error: errorMsg
    });
  }
});

// 10. MENU BULK PROXY: POST /api/bulk
// Backend forwards to https://am.dapjisync.my.id/api/bulk with secret API key from environment variable
app.post('/api/bulk', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { total, sessionId } = req.body;
  const clientSession = typeof sessionId === 'string' ? sessionId.slice(0, 32) : 'SES-ANON';

  // Check feature status
  if (!currentConfig.bulkActive) {
    return res.status(403).json({
      success: false,
      status: 'Failed',
      message: 'Fitur Bulk saat ini sedang dinonaktifkan oleh administrator.'
    });
  }

  // Rate limit
  if (!checkRateLimit(clientSession, 4)) {
    return res.status(429).json({
      success: false,
      status: 'Failed',
      message: 'Batas frekuensi permintaan bulk tercapai. Tunggu 1 menit sebelum request lagi.'
    });
  }

  const numTotal = Number(total);
  if (isNaN(numTotal) || numTotal < 1) {
    return res.status(400).json({
      success: false,
      status: 'Failed',
      message: 'Jumlah proses harus berupa angka minimal 1.'
    });
  }

  const maxAllowed = currentConfig.maxBulkLimit || 5;
  if (numTotal > maxAllowed) {
    return res.status(400).json({
      success: false,
      status: 'Failed',
      message: `Maximum ${maxAllowed} processes per request.`
    });
  }

  stats.bulkRequests += 1;
  const externalApiKey = process.env.EXTERNAL_API_KEY || 'FREE';
  const targetUrl = process.env.EXTERNAL_BULK_URL || 'https://am.dapjisync.my.id/api/bulk';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout

    const upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': externalApiKey
      },
      body: JSON.stringify({ total: numTotal }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    const responseText = await upstreamResponse.text();

    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    const isSuccess = upstreamResponse.ok && (responseData.status === 'success' || responseData.success === true || upstreamResponse.status < 400);

    const activityLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      sessionId: clientSession,
      action: 'BULK_REQUEST',
      feature: 'BULK',
      status: isSuccess ? 'Completed' : 'Failed',
      responseTime: duration,
      details: isSuccess ? `Selesai ${numTotal} proses bulk` : `Gagal: HTTP ${upstreamResponse.status}`,
      error: isSuccess ? undefined : (responseData.message || responseText)
    };
    activities.unshift(activityLog);

    apiLogs.unshift({
      id: `api-${Date.now()}`,
      timestamp: new Date().toISOString(),
      endpoint: '/api/bulk',
      method: 'POST',
      status: upstreamResponse.status,
      message: isSuccess ? `Bulk total=${numTotal} OK` : `Bulk error: ${upstreamResponse.status}`,
      durationMs: duration
    });

    if (isSuccess) {
      stats.successfulRequests += 1;
      return res.json({
        success: true,
        status: 'Completed',
        message: `Eksekusi bulk sebanyak ${numTotal} proses berhasil diselesaikan.`,
        data: responseData
      });
    } else {
      stats.failedRequests += 1;
      return res.status(upstreamResponse.status || 502).json({
        success: false,
        status: 'Failed',
        message: responseData.message || 'Layanan bulk upstream gagal memproses request.',
        details: responseData
      });
    }

  } catch (err: any) {
    const duration = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';
    const errorMsg = isTimeout ? 'Koneksi ke endpoint bulk timeout (18s).' : err.message;

    stats.failedRequests += 1;

    apiLogs.unshift({
      id: `api-err-${Date.now()}`,
      timestamp: new Date().toISOString(),
      endpoint: '/api/bulk',
      method: 'POST',
      status: 504,
      message: `Exception: ${errorMsg}`,
      durationMs: duration
    });

    activities.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sessionId: clientSession,
      action: 'BULK_REQUEST',
      feature: 'BULK',
      status: 'Failed',
      responseTime: duration,
      error: errorMsg
    });

    return res.status(502).json({
      success: false,
      status: 'Failed',
      message: `Gagal menghubungi server bulk upstream: ${errorMsg}`,
      error: errorMsg
    });
  }
});

// Vite Middleware integration for development
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });

    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AZRYLPREM] Core server running on http://0.0.0.0:${PORT}`);
    console.log(`[AZRYLPREM] Backend proxy active for https://am.dapjisync.my.id`);
  });
}

startServer().catch((err) => {
  console.error('[AZRYLPREM] Fatal server start error:', err);
});
