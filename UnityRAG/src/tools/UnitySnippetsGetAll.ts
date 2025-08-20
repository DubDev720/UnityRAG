import { MCPTool } from 'mcp-framework';
import { loadAllSnippets } from '../lib/snippets.js';
import type { Snippet } from '../lib/snippets.js';

type Input = Record<string, never>;

export default class UnitySnippetsGetAll extends MCPTool<Input> {
	name = 'unity_snippets_get_all';
	description = 
		'Return ALL curated Unity snippets as a single array. ⚠️ Heavy for small context windows—' +
		'prefer unity_snippets_index + unity_snippets_by_tag unless you are using a very large context model.';
	schema = {};

	async execute(_: Input): Promise<Snippet[]> {
		return loadAllSnippets();
	}
}