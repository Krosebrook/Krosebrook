#!/usr/bin/env node
// Zero-dependency Node 22+ probe for Streamable HTTP MCP servers (2025-11-25 protocol).
// Usage:
//   node mcp_probe.mjs --self-test
//   MCP_BEARER_TOKEN=... node mcp_probe.mjs https://example.com/mcp

import assert from 'node:assert/strict';
import http from 'node:http';

export async function probeMcpEndpoint(endpointUrl, bearerToken = process.env.MCP_BEARER_TOKEN) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  const initPayload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'loxihart-mcp-probe', version: '1.0.0' },
    },
  };

  const initRes = await fetch(endpointUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(initPayload),
  });

  const initBody = await initRes.json();
  if (!initRes.ok || initBody.error) {
    throw new Error(`MCP initialize failed (${initRes.status}): ${JSON.stringify(initBody.error || initBody)}`);
  }

  const sessionId = initRes.headers.get('mcp-session-id');
  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  const listRes = await fetch(endpointUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
  });
  const listBody = await listRes.json();
  if (!listRes.ok || listBody.error) {
    throw new Error(`MCP tools/list failed (${listRes.status}): ${JSON.stringify(listBody.error || listBody)}`);
  }

  return {
    serverInfo: initBody.result?.serverInfo ?? null,
    protocolVersion: initBody.result?.protocolVersion ?? null,
    toolCount: Array.isArray(listBody.result?.tools) ? listBody.result.tools.length : 0,
    tools: (listBody.result?.tools ?? []).map((t) => t.name),
  };
}

async function runSelfTest() {
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      const msg = JSON.parse(raw);
      res.setHeader('Content-Type', 'application/json');
      if (msg.method === 'initialize') {
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            protocolVersion: '2025-11-25',
            serverInfo: { name: 'mock-mcp', version: '1.0.0' },
            capabilities: { tools: {} },
          },
        }));
        return;
      }
      if (msg.method === 'tools/list') {
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id,
          result: { tools: [{ name: 'health_check' }, { name: 'audit_repo' }] },
        }));
        return;
      }
      res.statusCode = 400;
      res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: 'Method not found' } }));
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const out = await probeMcpEndpoint(`http://127.0.0.1:${port}/mcp`, 'test-token');
    assert.equal(out.protocolVersion, '2025-11-25');
    assert.equal(out.toolCount, 2);
    assert.deepEqual(out.tools, ['health_check', 'audit_repo']);
    console.log('mcp_probe self-test passed:', JSON.stringify(out));
  } finally {
    server.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--self-test')) {
    await runSelfTest();
  } else if (process.argv[2]) {
    const result = await probeMcpEndpoint(process.argv[2]);
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.error('Usage: node mcp_probe.mjs <--self-test | https://host/mcp>');
    process.exit(2);
  }
}
