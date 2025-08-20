import { MCPTool } from 'mcp-framework';

const BASE_URL = process.env.UNITY_RAG_BASE_URL || 'http://127.0.0.1:8000';

type Input = Record<string, never>;

export default class UnityListVersions extends MCPTool<Input> {
	name = 'unity_list_versions';
	description = 'List indexed Unity docs versions and suggested streams.';
	schema = {};

	async execute(_: Input): Promise<unknown> {
		const url = new URL('/versions', BASE_URL);
		const res = await fetch(url, { method: 'GET' });
		if (!res.ok) {
			const text = await res.text().catch(() => '');
			throw new Error(`/versions failed (${res.status}) ${text}`);
		}
		return res.json();
	}
}
