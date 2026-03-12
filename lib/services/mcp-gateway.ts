/**
 * MCP Gateway - Enterprise Model Context Protocol Gateway
 * Centralizes MCP servers for AI-driven autonomous management
 * of database schemas, API integrations, and security policies
 */
import { v4 as uuidv4 } from 'uuid';
import type {
  MCPServer,
  MCPServerStatus,
  MCPCapability,
  MCPGatewayConfig,
  MCPRequest,
  MCPResponse,
} from '@/types';

// ---- In-memory store ----
let gatewayConfig: MCPGatewayConfig = {
  servers: [],
  routingPolicy: 'capability-match',
  rateLimitPerMinute: 1000,
  authRequired: true,
};

const requestLog: { timestamp: number; serverId: string; capability: MCPCapability; durationMs: number }[] = [];

// ============================================================
// GATEWAY INITIALIZATION
// ============================================================

/**
 * Initialize the MCP Gateway with default server configurations.
 */
export function initializeGateway(): MCPGatewayConfig {
  const defaultServers: MCPServer[] = [
    {
      id: uuidv4(),
      name: 'Database Manager',
      description: 'Manages Prisma schema migrations, queries, and data operations',
      endpoint: '/api/mcp/database',
      status: 'online',
      capabilities: ['database'],
      version: '1.0.0',
      healthCheckUrl: '/api/mcp/database/health',
      uptime: 99.9,
      requestCount: 0,
      avgResponseMs: 45,
    },
    {
      id: uuidv4(),
      name: 'API Integration Manager',
      description: 'Manages external API connections, webhooks, and integrations',
      endpoint: '/api/mcp/integrations',
      status: 'online',
      capabilities: ['api-management'],
      version: '1.0.0',
      healthCheckUrl: '/api/mcp/integrations/health',
      uptime: 99.5,
      requestCount: 0,
      avgResponseMs: 120,
    },
    {
      id: uuidv4(),
      name: 'Security Policy Engine',
      description: 'Manages authentication, authorization, and security policies',
      endpoint: '/api/mcp/security',
      status: 'online',
      capabilities: ['security'],
      version: '1.0.0',
      healthCheckUrl: '/api/mcp/security/health',
      uptime: 99.99,
      requestCount: 0,
      avgResponseMs: 30,
    },
    {
      id: uuidv4(),
      name: 'Stream Orchestrator',
      description: 'Manages streaming infrastructure, FFmpeg workers, and CDN routing',
      endpoint: '/api/mcp/streaming',
      status: 'online',
      capabilities: ['streaming'],
      version: '1.0.0',
      healthCheckUrl: '/api/mcp/streaming/health',
      uptime: 99.7,
      requestCount: 0,
      avgResponseMs: 85,
    },
    {
      id: uuidv4(),
      name: 'Analytics Engine',
      description: 'Real-time analytics, viewer tracking, and revenue reporting',
      endpoint: '/api/mcp/analytics',
      status: 'online',
      capabilities: ['analytics'],
      version: '1.0.0',
      healthCheckUrl: '/api/mcp/analytics/health',
      uptime: 99.8,
      requestCount: 0,
      avgResponseMs: 60,
    },
    {
      id: uuidv4(),
      name: 'Content Moderator',
      description: 'AI-powered content moderation and safety enforcement',
      endpoint: '/api/mcp/moderation',
      status: 'online',
      capabilities: ['moderation'],
      version: '1.0.0',
      healthCheckUrl: '/api/mcp/moderation/health',
      uptime: 99.6,
      requestCount: 0,
      avgResponseMs: 150,
    },
    {
      id: uuidv4(),
      name: 'Translation Service',
      description: 'Real-time translation and live captioning for 80+ languages',
      endpoint: '/api/mcp/translation',
      status: 'online',
      capabilities: ['translation'],
      version: '1.0.0',
      healthCheckUrl: '/api/mcp/translation/health',
      uptime: 99.4,
      requestCount: 0,
      avgResponseMs: 200,
    },
  ];

  gatewayConfig.servers = defaultServers;
  return gatewayConfig;
}

// Initialize on module load
initializeGateway();

// ============================================================
// REQUEST ROUTING
// ============================================================

/**
 * Route a request to the appropriate MCP server based on capability.
 */
