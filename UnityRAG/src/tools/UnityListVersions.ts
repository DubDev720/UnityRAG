import { MCPTool } from 'mcp-framework';
const BASE_URL = process.env.UNITY_RAG_BASE_URL || 'http://127.0.0.1:8000';
export default class UnityListVersions extends MCPTool<Record<string,never>>{ name='unity_list_versions'; description='List indexed Unity docs versions and suggested streams.'; schema={}; async execute(){ const r=await fetch(new URL('/versions', BASE_URL)); if(!r.ok) throw new Error(`/versions failed (${r.status})`); return r.json(); } }
