import { MCPTool } from 'mcp-framework';
import { loadIndexMarkdown } from '../lib/snippets.js';

type Input = Record<string, never>;

export default class UnitySnippetsIndex extends MCPTool<Input> {
	name = 'unity_snippets_index';
	description = 
		'Return the INDEX.md outline of curated Unity snippets (tags/categories only). ' +
		'Best first step and ideal for small context windows.';
	schema = {};

	async execute(_: Input): Promise<{ markdown: string }> {
		const markdown = await loadIndexMarkdown();
		return { markdown };
	}
}
