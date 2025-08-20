import { MCPTool } from 'mcp-framework';
import { loadAllSnippets } from '../lib/snippets';
export default class UnitySnippetsGetAll extends MCPTool<Record<string,never>>{ name='unity_snippets_get_all'; description='Return all curated Unity snippets from unity_snippets.json (empty array if none).'; schema={}; async execute(){ return await loadAllSnippets(); } }
