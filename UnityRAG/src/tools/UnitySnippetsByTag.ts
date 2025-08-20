import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
// NOTE: .js extension in the import is intentional (ESM-friendly at runtime)
import { loadSnippetsByTag } from '../lib/snippets.js';
import type { Snippet } from '../lib/snippets.js';

type Input = { tag: string };

export default class UnitySnippetsByTag extends MCPTool<Input> {
	name = 'unity_snippets_by_tag';
	description = 
		'Return curated Unity snippets for a single tag (e.g., "physics", "ui", "performance"). ' +
		'Recommended for most assistants—targeted and context-friendly.';
	schema = {
		tag: { type: z.string(), description: 'Tag/category to filter by (see unity_snippets_index).' }
	};
	
	async execute({ tag }: Input): Promise<Snippet[]> {
		return await loadSnippetsByTag(tag);
	}
}
