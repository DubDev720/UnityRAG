import { MCPTool } from 'mcp-framework';
import { z } from 'zod'; import { loadSnippetsByTag } from '../lib/snippets';
export default class UnitySnippetsByTag extends MCPTool<{ tag:string }>{ name='unity_snippets_by_tag'; description='Return curated Unity snippets filtered by tag.'; schema={ tag:{type:z.string()} }; async execute({tag}){ return await loadSnippetsByTag(tag); } }
