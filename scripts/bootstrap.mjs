#!/usr/bin/env node
// Creates .env files from their examples with generated secrets. Never overwrites.
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIN_NODE = 18;

// Fail with an actionable message instead of a raw daemon error six steps later.
function preflight() {
  const problems = [];
  const major = Number(process.versions.node.split('.')[0]);

  if (major < MIN_NODE) {
    problems.push(
      `Node ${MIN_NODE}+ required, found v${process.versions.node}. Run \`nvm use\` (version is in .nvmrc).`,
    );
  }

  const run = (cmd) => {
    try {
      execSync(cmd, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };

  if (!run('docker --version')) {
    problems.push(
      'Docker is not installed. Install Docker Desktop: https://docker.com/products/docker-desktop',
    );
  } else if (!run('docker info')) {
    problems.push(
      'Docker is installed but not running. Start Docker Desktop, then re-run this command.',
    );
  } else if (!run('docker compose version')) {
    problems.push('Docker Compose v2 is required. Update Docker Desktop.');
  }

  if (problems.length) {
    console.error('Cannot continue:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
}

preflight();

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SECRET_KEYS = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET'];
const targets = ['backend', 'frontend'];

const secret = () => randomBytes(64).toString('hex');

for (const pkg of targets) {
  const env = resolve(root, pkg, '.env');
  const example = resolve(root, pkg, '.env.example');

  if (existsSync(env)) {
    console.log(`${pkg}/.env already exists, left untouched`);
    continue;
  }
  if (!existsSync(example)) {
    console.warn(`${pkg}/.env.example missing, skipped`);
    continue;
  }

  copyFileSync(example, env);

  let contents = readFileSync(env, 'utf8');
  for (const key of SECRET_KEYS) {
    contents = contents.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${secret()}`);
  }
  writeFileSync(env, contents);

  console.log(`created ${pkg}/.env`);
}

console.log(
  '\nEnvironment ready. Optional services (S3, Google OAuth, SMTP) still hold placeholders —',
);
console.log('see SETUP.md. Everything else runs without them.');
