import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {mkdirSync} from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(resolve(root, '.cache'), {recursive: true});
const python = resolve(root, process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python');
const child = spawn(python, ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', '8001', '--no-access-log'], {
  cwd: root, stdio: 'inherit', windowsHide: true,
  env: {...process.env, DATABASE_URL: `sqlite:///${resolve(root, '.cache/e2e.db').replaceAll('\\', '/')}`, ALLOWED_ORIGINS: 'http://127.0.0.1:8001', COOKIE_SECURE: 'false'},
});
process.on('SIGTERM', () => child.kill());
process.on('SIGINT', () => child.kill());
child.on('exit', code => process.exit(code ?? 0));
