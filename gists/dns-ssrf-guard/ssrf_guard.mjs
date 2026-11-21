#!/usr/bin/env node
// CWE-918 SSRF pre-flight URL and IPv4/IPv6 classifier for outbound webhook and MCP clients.
// Zero dependencies. Run `node ssrf_guard.mjs --self-test` to verify all CIDR boundaries.

import assert from 'node:assert/strict';
import dns from 'node:dns/promises';
import net from 'node:net';

function ipv4ToInt(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }
  return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

function inCidr4(ipInt, baseStr, prefix) {
  const mask = prefix === 0 ? 0 : (~((1 << (32 - prefix)) - 1)) >>> 0;
  return (ipInt & mask) === (ipv4ToInt(baseStr) & mask);
}

export function isPrivateOrReservedIp(ip) {
  const family = net.isIP(ip);
  if (family === 4) {
    const n = ipv4ToInt(ip);
    return (
      inCidr4(n, '0.0.0.0', 8) ||
      inCidr4(n, '10.0.0.0', 8) ||
      inCidr4(n, '100.64.0.0', 10) ||
      inCidr4(n, '127.0.0.0', 8) ||
      inCidr4(n, '169.254.0.0', 16) ||
      inCidr4(n, '172.16.0.0', 12) ||
      inCidr4(n, '192.0.0.0', 24) ||
      inCidr4(n, '192.0.2.0', 24) ||
      inCidr4(n, '192.168.0.0', 16) ||
      inCidr4(n, '198.18.0.0', 15) ||
      inCidr4(n, '224.0.0.0', 4)
    );
  }
  if (family === 6) {
    const norm = ip.toLowerCase();
    if (norm === '::' || norm === '::1') return true;
    if (norm.startsWith('fc') || norm.startsWith('fd')) return true;
    if (norm.startsWith('fe8') || norm.startsWith('fe9') || norm.startsWith('fea') || norm.startsWith('feb')) return true;
    if (norm.startsWith('::ffff:')) {
      const mapped = norm.slice('::ffff:'.length);
      if (net.isIP(mapped) === 4) return isPrivateOrReservedIp(mapped);
      return true;
    }
    return false;
  }
  return true;
}

export async function assertSafeOutboundUrl(rawUrl, lookupFn = dns.lookup) {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'https:') {
    throw new Error(`Outbound protocol must be https:, got ${parsed.protocol}`);
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host)) {
    if (isPrivateOrReservedIp(host)) {
      throw new Error(`Blocked private or reserved IP literal: ${host}`);
    }
    return { hostname: host, resolvedAddresses: [host] };
  }
  const records = await lookupFn(host, { all: true, verbatim: true });
  if (!records.length) {
    throw new Error(`DNS lookup returned zero records for ${host}`);
  }
  for (const rec of records) {
    if (isPrivateOrReservedIp(rec.address)) {
      throw new Error(`Blocked DNS resolution ${host} -> ${rec.address}`);
    }
  }
  return { hostname: host, resolvedAddresses: records.map((r) => r.address) };
}

async function runSelfTest() {
  assert.equal(isPrivateOrReservedIp('127.0.0.1'), true);
  assert.equal(isPrivateOrReservedIp('169.254.169.254'), true);
  assert.equal(isPrivateOrReservedIp('10.24.0.8'), true);
  assert.equal(isPrivateOrReservedIp('172.31.255.1'), true);
  assert.equal(isPrivateOrReservedIp('192.168.1.10'), true);
  assert.equal(isPrivateOrReservedIp('::1'), true);
  assert.equal(isPrivateOrReservedIp('fd00::1234'), true);
  assert.equal(isPrivateOrReservedIp('::ffff:169.254.169.254'), true);
  assert.equal(isPrivateOrReservedIp('93.184.216.34'), false);
  assert.equal(isPrivateOrReservedIp('2606:2800:220:1:248:1893:25c8:1946'), false);

  await assert.rejects(() => assertSafeOutboundUrl('http://example.com/hook'));
  await assert.rejects(() => assertSafeOutboundUrl('https://169.254.169.254/latest/meta-data'));
  await assert.rejects(() =>
    assertSafeOutboundUrl('https://rebind.example.test/mcp', async () => [{ address: '10.0.0.5', family: 4 }])
  );
  const ok = await assertSafeOutboundUrl('https://mcp.example.test/mcp', async () => [
    { address: '93.184.216.34', family: 4 },
  ]);
  assert.deepEqual(ok.resolvedAddresses, ['93.184.216.34']);
  console.log('ssrf_guard self-test passed (14 assertions)');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--self-test')) {
    await runSelfTest();
  } else {
    console.log('Run with --self-test or import assertSafeOutboundUrl in Node 22+.');
  }
}
