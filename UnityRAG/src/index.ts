import 'dotenv/config';
import { MCPServer } from 'mcp-framework';
const server = new MCPServer();
server.start().catch((err) => { console.error('UnityRAG MCP server failed to start:', err); process.exit(1); });
