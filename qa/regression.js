#!/usr/bin/env node
/**
 * Grub Monkeys regression suite.
 *
 * Serves the site locally (emulating Vercel's cleanUrls + the security
 * headers from vercel.json) and runs a real headless browser against every
 * page to catch the exact bug classes that have bitten this site before:
 *   - JS console/page errors on load and after scrolling
 *   - Horizontal overflow at multiple breakpoints
 *   - CSP violations (the policy must not block anything the site loads)
 *   - Franchise form validation messages + honeypot field hidden
 *   - Video controls that disable on a load failure and never re-enable
 *     (found in both the franchise vibe-check reel and the homepage
 *     Monkey TV reel — same defect class, two places)
 *   - KOT hero widget number sequencing
 *   - Sitemap/robots/favicon reachability
 *
 * Usage: node qa/regression.js
 * Exits non-zero if any check fails.
 */
const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = 8973;
const BASE = `http://localhost:${PORT}`;
const PAGES = ['/', '/menu', '/franchise', '/privacy'];
const VIEWPORTS = [
  { width: 375, height: 812, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1440, height: 900, name: 'desktop' },
];

const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "font-src 'self'; img-src 'self' data:; connect-src 'self' https://api.web3forms.com; " +
  "frame-src https://www.mixcloud.com; child-src https://www.mixcloud.com; " +
  "object-src 'none'; base-uri 'self'; form-action 'self' https://api.web3forms.com; " +
  "frame-ancestors 'self'";

const IGNORABLE_CONSOLE = /mp4|video|media|H\.264|NETWORK_NO_SOURCE|codec/i;

