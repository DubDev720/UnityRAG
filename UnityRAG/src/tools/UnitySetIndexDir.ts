import { MCPTool } from 'mcp-framework';
import { z } from 'zod';

const BASE_URL = process.env.UNITY_RAG_BASE_URL || 'http://127.0.0.1:8000';

type Input = { index_dir: string };

export default class UnitySetIndexDir extends MCPTool<Input> {
	name = 'unity_set_index_dir';
	description = 'Point the FastAPI server at a different prebuilt index directory.';
	schema = {
		index_dir: { type: z.string(), description: 'Absolute path to existing index directory' }
	};

	async execute({ index_dir }: Input) {
		const r = await fetch(new URL('/set_index_dir', BASE_URL), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ index_dir })
		});
		if (!r.ok) throw new Error(`/set_index_dir failed (${r.status})`);
		return r.json();
	}
}
