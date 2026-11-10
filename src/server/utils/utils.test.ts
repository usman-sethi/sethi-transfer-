import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, generateSecureToken } from './crypto.js';
import { analyzeFile, getCategoryFromExtension, isBrowserViewable } from './fileDetector.js';
import { sanitizeFilename, formatBytes } from './sanitize.js';

test('hashPassword and verifyPassword work correctly', async () => {
  const password = 'MySecurePassword123!';
  const hash = await hashPassword(password);
  assert.ok(hash.length > 20, 'Hash should be generated');

  const isValid = await verifyPassword(password, hash);
  assert.equal(isValid, true, 'Original password should verify');

  const isInvalid = await verifyPassword('WrongPassword', hash);
  assert.equal(isInvalid, false, 'Wrong password should fail');
});

test('generateSecureToken creates hex strings of expected length', () => {
  const token = generateSecureToken(16);
  assert.equal(token.length, 32);
});

test('analyzeFile identifies PDF and image signatures accurately', () => {
  // Fake PDF header %PDF
  const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35]);
  const pdfAnalysis = analyzeFile('quarterly_report.pdf', 'application/pdf', pdfHeader);
  assert.equal(pdfAnalysis.category, 'document');
  assert.equal(pdfAnalysis.resourceType, 'raw');
  assert.equal(pdfAnalysis.isViewableInBrowser, true);

  // Fake PNG header
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const pngAnalysis = analyzeFile('screenshot.png', 'image/png', pngHeader);
  assert.equal(pngAnalysis.category, 'image');
  assert.equal(pngAnalysis.resourceType, 'image');
  assert.equal(pngAnalysis.isViewableInBrowser, true);
});

test('sanitizeFilename removes directory traversal and illegal characters', () => {
  const malicious = '../../../../etc/passwd.jpg';
  const clean = sanitizeFilename(malicious);
  assert.ok(!clean.includes('../'), 'Path traversal must be stripped');
  assert.ok(clean.endsWith('.jpg'), 'Extension must be preserved');

  const nullByte = 'document\0.pdf';
  const cleanNull = sanitizeFilename(nullByte);
  assert.ok(!cleanNull.includes('\0'), 'Null bytes must be removed');
});

test('formatBytes scales accurately', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1048576 * 15.5), '15.5 MB');
});
