# MCP Server Configuration for Claude / VS Code

Use the following resource block when registering the MCP server with Claude Desktop or the VS Code Interactive panel.

```json
{
  "name": "CY Live MCP",
  "url": "https://your-mcp-server.example.com",
  "description": "MCP backend for CY Live, exposes panels and actions",
  "tools": [
    { "name": "showCommandCenterDashboard", "type": "tool" },
    { "name": "showLiveRoom", "type": "tool" },
    { "name": "showEarningsPage", "type": "tool" },
    { "name": "showCreatorStudio", "type": "tool" },
    { "name": "showDiscoverFeed", "type": "tool" },
    { "name": "showDominoArena", "type": "tool" },
    { "name": "processTip", "type": "tool", "meta": { "appOnly": true } },
    { "name": "sendChatMessage", "type": "tool", "meta": { "appOnly": true } },
    { "name": "goLive", "type": "tool", "meta": { "appOnly": true } },
    { "name": "endStream", "type": "tool", "meta": { "appOnly": true } },
    { "name": "askSwaneeAIForMessage", "type": "tool", "meta": { "appOnly": true } },
    { "name": "getStreamHealthData", "type": "tool" }
  ]
}
```