export async function routeRequest(request: MCPRequest): Promise<MCPResponse> {
  const startTime = Date.now();

  // Rate limiting
  const recentRequests = requestLog.filter(r => Date.now() - r.timestamp < 60000);
  if (recentRequests.length >= gatewayConfig.rateLimitPerMinute) {
    return {
      success: false,
      error: 'Rate limit exceeded',
      serverid: '',
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  // Find server by capability
  const server = findServer(request.capability, request.serverId);
  if (!server) {
    return {
      success: false,
      error: `No server found with capability: ${request.capability}`,
      serverid: '',
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  if (server.status === 'offline') {
    return {
      success: false,
      error: `Server ${server.name} is offline`,
      serverid: server.id,
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  // Execute the request (in production: forward to actual MCP server)
  try {
    const result = await executeAction(server, request.action, request.params);

    const processingTimeMs = Date.now() - startTime;

    // Update server stats
    server.requestCount += 1;
    server.avgResponseMs = (server.avgResponseMs * (server.requestCount - 1) + processingTimeMs) / server.requestCount;
    server.lastHealthCheck = new Date().toISOString();

    // Log request
    requestLog.push({
      timestamp: Date.now(),
      serverId: server.id,
      capability: request.capability,
      durationMs: processingTimeMs,
    });

    // Trim log
    if (requestLog.length > 10000) {
      requestLog.splice(0, 5000);
    }

    return {
      success: true,
      data: result,
      serverid: server.id,
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      serverid: server.id,
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Find the best server for a capability.
 */
function findServer(capability: MCPCapability, preferredServerId?: string): MCPServer | null {
  // Try preferred server first
  if (preferredServerId) {
    const preferred = gatewayConfig.servers.find(s => s.id === preferredServerId);
    if (preferred && preferred.capabilities.includes(capability)) {
      return preferred;
    }
  }

  // Find by capability
  const candidates = gatewayConfig.servers.filter(
    s => s.capabilities.includes(capability) && s.status !== 'offline'
  );

  if (candidates.length === 0) return null;

  switch (gatewayConfig.routingPolicy) {
    case 'round-robin': {
      // Simple round-robin based on request count
      return candidates.reduce((min, s) => s.requestCount < min.requestCount ? s : min);
    }
    case 'least-loaded': {
      // Route to server with lowest avg response time
      return candidates.reduce((min, s) => s.avgResponseMs < min.avgResponseMs ? s : min);
    }
    case 'capability-match':
    default:
      // Best uptime among capable servers
      return candidates.reduce((best, s) => s.uptime > best.uptime ? s : best);
  }
}

/**
 * Execute an action on an MCP server.
 * In production, this forwards to the actual MCP server endpoint.
 */
async function executeAction(
  server: MCPServer,
  action: string,
  params: Record<string, unknown>
): Promise<unknown> {
  // Simulated execution - in production, this calls the actual MCP server
  return {
    server: server.name,
    action,
    params,
    status: 'executed',
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// SERVER MANAGEMENT
// ============================================================

/**
 * Register a new MCP server.
 */
export function registerServer(server: Omit<MCPServer, 'id' | 'requestCount' | 'avgResponseMs'>): MCPServer {
  const full: MCPServer = {
    ...server,
    id: uuidv4(),
    requestCount: 0,
    avgResponseMs: 0,
  };
  gatewayConfig.servers.push(full);
  return full;
}

/**
 * Update server status.
 */
export function updateServerStatus(serverId: string, status: MCPServerStatus): MCPServer | null {
  const server = gatewayConfig.servers.find(s => s.id === serverId);
  if (!server) return null;
  server.status = status;
  return server;
}

/**
 * Get all registered MCP servers.
 */
export function getServers(): MCPServer[] {
  return gatewayConfig.servers;
}

/**
 * Get gateway configuration.
 */
export function getGatewayConfig(): MCPGatewayConfig {
  return { ...gatewayConfig };
}

/**
 * Update gateway configuration.
 */
export function updateGatewayConfig(updates: Partial<MCPGatewayConfig>): MCPGatewayConfig {
  gatewayConfig = { ...gatewayConfig, ...updates };
  return gatewayConfig;
}

/**
 * Health check all servers.
 */
export async function healthCheckAll(): Promise<{ serverId: string; name: string; status: MCPServerStatus; responseMs: number }[]> {
  const results = [];
  for (const server of gatewayConfig.servers) {
    const start = Date.now();
    // Simulated health check
    const responseMs = Date.now() - start;
    server.lastHealthCheck = new Date().toISOString();
    results.push({
      serverId: server.id,
      name: server.name,
      status: server.status,
      responseMs,
    });
  }
  return results;
}

/**
 * Get gateway statistics.
 */
export function getGatewayStats(): {
  totalServers: number;
  onlineServers: number;
  totalRequests: number;
  avgResponseMs: number;
  requestsPerMinute: number;
} {
  const recentRequests = requestLog.filter(r => Date.now() - r.timestamp < 60000);
  const allResponseMs = requestLog.map(r => r.durationMs);

  return {
    totalServers: gatewayConfig.servers.length,
    onlineServers: gatewayConfig.servers.filter(s => s.status === 'online').length,
    totalRequests: requestLog.length,
    avgResponseMs: allResponseMs.length > 0
      ? allResponseMs.reduce((sum, ms) => sum + ms, 0) / allResponseMs.length
      : 0,
    requestsPerMinute: recentRequests.length,
  };
}
