'use strict';

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

const app = require('../server');

function request(server, path) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    http
      .get({ host: '127.0.0.1', port, path }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      })
      .on('error', reject);
  });
}

test('GET /health returns 200 and status ok', async () => {
  const server = app.listen(0);
  try {
    const res = await request(server, '/health');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(JSON.parse(res.body), { status: 'ok' });
  } finally {
    server.close();
  }
});

test('GET /metrics exposes prometheus metrics', async () => {
  const server = app.listen(0);
  try {
    const res = await request(server, '/metrics');
    assert.strictEqual(res.status, 200);
    assert.match(res.body, /http_requests_total/);
  } finally {
    server.close();
  }
});

test('GET / returns service metadata', async () => {
  const server = app.listen(0);
  try {
    const res = await request(server, '/');
    assert.strictEqual(res.status, 200);
    const json = JSON.parse(res.body);
    assert.ok(json.service);
    assert.ok(json.version);
  } finally {
    server.close();
  }
});
