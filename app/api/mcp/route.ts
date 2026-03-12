/**
 * API: MCP Gateway - Enterprise Model Context Protocol
 * GET /api/mcp - Get gateway status, servers, stats
 * POST /api/mcp - Route requests, manage servers
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  routeRequest,
  getServers,
  getGatewayConfig,
  getGatewayStats,
  registerServer,
  updateServerStatus,
  healthCheckAll,
} from '@/lib/services/mcp-gateway';
import type { MCPCapability, MCPServerStatus } from '@/types';

export async function GET() {
  const servers = getServers();
  const config = getGatewayConfig();
  const stats = getGatewayStats();

  return NextResponse.json({
    success: true,
    data: { servers, config: { ...config, apiKeyHash: undefined }, stats },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'route': {
      const response = await routeRequest({
        serverId: body.serverId,
        capability: body.capability as MCPCapability,
        action: body.mcpAction,
        params: body.params || {},
        timeout: body.timeout || 5000,
      });
      return NextResponse.json({ success: response.success, data: response });
    }

    case 'register-server': {
      const server = registerServer({
        name: body.name,
        description: body.description,
        endpoint: body.endpoint,
        status: body.status || 'online',
        capabilities: body.capabilities,
        version: body.version || '1.0.0',
        healthCheckUrl: body.healthCheckUrl,
        lastHealthCheck: undefined,
        uptime: 100,
      });
      return NextResponse.json({ success: true, data: server });
    }

    case 'update-status': {
      const server = updateServerStatus(body.serverId, body.status as MCPServerStatus);
      if (!server) {
        return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: server });
    }

    case 'health-check': {
      const results = await healthCheckAll();
      return NextResponse.json({ success: true, data: results });
    }

    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}
