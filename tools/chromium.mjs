import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';

export async function until(read, timeout = 10000) {
  const deadline = Date.now() + timeout;
  do {
    const value = await read();
    if (value) return value;
    await sleep(75);
  } while (Date.now() < deadline);
  throw new Error('Timed out waiting for Chromium or the page');
}

export async function serve(root) {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
    '.webp': 'image/webp' };
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!path.startsWith(root + sep)) throw new Error('Outside game directory');
      const bytes = await readFile(path);
      res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' });
      res.end(bytes);
    } catch {
      res.writeHead(404).end();
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

export async function chromium() {
  const profile = await mkdtemp(join(tmpdir(), 'drift-signal-'));
  const args = [
    '--headless=new', '--no-sandbox', '--window-size=1440,900', '--mute-audio',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--disable-background-networking', '--disable-component-update', '--no-first-run',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'
  ];
  const child = spawn('chromium', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  const exited = new Promise(done => child.once('close', done));
  const errors = [];
  let stderr = '';
  let socket;
  child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-3000); });
  child.on('error', error => { stderr += error.message; });

  async function close() {
    socket?.close();
    child.kill();
    await exited;
    await rm(profile, { recursive: true, force: true });
  }

  try {
    const target = await until(async () => {
      if (child.exitCode !== null || child.signalCode !== null) throw new Error('Chromium exited during startup');
      try {
        const port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
        const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
        return targets.find(entry => entry.type === 'page');
      } catch {
        return null;
      }
    });
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await once(socket, 'open', { signal: AbortSignal.timeout(10000) });
  } catch (error) {
    await close();
    throw new Error(`${error.message}\n${stderr}`);
  }

  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request?.reject(new Error(message.error.message));
      else request?.finish(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      const detail = message.params.exceptionDetails;
      errors.push(detail.exception?.description ?? detail.text);
    } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push(message.params.args.map(arg => arg.value ?? arg.description).join(' '));
    } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      errors.push(message.params.entry.text);
    }
  });
  socket.addEventListener('close', () => {
    for (const request of pending.values()) request.reject(new Error('Chromium disconnected'));
    pending.clear();
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`DevTools command timed out: ${method}`));
    }, 15000);
    pending.set(requestId, {
      finish(value) { clearTimeout(timer); resolve(value); },
      reject(error) { clearTimeout(timer); reject(error); }
    });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  async function evaluate(expression) {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
    }
    return response.result.value;
  }

  for (const domain of ['Runtime', 'Log', 'Page']) await send(domain + '.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  return { send, evaluate, errors, close };
}
