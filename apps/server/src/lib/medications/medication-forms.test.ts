import { describe, expect, it } from 'vitest';

import { normalizeForm } from './medication-forms';

describe('normalizeForm', () => {
  it('normalizes tablet/capsule forms', () => {
    expect(normalizeForm('comprimé')).toBe('TABLET_CAPSULE');
    expect(normalizeForm('comprimé pelliculé')).toBe('TABLET_CAPSULE');
    expect(normalizeForm('gélule')).toBe('TABLET_CAPSULE');
    expect(normalizeForm('capsule molle')).toBe('TABLET_CAPSULE');
  });

  it('normalizes syrup/liquid forms', () => {
    expect(normalizeForm('sirop')).toBe('SYRUP_LIQUID');
    expect(normalizeForm('suspension buvable')).toBe('SYRUP_LIQUID');
    expect(normalizeForm('solution buvable')).toBe('SYRUP_LIQUID');
  });

  it('normalizes injectable forms', () => {
    expect(normalizeForm('solution injectable')).toBe('INJECTABLE');
    expect(normalizeForm('poudre pour solution injectable')).toBe('INJECTABLE');
    expect(normalizeForm('solution pour perfusion')).toBe('INJECTABLE');
  });

  it('normalizes drops', () => {
    expect(normalizeForm('collyre')).toBe('DROPS');
    expect(normalizeForm('gouttes auriculaires')).toBe('DROPS');
    expect(normalizeForm('solution ophtalmique')).toBe('DROPS');
  });

  it('returns UNKNOWN for null/undefined/empty', () => {
    expect(normalizeForm(null)).toBe('UNKNOWN');
    expect(normalizeForm(undefined)).toBe('UNKNOWN');
    expect(normalizeForm('')).toBe('UNKNOWN');
    expect(normalizeForm('  ')).toBe('UNKNOWN');
  });

  it('maps other known forms to TABLET_CAPSULE bucket', () => {
    expect(normalizeForm('crème')).toBe('TABLET_CAPSULE');
    expect(normalizeForm('suppositoire')).toBe('TABLET_CAPSULE');
    expect(normalizeForm('patch')).toBe('TABLET_CAPSULE');
    expect(normalizeForm('poudre')).toBe('TABLET_CAPSULE');
  });

  it('returns UNKNOWN for unrecognized forms', () => {
    expect(normalizeForm('forme bizarre')).toBe('UNKNOWN');
  });

  it('is case-insensitive', () => {
    expect(normalizeForm('COMPRIMÉ')).toBe('TABLET_CAPSULE');
    expect(normalizeForm('Sirop')).toBe('SYRUP_LIQUID');
    expect(normalizeForm('INJECTABLE')).toBe('INJECTABLE');
  });
});
