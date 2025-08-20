import { MCPTool } from 'mcp-framework';
import { z } from 'zod';

const BASE_URL = process.env.UNITY_RAG_BASE_URL || 'http://127.0.0.1:8000';

type Input = { project_path: string };

export default class UnityDetectProjectVersion extends MCPTool<Input> {
	name = 'unity_detect_project_version';
	description = 'Read ProjectSettings/ProjectVersion.txt to extract Unity stream.';
	schema = {
		project_path: { type: z.string(), description: 'Absolute path to the Unity project root' }
	};
	
	async execute({ project_path }: Input) {
		const r = await fetch(new URL('/detect_project_version', BASE_URL), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ project_path })
		});
		if (!r.ok) throw new Error(`/detect_project_version failed (${r.status})`);
		return r.json();
	}
}
