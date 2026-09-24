export interface WebsiteConfig {
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

export interface ActivityLog {
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

export interface SiteStats {
  totalVisitors: number;
  activeUsers: number;
  verifRequests: number;
  bulkRequests: number;
  successfulRequests: number;
  failedRequests: number;
  todayActivity: number;
  lastUpdated: string;
}

export interface ApiLogItem {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  message: string;
  durationMs: number;
}
