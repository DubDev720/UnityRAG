// src/lib/snippets.ts
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

/** Env-configurable paths */
const SNIPPETS_PATH = process.env.UNITY_SNIPPETS_PATH || './snippets/unity_snippets.json';
const INDEX_PATH = process.env.UNITY_SNIPPETS_INDEX_PATH || './snippets/INDEX.md';

/**
 * Version string accepted:
 *  - Exact 6.x:           "6000.0", "6000.1"
 *  - Open range:          "6000.2+"
 *  - Closed range:        "6000.0–6000.2" (en dash) or "6000.0-6000.2"
 *  - Legacy tag:          "2022.3 (legacy)"
 */
const versionPattern =
	/^(?:6000\.\d+(?:\+|(?:[\u2013-]6000\.\d+)?)|2022\.3(?: \(legacy\))?)$/;

/** Snippet schema */
export const SnippetSchema = z.object({
	title: z.string().min(1),
	tags: z.array(z.string().min(1)).min(1),
	unity_versions: z.array(
		z.string().min(1).regex(versionPattern, {
			message:
			'Version must look like "6000.2", "6000.2+", "6000.0–6000.2", or "2022.3 (legacy)"'
		})
	).min(1),
	code_good: z.string().min(1),
	code_bad: z.string().optional(),
	explanation: z.string().min(1),
	performance_impact: z.enum(['low', 'medium', 'high']),
	complexity: z.enum(['beginner', 'intermediate', 'advanced']),
	references: z.array(z.string().url()).optional()
});

export type Snippet = z.infer<typeof SnippetSchema>;
const SnippetArraySchema = z.array(SnippetSchema);

/** Internal: read file safely */
async function readFileUtf8(filePath: string): Promise<string | null> {
	try {
		return await fs.readFile(resolve(filePath), 'utf-8');
	} catch {
		return null;
	}
}

/** Load and validate ALL snippets. */
export async function loadAllSnippets(): Promise<Snippet[]> {
	const raw = await readFileUtf8(SNIPPETS_PATH);
	if (raw == null) return [];

	let json: unknown;
	try {
		json = JSON.parse(raw);
	} catch (err) {
		console.error(`[UnityRAG] Failed to parse JSON at ${SNIPPETS_PATH}:`, err);
		return [];
	}

	const parsed = SnippetArraySchema.safeParse(json);
	if (!parsed.success) {
		console.error(`[UnityRAG] Snippet validation failed for ${SNIPPETS_PATH}:`);
		parsed.error.issues.slice(0, 5).forEach((i, idx) => {
		console.error(`  ${idx + 1}. ${i.path.join('.') || '(root)'} — ${i.message}`);
		});
		if (parsed.error.issues.length > 5) {
			console.error(`  ...and ${parsed.error.issues.length - 5} more issue(s).`);
		}
		return [];
	}

	return parsed.data;
}

/** Load snippets filtered by tag (validated). */
export async function loadSnippetsByTag(tag: string): Promise<Snippet[]> {
	const all = await loadAllSnippets();
		if (!tag) return all;
	return all.filter((s) => s.tags.includes(tag));
}

/** Load INDEX.md (human-facing list). */
export async function loadIndexMarkdown(): Promise<string> {
	const raw = await readFileUtf8(INDEX_PATH);
	if (raw == null) {
		return '# Unity Snippets Index\n\n_No INDEX.md found yet. Drop one into ./snippets/INDEX.md_\n';
	}
	return raw;
}
