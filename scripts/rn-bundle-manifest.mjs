#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const rnAppDir = path.join(repoRoot, 'rn-app');
const bundleDir = path.join(repoRoot, 'frontend/ios/App/App/rn_bundle');
const bundleFile = path.join(bundleDir, 'main.jsbundle');
const sourceMapFile = path.join(bundleDir, 'main.jsbundle.map');
const manifestFile = path.join(bundleDir, 'rn-bundle-manifest.json');
const defaultPort = 8787;

export function isSafeLocalBundleUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'http:') return false;
  const host = parsed.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

export function buildBundleManifest({
  host,
  port = defaultPort,
  sha256,
  route = 'rn-demo',
  debugParams = {},
}) {
  const origin = `http://${host}:${port}`;
  return {
    type: 'dogproject-rn-bundle',
    version: 1,
    platform: 'ios',
    createdAt: new Date().toISOString(),
    bundleUrl: `${origin}/main.jsbundle`,
    sourceMapUrl: `${origin}/main.jsbundle.map`,
    manifestUrl: `${origin}/rn-bundle-manifest.json`,
    sha256,
    route,
    debugParams,
  };
}

export function buildBundleManifestDeepLink(manifest) {
  return `dogproject://rn-bundle?manifest=${encodeURIComponent(manifest.manifestUrl)}`;
}

function getLanHost() {
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  return '127.0.0.1';
}

function sha256File(filePath) {
  const hash = createHash('sha256');
  const buffer = readFileSync(filePath);
  hash.update(buffer);
  return hash.digest('hex');
}

function buildIosBundle() {
  mkdirSync(bundleDir, { recursive: true });
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'expo',
      'export:embed',
      '--platform',
      'ios',
      '--dev',
      'false',
      '--minify',
      'true',
      '--entry-file',
      'index.js',
      '--bundle-output',
      bundleFile,
      '--sourcemap-output',
      sourceMapFile,
    ],
    {
      cwd: rnAppDir,
      stdio: 'inherit',
      env: process.env,
    }
  );

  if (result.status !== 0) {
    throw new Error(`expo export:embed failed with exit code ${result.status}`);
  }
}

function safeJoinStaticPath(staticRoot, requestUrl) {
  const parsed = new URL(requestUrl, 'http://localhost');
  const requestPath = parsed.pathname === '/' ? '/rn-bundle-manifest.json' : parsed.pathname;
  const targetPath = path.normalize(path.join(staticRoot, requestPath));
  if (!targetPath.startsWith(staticRoot)) return null;
  return targetPath;
}

function serveBundleDir({ port }) {
  const server = createServer((req, res) => {
    const targetPath = safeJoinStaticPath(bundleDir, req.url || '/');
    if (!targetPath || !existsSync(targetPath) || !statSync(targetPath).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const contentType = targetPath.endsWith('.json')
      ? 'application/json; charset=utf-8'
      : targetPath.endsWith('.map')
        ? 'application/json; charset=utf-8'
        : 'application/javascript; charset=utf-8';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    });
    createReadStream(targetPath).pipe(res);
  });

  server.listen(port);
  return server;
}

function printQr(deepLink) {
  try {
    const requireFromRnApp = createRequire(path.join(rnAppDir, 'package.json'));
    const qrcode = requireFromRnApp('qrcode-terminal');
    qrcode.generate(deepLink, { small: true });
  } catch {
    console.log('QR renderer unavailable. Open this URL manually:');
  }
}

function parseArgs(argv) {
  const options = {
    host: process.env.RN_BUNDLE_HOST || getLanHost(),
    port: Number(process.env.RN_BUNDLE_PORT || defaultPort),
    route: process.env.RN_BUNDLE_ROUTE || 'rn-demo',
    serve: false,
    skipBuild: false,
  };

  argv.forEach((arg, index) => {
    if (arg === '--serve') options.serve = true;
    if (arg === '--skip-build') options.skipBuild = true;
    if (arg === '--host') options.host = argv[index + 1] || options.host;
    if (arg === '--port') options.port = Number(argv[index + 1] || options.port);
    if (arg === '--route') options.route = argv[index + 1] || options.route;
  });

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.skipBuild) {
    buildIosBundle();
  }

  const sha256 = sha256File(bundleFile);
  const manifest = buildBundleManifest({
    host: options.host,
    port: options.port,
    sha256,
    route: options.route,
  });

  if (!isSafeLocalBundleUrl(manifest.bundleUrl)) {
    throw new Error(`Refusing to publish non-local bundle URL: ${manifest.bundleUrl}`);
  }

  writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  const deepLink = buildBundleManifestDeepLink(manifest);

  console.log(`RN bundle: ${bundleFile}`);
  console.log(`Manifest: ${manifest.manifestUrl}`);
  console.log(`Deep link: ${deepLink}`);

  if (!options.serve) return;

  const server = serveBundleDir({ port: options.port });
  console.log(`Serving RN bundle at http://${options.host}:${options.port}`);
  printQr(deepLink);
  console.log('Scan the QR code inside the iOS app to load this bundle. Press Ctrl+C to stop.');

  await new Promise((resolve) => {
    process.on('SIGINT', () => {
      server.close(resolve);
    });
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
