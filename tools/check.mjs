// Checks source with TypeScript (needs: npm i -D typescript).
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let ts;
try { ts = require('typescript'); }
catch { try { ts = require(path.join(process.env.TS_PATH || '', 'typescript')); } catch { console.error('TypeScript not found. Run: npm i -D typescript'); process.exit(2); } }

// Error codes we care about. Other type errors are ignored.
const KEEP = new Set([2304, 2552, 2305, 2614, 2459, 2724, 2307, 2448, 2451, 2300, 2539, 2540, 2632, 2349, 6133, 6196, 6198]);
const cfgPath = path.join(root, 'tsconfig.json');
const cfg = ts.readConfigFile(cfgPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, root);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const diags = ts.getPreEmitDiagnostics(program).filter(d => KEEP.has(d.code));

for (const d of diags) {
  const where = d.file ? `${path.relative(root, d.file.fileName)}:${d.file.getLineAndCharacterOfPosition(d.start).line + 1}` : '';
  console.log(`${where}  TS${d.code}  ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
}
console.log(diags.length ? `\n${diags.length} problem(s).` : `Clean: ${parsed.fileNames.length} files, no unknown names, wrong imports or unused variables.`);
process.exit(diags.length ? 1 : 0);
