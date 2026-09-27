// Run a static server for dist/phq9/browser on port 4201 and headless Edge with
// remote debugging on port 9223 before starting this browser verification.
// Screenshots are saved under the OS temporary directory as phq9-*.png.
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tabs = await fetch('http://127.0.0.1:9223/json/list').then((response) => response.json());
const tab = tabs.find((item) => item.type === 'page');
if (!tab) throw new Error('No Edge page target');
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let nextId = 0;
const pending = new Map();
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (!message.id) return;
  const entry = pending.get(message.id);
  if (!entry) return;
  pending.delete(message.id);
  message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
});
function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
const wait = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));
async function screenshot(name) {
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  const path = join(tmpdir(), `phq9-${name}.png`);
  writeFileSync(path, Buffer.from(shot.data, 'base64'));
  console.log('screenshot', name, path);
}
async function clickButton(label) {
  const found = await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === ${JSON.stringify(label)}); if (!b) return false; b.click(); return true; })()`);
  if (!found) throw new Error(`Button missing: ${label}`);
  await wait();
}
async function state(name) {
  const result = await evaluate(`(() => ({ text: document.querySelector('main')?.innerText, replacement: document.body.innerText.includes('\uFFFD'), title: document.title }))()`);
  assert.equal(result.replacement, false, `Replacement character in ${name}`);
  assert.equal(result.title, 'PHQ-9');
  assert.ok(result.text, `Empty main text in ${name}`);
  console.log('state', name, `characters=${result.text.length}`, 'replacement=false');
  await screenshot(name);
  return result.text;
}
async function complete(answers) {
  for (let index = 0; index < answers.length; index++) {
    const selected = await evaluate(`(() => { const x = document.querySelectorAll('input[type=radio]')[${answers[index]}]; if (!x) return false; x.click(); return true; })()`);
    if (!selected) throw new Error(`Radio missing at question ${index + 1}`);
    await wait(30);
    await clickButton(index === 8 ? 'ثبت پاسخ‌ها' : 'بعدی');
  }
}
await send('Page.enable');
await send('Page.navigate', { url: 'http://127.0.0.1:4201/' });
await wait(800);
await evaluate(`localStorage.removeItem('phq9.assessments')`);
await send('Page.reload', { ignoreCache: true });
await wait(800);
await state('questionnaire');
await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'بعدی'); b?.click(); return true; })()`);
await state('question-2');
await clickButton('قبلی');
await complete([3,3,3,3,3,3,3,3,3]);
await state('severe-result');
await clickButton('تاریخچه آزمون‌ها');
await state('history');
await clickButton('نمایش جزئیات');
const detailBeforeRefresh = await state('detail');
await send('Page.reload', { ignoreCache: true });
await wait(800);
await clickButton('تاریخچه آزمون‌ها');
await clickButton('نمایش جزئیات');
const detailAfterRefresh = await state('detail-after-refresh');
assert.equal(detailAfterRefresh, detailBeforeRefresh, 'Saved detail changed after refresh');
await clickButton('بازگشت به تاریخچه');
await clickButton('بازگشت به آزمون');
for (let index = 0; index < 8; index++) await clickButton('بعدی');
await clickButton('ثبت پاسخ‌ها');
await state('validation');
for (const [name, score, severity, recommendation] of [
  ['minimal', 0, 'حداقل افسردگی', 'نیازی به اقدام خاصی نیست، اما مراقب حال و هوای خود باشید.'],
  ['mild', 5, 'افسردگی خفیف', 'تغییرات خلق خود را زیر نظر بگیرید و در صورت نیاز با یک دوست یا مشاور صحبت کنید.'],
  ['moderate', 10, 'افسردگی متوسط', 'صحبت با یک روانشناس یا مشاور توصیه می‌شود.'],
  ['moderately-severe', 15, 'افسردگی نسبتاً شدید', 'به شدت توصیه می‌شود از یک متخصص سلامت روان کمک بگیرید.'],
  ['severe', 20, 'افسردگی شدید', 'نیاز فوری به مداخله تخصصی روانشناسی یا روانپزشکی وجود دارد.'],
]) {
  const answers = Array(9).fill(0);
  for (let index = 0, remaining = score; index < 9 && remaining > 0; index++) {
    answers[index] = Math.min(3, remaining);
    remaining -= answers[index];
  }
  await complete(answers);
  const rendered = await state(`${name}-result`);
  assert.ok(rendered.includes(`شدت افسردگی: ${severity}`), `${name} severity mismatch`);
  assert.ok(rendered.includes(`توصیه: ${recommendation}`), `${name} recommendation mismatch`);
  await clickButton('انجام مجدد تست');
}
await evaluate(`localStorage.setItem('phq9.assessments', '{broken')`);
await complete(Array(9).fill(0));
await state('save-failed');
await clickButton('تاریخچه آزمون‌ها');
await state('history-read-failed');
await clickButton('بازگشت به نتیجه');
await clickButton('انجام مجدد تست');
await evaluate(`localStorage.removeItem('phq9.assessments')`);
await complete(Array(9).fill(0));
await clickButton('تاریخچه آزمون‌ها');
await clickButton('حذف آزمون');
await state('delete-confirmation');
await clickButton('انصراف');
await clickButton('پاک کردن همهٔ تاریخچه');
await state('clear-confirmation');
socket.close();
