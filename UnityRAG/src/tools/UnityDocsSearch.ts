import { MCPTool } from 'mcp-framework';
import { z } from 'zod';

const BASE_URL = process.env.UNITY_RAG_BASE_URL || 'http://127.0.0.1:8000';

type Input = { q: string; version?: string; top_k?: number };

export default class UnityDocsSearch extends MCPTool<Input> {
	name = 'unity_docs_search';
	description = 'Search local Unity offline documentation (semantic + BM25).';
	schema = {
		q: { type: z.string(), description: 'Query or API symbol (e.g., Rigidbody.AddForce)' },
		version: { type: z.string().optional(), description: 'Unity stream (e.g., 6000.2, 2022.3 (legacy))' },
		top_k: { type: z.number().int().min(1).max(50).default(8), description: 'Number of results' }
	};
	
	async execute(input: Input) {
		const u = new URL('/search', BASE_URL);
		u.searchParams.set('q', input.q);
		if (input.version) u.searchParams.set('version', input.version);
		u.searchParams.set('top_k', String(input.top_k ?? 8));
		const r = await fetch(u, { method: 'GET' });
		if (!r.ok) throw new Error(`/search failed (${r.status})`);
		return r.json();
	}
}