let failures = 0;
function check(label, ok, detail) {
  if (ok) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}${detail ? ' — ' + detail : ''}`);
  }
}

function startServer() {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    const mime = {
      '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
      '.json': 'application/json', '.xml': 'application/xml', '.png': 'image/png',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
      '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.txt': 'text/plain',
    };
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0].split('#')[0];

      if (reqPath.endsWith('.html') && reqPath !== '/index.html') {
        res.writeHead(308, { Location: reqPath.slice(0, -5) });
        return res.end();
      }
      if (reqPath === '/index.html') {
        res.writeHead(308, { Location: '/' });
        return res.end();
      }
      if (reqPath !== '/' && !path.extname(reqPath)) {
        const candidate = path.join(ROOT, reqPath + '.html');
        if (fs.existsSync(candidate)) reqPath = reqPath + '.html';
      }
      if (reqPath === '/') reqPath = '/index.html';

      const filePath = path.join(ROOT, reqPath);
      fs.readFile(filePath, (err, data) => {
        const headers = {
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'X-Frame-Options': 'SAMEORIGIN',
          'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
          'Content-Security-Policy': CSP,
        };
        if (err) {
          res.writeHead(404, headers);
          return res.end('not found');
        }
        headers['Content-Type'] = mime[path.extname(filePath)] || 'application/octet-stream';
        res.writeHead(200, headers);
        res.end(data);
      });
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

async function run() {
  const server = await startServer();
  const browser = await chromium.launch();

  try {
    // --- console errors + overflow across pages and breakpoints ---
    console.log('Console errors + horizontal overflow:');
    for (const pagePath of PAGES) {
      for (const vp of VIEWPORTS) {
        const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
        const errs = [];
        page.on('pageerror', e => errs.push('pageerror: ' + e.message));
        page.on('console', m => {
          if (m.type() === 'error' && !IGNORABLE_CONSOLE.test(m.text())) errs.push(m.text());
        });
        await page.goto(BASE + pagePath, { waitUntil: 'networkidle' });
        await page.evaluate(async () => {
          const step = innerHeight * 0.7;
          for (let y = 0; y < document.body.scrollHeight; y += step) {
            scrollTo(0, y);
            await new Promise(r => setTimeout(r, 30));
          }
        });
        await page.waitForTimeout(200);
        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
        check(`${pagePath} @ ${vp.name} — no console errors`, errs.length === 0, JSON.stringify(errs));
        check(`${pagePath} @ ${vp.name} — no horizontal overflow`, !overflow);
        await page.close();
      }
    }

    // --- CSP: confirm the policy doesn't block anything the site loads ---
    console.log('CSP violations:');
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const cspViolations = [];
      page.on('console', m => {
        if (/Content Security Policy|Refused to/i.test(m.text())) cspViolations.push(m.text());
      });
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      const iframe = await page.evaluate(() => {
        const f = document.querySelector('iframe.mixcloud-player');
        return f ? f.src : null;
      });
      check('home — Mixcloud iframe present with src', !!iframe && iframe.includes('mixcloud.com'));
      await page.waitForTimeout(500);
      check('home — no CSP violations reported', cspViolations.length === 0, JSON.stringify(cspViolations));
      await page.close();
    }

    // --- franchise form: honeypot hidden + validation message ---
    console.log('Franchise form:');
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(BASE + '/franchise', { waitUntil: 'networkidle' });
      const hpHidden = await page.evaluate(() => {
        const el = document.querySelector('#fi-company');
        if (!el) return null;
        const wrap = el.closest('.hp-field');
        const style = getComputedStyle(wrap || el);
        return style.position === 'absolute' && parseInt(style.width) <= 1;
      });
      check('honeypot field visually hidden', hpHidden === true, String(hpHidden));

      // wait out the anti-bot MIN_FILL_MS guard, then submit empty to check validation message
      await page.waitForTimeout(1400);
      await page.evaluate(() => document.querySelector('#franchiseForm').requestSubmit
        ? document.querySelector('#franchiseForm').requestSubmit()
        : document.querySelector('#franchiseForm button[type="submit"], #franchiseForm .fr-submit')?.click());
      await page.waitForTimeout(200);
      const statusText = await page.evaluate(() => {
        const el = document.querySelector('.form-status, #franchiseStatus, [id*="status" i]');
        return el ? el.textContent.trim() : null;
      });
      check('empty submit shows required-fields message', !!statusText && /required field/i.test(statusText), statusText);
      await page.close();
    }

    // --- video control disable/re-enable: franchise vibe-check reel ---
    console.log('Franchise vibe-check reel controls:');
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(BASE + '/franchise', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.querySelector('#gmFrVibeVideo').dispatchEvent(new Event('error')));
      await page.waitForTimeout(100);
      const disabledAfterError = await page.evaluate(() => document.querySelector('#gmFrVibeSound').disabled);
      await page.evaluate(() => document.querySelector('#gmFrVibeVideo').dispatchEvent(new Event('loadedmetadata')));
      await page.waitForTimeout(100);
      const reenabledAfterRecovery = await page.evaluate(() => !document.querySelector('#gmFrVibeSound').disabled);
      check('vibe-check sound button disables on error', disabledAfterError === true);
      check('vibe-check sound button re-enables on recovery', reenabledAfterRecovery === true);
      await page.close();
    }

    // --- retry-guard regression: overlapping error events must not orphan a
    // retry timer (found when the sound button kept breaking on the
    // franchise page — two error listeners firing for one real failure each
    // scheduled their own retry timer, and only the last one ever got
    // cancelled on recovery, leaving the sound button flip back to broken
    // later on its own) ---
    console.log('Vibe-check retry-guard:');
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.addInitScript(() => {
        window.__vibeLoadCalls = 0;
        document.addEventListener('DOMContentLoaded', () => {
          const v = document.getElementById('gmFrVibeVideo');
          if (v) v.load = function () { window.__vibeLoadCalls++; };
        });
      });
      await page.goto(BASE + '/franchise', { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        const v = document.querySelector('#gmFrVibeVideo');
        v.dispatchEvent(new Event('error'));
        v.querySelector('source').dispatchEvent(new Event('error'));
      });
      await page.waitForTimeout(3400);
      const loadCalls = await page.evaluate(() => window.__vibeLoadCalls);
      check('exactly one retry fires from two overlapping error events', loadCalls === 1, String(loadCalls));
      await page.close();
    }

    // --- video control disable/re-enable: homepage Monkey TV reel ---
    console.log('Homepage Monkey TV controls:');
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      const hasTv = await page.evaluate(() => !!document.querySelector('#tvSound'));
      if (hasTv) {
        await page.evaluate(() => document.querySelector('#monkeyTvVideo').dispatchEvent(new Event('error')));
        await page.waitForTimeout(100);
        const disabledAfterError = await page.evaluate(() => document.querySelector('#tvSound').disabled);
        await page.evaluate(() => document.querySelector('#monkeyTvVideo').dispatchEvent(new Event('loadedmetadata')));
        await page.waitForTimeout(100);
        const reenabledAfterRecovery = await page.evaluate(() => !document.querySelector('#tvSound').disabled);
        check('Monkey TV sound button disables on error', disabledAfterError === true);
        check('Monkey TV sound button re-enables on recovery', reenabledAfterRecovery === true);
      } else {
        check('Monkey TV controls present', false, 'element #tvSound not found');
      }
      await page.close();
    }

    // --- KOT hero widget number sequencing ---
    console.log('KOT hero widget:');
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      const hasKot = await page.evaluate(() => !!document.querySelector('#kotPrintButton'));
      if (hasKot) {
        const numbers = [];
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => document.querySelector('#kotPrintButton').click());
          await page.waitForTimeout(1300);
          numbers.push(await page.evaluate(() => document.querySelector('#kotNumber')?.textContent));
        }
        const sequential = numbers.every(n => /^#0\d{2}$/.test(n || ''));
        check('KOT numbers well-formed across prints', sequential, JSON.stringify(numbers));
      } else {
        check('KOT hero widget present', false, 'element #kotPrintButton not found');
      }
      await page.close();
    }

    // --- static assets reachability ---
    console.log('Static assets:');
    for (const asset of ['/sitemap.xml', '/robots.txt', '/favicon.ico']) {
      const page = await browser.newPage();
      const res = await page.goto(BASE + asset);
      check(`${asset} reachable (200)`, res.status() === 200, String(res.status()));
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('');
  if (failures > 0) {
    console.log(`${failures} check(s) FAILED.`);
    process.exit(1);
  } else {
    console.log('All checks passed.');
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
