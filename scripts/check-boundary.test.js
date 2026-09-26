const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { inspectRepository } = require('./check-boundary');

test('the current repository stays within the local application boundary', () => {
  const issues = inspectRepository(path.resolve(__dirname, '..'));

  assert.deepEqual(issues, []);
});

test('the boundary check rejects original-application and parent imports', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'phq9-boundary-'));

  try {
    fs.mkdirSync(path.join(fixtureRoot, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(fixtureRoot, 'package.json'),
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
      'utf8',
    );
    fs.writeFileSync(
      path.join(fixtureRoot, 'src', 'main.ts'),
      "import { legacy } from '../yekravankav';\nexport { legacy };\n",
      'utf8',
    );

    const issues = inspectRepository(fixtureRoot);

    assert.ok(issues.some((issue) => issue.includes('yekravankav')));
    assert.ok(issues.some((issue) => issue.includes('parent-directory import')));
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
