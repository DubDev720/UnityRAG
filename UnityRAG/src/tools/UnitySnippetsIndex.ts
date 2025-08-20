import { MCPTool } from 'mcp-framework';
import { loadIndexMarkdown } from '../lib/snippets';
export default class UnitySnippetsIndex extends MCPTool<Record<string,never>>{ name='unity_snippets_index'; description='Return the INDEX.md content for curated Unity snippets (placeholder if missing).'; schema={}; async execute(){ const md=await loadIndexMarkdown(); return { markdown: md }; } }
