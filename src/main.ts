import { createProvider, type Manifest } from '@wtop/provider';
import manifestJson from '../public/.well-known/wtop-manifest.json';
import { find, replace, generate, trim, caseTransform, lines } from './ops';

const manifest = manifestJson as Manifest;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const input = $<HTMLTextAreaElement>('input');
const output = $<HTMLTextAreaElement>('output');
const message = $('message');
const statusEl = $('status');

type OpName = 'find' | 'replace' | 'generate' | 'trim' | 'case' | 'lines';
let active: OpName = 'find';

const provider = createProvider({
  manifest,
  hostOrigins: [
    'https://recycle.msqt.fun',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5179',
    'http://127.0.0.1:5179',
  ],
  autoHandshake: false,
  mirror: {
    start: ({ method, params }) => {
      setActiveTab(method as OpName);
      const p = params as { text?: string };
      if (typeof p.text === 'string') {
        input.value = p.text;
        $('input-meta').textContent = `${p.text.length} 字`;
      }
      message.textContent = `HOST 调用 ${method}…`;
      message.classList.remove('err');
    },
    result: ({ method, data }) => render(method as OpName, data as Record<string, unknown>),
    error: ({ error }) => { message.textContent = `[${error.code}] ${error.message}`; message.classList.add('err'); },
  },
});

provider.registerMethod('find', async (p) => find(p as Parameters<typeof find>[0]));
provider.registerMethod('replace', async (p) => replace(p as Parameters<typeof replace>[0]));
provider.registerMethod('generate', async (p) => generate(p as Parameters<typeof generate>[0]));
provider.registerMethod('trim', async (p) => trim(p as Parameters<typeof trim>[0]));
provider.registerMethod('case', async (p) => caseTransform(p as Parameters<typeof caseTransform>[0]));
provider.registerMethod('lines', async (p) => lines(p as Parameters<typeof lines>[0]));

function collectParams(): unknown {
  const text = input.value;
  const val = (id: string) => $<HTMLInputElement>(id).value;
  const checked = (id: string) => $<HTMLInputElement>(id).checked;
  switch (active) {
    case 'find':
      return { text, query: val('find-query'), regex: checked('find-regex'), ignoreCase: checked('find-ignore') };
    case 'replace':
      return { text, query: val('rep-query'), replacement: val('rep-with'), regex: checked('rep-regex'), ignoreCase: checked('rep-ignore'), all: checked('rep-all') };
    case 'generate':
      return { mode: val('gen-mode'), count: Number(val('gen-count')) || 5, text: val('gen-text') || undefined };
    case 'trim':
      return { text, mode: val('trim-mode') };
    case 'case':
      return { text, mode: val('case-mode') };
    case 'lines':
      return { text, op: val('lines-op') };
  }
}

function render(op: OpName, r: Record<string, unknown>) {
  if (op === 'find') {
    output.value = (r.matches as string[]).join('\n');
    message.textContent = `命中 ${r.count} 处，首个位置 ${r.firstIndex}`;
  } else {
    output.value = String(r.result ?? '');
    if (op === 'replace') message.textContent = `替换 ${r.count} 处`;
    else if (op === 'trim') message.textContent = `移除 ${r.removed} 个字符`;
    else if (op === 'lines') message.textContent = `共 ${r.count} 行`;
    else if (op === 'generate') message.textContent = `生成 ${r.length} 个字符`;
    else message.textContent = '完成';
  }
  message.classList.remove('err');
  $('output-meta').textContent = `${output.value.length} 字`;
}

async function run() {
  try {
    const params = collectParams();
    const fn = { find, replace, generate, trim, case: caseTransform, lines }[active];
    render(active, fn(params as never) as Record<string, unknown>);
  } catch (e) {
    message.textContent = e instanceof Error ? e.message : String(e);
    message.classList.add('err');
  }
}

function setActiveTab(op: OpName) {
  active = op;
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', (b as HTMLElement).dataset.tab === op));
  document.querySelectorAll('.op').forEach((el) => el.classList.toggle('hidden', (el as HTMLElement).dataset.op !== op));
  message.textContent = '';
}

$('tabs').addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn?.dataset.tab) return;
  setActiveTab(btn.dataset.tab as OpName);
});

$('run').addEventListener('click', () => void run());
$('clear').addEventListener('click', () => { input.value = ''; $('input-meta').textContent = '0 字'; });
$('copy').addEventListener('click', () => void navigator.clipboard.writeText(output.value));
$('use-output').addEventListener('click', () => { input.value = output.value; $('input-meta').textContent = `${input.value.length} 字`; });
input.addEventListener('input', () => { $('input-meta').textContent = `${input.value.length} 字`; });

const inIframe = window.parent !== window;
if (inIframe) {
  void provider.start();
  const timer = setInterval(() => {
    statusEl.textContent = `WTOP: ${provider.state}`;
    statusEl.dataset.state = provider.state;
    if (provider.state === 'ready' || provider.state === 'failed') clearInterval(timer);
  }, 200);
} else {
  statusEl.textContent = '独立模式';
  statusEl.dataset.state = 'idle';
}