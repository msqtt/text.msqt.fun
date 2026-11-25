import { WtopError } from '@wtop/provider';

export interface FindParams { text: string; query: string; regex?: boolean; ignoreCase?: boolean }
export interface ReplaceParams extends FindParams { replacement: string; all?: boolean }
export interface GenerateParams { mode: 'repeat' | 'lorem' | 'lines' | 'uuid'; count?: number; text?: string }
export interface TrimParams { text: string; mode: 'ends' | 'lines' | 'collapse' | 'blank' | 'spaces' }
export interface CaseParams { text: string; mode: 'upper' | 'lower' | 'title' | 'camel' | 'snake' | 'reverse' }
export interface LinesParams { text: string; op: 'dedupe' | 'sort' | 'reverse' | 'number' }

function buildRe(query: string, regex: boolean, ignoreCase: boolean, global: boolean): RegExp {
  const source = regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    return new RegExp(source, `${global ? 'g' : ''}${ignoreCase ? 'i' : ''}`);
  } catch (e) {
    throw new WtopError('INVALID_INPUT', `无效的正则表达式: ${String(e instanceof Error ? e.message : e)}`);
  }
}

export function find(p: FindParams) {
  const re = buildRe(p.query, p.regex ?? false, p.ignoreCase ?? false, true);
  const matches = [...p.text.matchAll(re)].map((m) => m[0]);
  const first = re.exec(p.text);
  return { count: matches.length, matches: matches.slice(0, 200), firstIndex: first ? first.index : -1 };
}

export function replace(p: ReplaceParams) {
  const re = buildRe(p.query, p.regex ?? false, p.ignoreCase ?? false, p.all ?? true);
  let count = 0;
  const result = p.text.replace(re, (...args) => {
    count++;
    const groups = args.slice(1, -2);
    return p.replacement.replace(/\$(\d+)|\$&/g, (tok, d) =>
      tok === '$&' ? String(args[0]) : String(groups[Number(d) - 1] ?? ''));
  });
  return { result, count };
}

const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'.split(' ');

export function generate(p: GenerateParams) {
  const count = Math.max(1, Math.min(p.count ?? 1, 10000));
  let result: string;
  switch (p.mode) {
    case 'repeat':
      result = (p.text ?? '你好，世界！\n').repeat(count);
      break;
    case 'lorem': {
      const paras: string[] = [];
      for (let i = 0; i < count; i++) {
        const words: string[] = [];
        const len = 40 + ((i * 7) % 30);
        for (let j = 0; j < len; j++) words.push(LOREM[(i * 13 + j * 5) % LOREM.length]);
        const s = words.join(' ');
        paras.push(s[0].toUpperCase() + s.slice(1) + '.');
      }
      result = paras.join('\n\n');
      break;
    }
    case 'lines':
      result = Array.from({ length: count }, (_, i) => `第 ${i + 1} 行：可回收文字工坊生成的示例文本`).join('\n');
      break;
    case 'uuid':
      result = Array.from({ length: count }, () => crypto.randomUUID()).join('\n');
      break;
  }
  return { result, length: result.length };
}

export function trim(p: TrimParams) {
  const before = p.text.length;
  let result: string;
  switch (p.mode) {
    case 'ends': result = p.text.trim(); break;
    case 'lines': result = p.text.split('\n').map((l) => l.trim()).join('\n'); break;
    case 'collapse': result = p.text.replace(/[ \t]{2,}/g, ' '); break;
    case 'blank': result = p.text.split('\n').filter((l) => l.trim() !== '').join('\n'); break;
    case 'spaces': result = p.text.replace(/\s+/g, ''); break;
  }
  return { result, removed: before - result.length };
}

export function caseTransform(p: CaseParams) {
  let result: string;
  switch (p.mode) {
    case 'upper': result = p.text.toUpperCase(); break;
    case 'lower': result = p.text.toLowerCase(); break;
    case 'title': result = p.text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()); break;
    case 'camel': result = p.text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()); break;
    case 'snake': result = p.text.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[\s-]+/g, '_').toLowerCase(); break;
    case 'reverse': result = [...p.text].reverse().join(''); break;
  }
  return { result };
}

export function lines(p: LinesParams) {
  const list = p.text.split('\n');
  let out: string[];
  switch (p.op) {
    case 'dedupe': out = [...new Set(list)]; break;
    case 'sort': out = [...list].sort((a, b) => a.localeCompare(b, 'zh')); break;
    case 'reverse': out = [...list].reverse(); break;
    case 'number': out = list.map((l, i) => `${i + 1}. ${l}`); break;
  }
  return { result: out.join('\n'), count: out.length };
}