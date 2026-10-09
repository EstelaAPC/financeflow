import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.removeProperty('color-scheme');
  });

  it('starts in light mode and persists a toggled dark preference', () => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);

    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(service.isDark()).toBe(false);

    service.toggle();

    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem('financeflow.theme')).toBe('dark');
  });

  it('restores a previously selected dark theme', () => {
    localStorage.setItem('financeflow.theme', 'dark');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);

    expect(service.isDark()).toBe(true);
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
