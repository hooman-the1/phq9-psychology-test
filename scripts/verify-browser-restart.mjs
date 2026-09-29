// Run after `npm run build`. Uses a dedicated persistent Edge profile in the OS temp directory.
// Override EDGE_PATH if Edge is installed elsewhere.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = 'http://127.0.0.1:4236';
const debugOrigin = 'http://127.0.0.1:9236';
const edgePath = process.env.EDGE_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profile = mkdtempSync(join(tmpdir(), 'phq9-issue36-'));
const server = spawn('python', ['-m', 'http.server', '4236', '--bind', '127.0.0.1', '--directory', 'dist/phq9/browser'], { stdio: 'ignore' });
let browser;
let socket;
let sequence = 0;
let nextId = 0;
const pending = new Map();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function until(action, timeout = 10000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try { return await action(); } catch { await pause(100); }
  }
  throw new Error('Timed out waiting for server or browser');
}

async function browserOpen() {
  browser = spawn(edgePath, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`, '--remote-debugging-port=9236', origin,
  ], { stdio: 'ignore' });
  const version = await until(async () => {
    const response = await fetch(`${debugOrigin}/json/version`);
    assert.ok(response.ok);
    return response.json();
  });
  const tabs = await until(async () => {
    const response = await fetch(`${debugOrigin}/json/list`);
    const pages = await response.json();
    const tab = pages.find((page) => page.type === 'page' && page.url.startsWith(origin));
    assert.ok(tab);
    return tab;
  });
  socket = new WebSocket(tabs.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const entry = pending.get(message.id);
    pending.delete(message.id);
    message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
  });
  await send('Page.enable');
  await until(async () => assert.equal(await evaluate('document.readyState'), 'complete'));
  await until(async () => assert.ok(await evaluate('document.querySelector("main") !== null')));
  console.log(JSON.stringify({ step: `browser-open-${++sequence}`, browser: version.Browser, origin, profile, pid: browser.pid }));
}

function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

async function browserClose() {
  const browserSocket = new WebSocket((await fetch(`${debugOrigin}/json/version`).then((r) => r.json())).webSocketDebuggerUrl);
  await new Promise((resolve) => browserSocket.addEventListener('open', resolve, { once: true }));
  browserSocket.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
  await until(async () => assert.equal(browser.exitCode === null, false));
  await until(async () => {
    let available = false;
    try { available = (await fetch(`${debugOrigin}/json/version`)).ok; } catch { /* closed */ }
    assert.equal(available, false);
  });
  socket.close();
  browserSocket.close();
  console.log(JSON.stringify({ step: `browser-process-exited-${sequence}`, pid: browser.pid, exitCode: browser.exitCode }));
}

async function click(selector) {
  const found = await evaluate(`(() => { const item = document.querySelector(${JSON.stringify(selector)}); item?.click(); return !!item; })()`);
  assert.ok(found, `Missing control ${selector}`);
  await pause(60);
}

async function snapshot(step) {
  const state = await evaluate(`(() => ({
    raw: localStorage.getItem('phq9.assessments'),
    rows: [...document.querySelectorAll('.history-list > li')].map(x => ({
      id: x.dataset.recordId, datetime: x.querySelector('time')?.dateTime,
      text: x.innerText
    })),
    empty: document.querySelector('.history-empty')?.innerText ?? null,
    result: document.querySelector('.result-card')?.innerText ?? null,
    saveError: document.querySelector('.result-card .validation-error')?.innerText ?? null,
    detail: document.querySelector('.detail-view')?.innerText ?? null,
    detailTime: document.querySelector('.detail-view time')?.dateTime ?? null,
    detailAnswers: [...document.querySelectorAll('.detail-answers > li')].map(x => x.innerText),
    detailWarnings: [...document.querySelectorAll('.detail-warning')].map(x => x.innerText),
    detailInputCount: document.querySelectorAll('.detail-view input').length,
    actions: [...document.querySelectorAll('.history-view button, .detail-view button')].map(x => x.className || x.innerText),
    dialog: document.querySelector('[role=alertdialog]')?.innerText ?? null
  }))()`);
  console.log(JSON.stringify({ step, ...state }));
  return state;
}

async function openHistory() { await click('.assessment-view > .button-group > button, .result-history-action'); }

async function complete(answers) {
  const questions = [];
  const labels = [];
  for (let index = 0; index < 9; index++) {
    const visible = await evaluate(`(() => ({ question: document.querySelector('.question')?.innerText, labels: [...document.querySelectorAll('fieldset label')].map(x => x.innerText) }))()`);
    questions.push(visible.question);
    labels.push(visible.labels[answers[index]]);
    await click(`fieldset input[value="${answers[index]}"]`);
    await click(index === 8 ? '.submit-action' : '.primary-action');
  }
  return { questions, labels };
}

function checkHistory(state, records) {
  assert.equal(state.rows.length, records.length);
  const sorted = [...records].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  assert.deepEqual(state.rows.map((row) => row.id), sorted.map((record) => record.id));
  for (let i = 0; i < sorted.length; i++) {
    assert.equal(state.rows[i].datetime, sorted[i].createdAt);
    assert.ok(state.rows[i].text.includes(sorted[i].result.severityLabel));
    assert.ok(state.rows[i].text.includes(String(sorted[i].totalScore).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])));
  }
}

function checkDetail(state, record, captured) {
  assert.equal(state.detailAnswers.length, 9);
  assert.equal(state.detailTime, record.createdAt);
  assert.equal(state.detailInputCount, 0);
  assert.deepEqual(state.detailWarnings, record.result.warnings);
  assert.ok(state.detail.includes(record.result.severityLabel));
  assert.ok(state.detail.includes(record.result.recommendation));
  assert.ok(state.detail.includes(record.severityCategory));
  assert.ok(state.detail.includes(String(record.totalScore).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])));
  for (const warning of record.result.warnings) assert.ok(state.detail.includes(warning));
  for (let i = 0; i < 9; i++) {
    assert.ok(state.detailAnswers[i].includes(captured.questions[i].replace(/^\S+\s*/, '')));
    assert.ok(state.detailAnswers[i].includes(captured.labels[i]));
    assert.ok(state.detailAnswers[i].includes('۰۱۲۳'[record.answers[i]]));
  }
  assert.equal(state.actions.some((action) => /submit|delete-confirm|clear-confirm/.test(action)), false);
}

try {
  await until(async () => assert.ok((await fetch(origin)).ok));
  assert.equal(server.exitCode, null, 'Static server did not start on the fixed origin');
  await browserOpen();
  const initial = await snapshot('initial');
  assert.equal(initial.raw, null);
  const answerSets = [[0, 1, 0, 1, 0, 1, 0, 1, 0], [3, 2, 3, 2, 3, 2, 3, 2, 0]];
  const expected = [[4, 'minimal'], [20, 'severe']];
  const captures = [];
  for (let i = 0; i < 2; i++) {
    captures.push(await complete(answerSets[i]));
    const result = await snapshot(`saved-result-${i + 1}`);
    assert.ok(result.result);
    assert.equal(result.saveError, null);
    const envelope = JSON.parse(result.raw);
    assert.equal(envelope.schemaVersion, 1);
    assert.equal(envelope.records.length, i + 1);
    const saved = envelope.records[i];
    assert.deepEqual(saved.answers, answerSets[i]);
    assert.equal(saved.totalScore, expected[i][0]);
    assert.equal(saved.severityCategory, expected[i][1]);
    assert.ok(result.result.includes(saved.result.severityLabel));
    if (i === 0) await click('.restart-action');
  }
  await openHistory();
  const before = await snapshot('history-before-close');
  const original = JSON.parse(before.raw);
  checkHistory(before, original.records);
  assert.notEqual(original.records[0].id, original.records[1].id);
  await browserClose();

  await browserOpen();
  await openHistory();
  const reopened = await snapshot('history-after-first-reopen');
  assert.equal(reopened.raw, before.raw);
  assert.deepEqual(reopened.rows, before.rows);
  checkHistory(reopened, original.records);
  const byId = new Map(original.records.map((record, index) => [record.id, captures[index]]));
  for (const row of reopened.rows) {
    await click(`.history-list > li[data-record-id="${row.id}"] button:first-of-type`);
    const detail = await snapshot(`detail-${row.id}`);
    checkDetail(detail, original.records.find((record) => record.id === row.id), byId.get(row.id));
    assert.equal(detail.raw, before.raw);
    await click('.detail-view button');
    assert.equal((await snapshot(`after-detail-${row.id}`)).raw, before.raw);
  }
  const selected = original.records[1].id;
  await click(`.history-list > li[data-record-id="${selected}"] .history-delete`);
  assert.ok((await snapshot('delete-confirmation')).dialog);
  await click('.delete-cancel');
  const deleteCancelled = await snapshot('delete-cancelled');
  assert.equal(deleteCancelled.raw, before.raw);
  checkHistory(deleteCancelled, original.records);
  await click(`.history-list > li[data-record-id="${selected}"] .history-delete`);
  await click('.delete-confirm');
  const deleted = await snapshot('delete-confirmed');
  const survivor = original.records.find((record) => record.id !== selected);
  assert.deepEqual(JSON.parse(deleted.raw), { schemaVersion: 1, records: [survivor] });
  checkHistory(deleted, [survivor]);
  await browserClose();

  await browserOpen();
  await openHistory();
  const secondReopen = await snapshot('history-after-second-reopen');
  assert.equal(secondReopen.raw, deleted.raw);
  assert.deepEqual(secondReopen.rows, deleted.rows);
  checkHistory(secondReopen, [survivor]);
  await click('.history-clear');
  assert.ok((await snapshot('clear-confirmation')).dialog);
  await click('.clear-cancel');
  const clearCancelled = await snapshot('clear-cancelled');
  assert.equal(clearCancelled.raw, deleted.raw);
  checkHistory(clearCancelled, [survivor]);
  await click('.history-clear');
  await click('.clear-confirm');
  const cleared = await snapshot('clear-confirmed');
  assert.equal(cleared.raw, '{"schemaVersion":1,"records":[]}');
  assert.ok(cleared.empty);
  assert.equal(cleared.rows.length, 0);
  await browserClose();

  await browserOpen();
  await openHistory();
  const emptyReopen = await snapshot('history-after-third-reopen');
  assert.equal(emptyReopen.raw, cleared.raw);
  assert.ok(emptyReopen.empty);
  assert.equal(emptyReopen.rows.length, 0);
  assert.equal(emptyReopen.actions.some((action) => /history-delete|history-clear/.test(action)), false);
  console.log(JSON.stringify({ step: 'PASS' }));
} finally {
  if (browser?.exitCode === null) {
    try { await browserClose(); } catch { browser.kill(); }
  }
  server.kill();
}
