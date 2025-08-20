import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
const SNIPPETS_PATH = process.env.UNITY_SNIPPETS_PATH || './snippets/unity_snippets.json';
const INDEX_PATH = process.env.UNITY_SNIPPETS_INDEX_PATH || './snippets/INDEX.md';
export async function loadAllSnippets(){ try{ const p=resolve(SNIPPETS_PATH); const buf=await fs.readFile(p,'utf-8'); const data=JSON.parse(buf); return Array.isArray(data)?data:[]; }catch{return []} }
export async function loadSnippetsByTag(tag:string){ const all=await loadAllSnippets(); if(!tag) return all; return all.filter((s:any)=>Array.isArray(s?.tags)&&s.tags.includes(tag)); }
export async function loadIndexMarkdown(){ try{ const p=resolve(INDEX_PATH); return await fs.readFile(p,'utf-8'); }catch{return '# Unity Snippets Index\n\n_No INDEX.md found yet._\n'} }
