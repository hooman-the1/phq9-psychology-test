import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { PHQ9_ASSESSMENT_STORAGE_KEY, Phq9AssessmentRecord } from './phq9-assessment-record';
import { Phq9AssessmentStorage } from './phq9-assessment-storage';
import { Phq9ShellComponent } from './phq9-shell.component';

describe('clear all history', () => {
  const key = PHQ9_ASSESSMENT_STORAGE_KEY;
  const record: Phq9AssessmentRecord = {
    id: 'saved', createdAt: '2026-09-26T10:30:00.000Z', answers: Array(9).fill(0),
    totalScore: 0, severityCategory: 'minimal',
    result: { severityLabel: 'Saved', recommendation: 'Advice', warnings: [] },
  };
  let fixture: ComponentFixture<Phq9ShellComponent>;
  const history = (): HTMLElement => fixture.nativeElement.querySelector('.history-view');
  const action = (): HTMLButtonElement | null => history().querySelector('.history-clear');
  const dialog = (): HTMLElement | null => history().querySelector('.clear-dialog');
  const store = (records: unknown[]): void => localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, records }));
  const open = (): void => {
    fixture.componentInstance.openHistory();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.removeItem(key);
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
  });
  afterEach(() => {
    fixture?.destroy();
    localStorage.removeItem(key);
  });

  it('requires confirmation, traps Tab, and restores focus and bytes on Escape', fakeAsync(() => {
    store([record]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    open();
    tick();
    const before = localStorage.getItem(key);
    action()!.click();
    fixture.detectChanges();
    tick();
    expect(dialog()?.textContent).toContain('همه');
    expect(dialog()?.textContent).toContain('دائمی');
    expect(document.activeElement).toBe(dialog()!.querySelector('.clear-cancel'));
    expect(localStorage.getItem(key)).toBe(before);
    expect(history().querySelectorAll('.history-list li').length).toBe(1);
    const cancel = dialog()!.querySelector('.clear-cancel') as HTMLButtonElement;
    const confirm = dialog()!.querySelector('.clear-confirm') as HTMLButtonElement;
    confirm.focus();
    confirm.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(cancel);
    cancel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(confirm);
    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    tick();
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(action());
    expect(localStorage.getItem(key)).toBe(before);
    action()!.click();
    fixture.detectChanges();
    (dialog()!.querySelector('.clear-cancel') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick();
    expect(document.activeElement).toBe(action());
    expect(localStorage.getItem(key)).toBe(before);
  }));

  it('clears the v1 envelope, immediately shows empty history, and preserves the questionnaire', fakeAsync(() => {
    store([record]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    fixture.componentInstance.answers[0] = 2;
    open();
    action()!.click();
    fixture.detectChanges();
    (dialog()!.querySelector('.clear-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick();
    expect(localStorage.getItem(key)).toBe('{"schemaVersion":1,"records":[]}');
    expect(history().querySelector('.history-list')).toBeNull();
    expect(history().querySelector('.history-delete')).toBeNull();
    expect(action()).toBeNull();
    expect(history().textContent).toContain('هنوز آزمونی');
    expect(document.activeElement).toBe(history().querySelector('#history-title'));
    fixture.componentInstance.closeHistory();
    fixture.detectChanges();
    expect(fixture.componentInstance.answers[0]).toBe(2);
    open();
    expect(action()).toBeNull();
    tick();
    fixture.destroy();
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    open();
    expect(history().textContent).toContain('هنوز آزمونی');
    tick();
  }));

  it('does not offer clear for empty, malformed, versioned, or partial history', () => {
    const write = spyOn(localStorage, 'setItem').and.callThrough();
    for (const raw of [
      null,
      '{"schemaVersion":1,"records":[]}',
      '{broken',
      JSON.stringify({ schemaVersion: 2, records: [record] }),
      JSON.stringify({ schemaVersion: 1, records: [record, { id: 'bad' }] }),
      JSON.stringify({ schemaVersion: 1, records: [record, record] }),
    ]) {
      if (raw === null) localStorage.removeItem(key);
      else localStorage.setItem(key, raw);
      fixture = TestBed.createComponent(Phq9ShellComponent);
      fixture.detectChanges();
      write.calls.reset();
      open();
      expect(action()).toBeNull();
      expect(dialog()).toBeNull();
      expect(write).not.toHaveBeenCalled();
      fixture.destroy();
      expect(localStorage.getItem(key)).toBe(raw);
    }
  });

  it('rechecks storage before clearing and reports changed or failed storage', () => {
    for (const raw of [
      null,
      '{"schemaVersion":1,"records":[]}',
      '{broken',
      JSON.stringify({ schemaVersion: 1, records: [record, { id: 'bad' }] }),
    ]) {
      store([record]);
      fixture = TestBed.createComponent(Phq9ShellComponent);
      fixture.detectChanges();
      open();
      action()!.click();
      fixture.detectChanges();
      if (raw === null) localStorage.removeItem(key);
      else localStorage.setItem(key, raw);
      (dialog()!.querySelector('.clear-confirm') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(history().textContent).toContain('پاک نشد');
      expect(localStorage.getItem(key)).toBe(raw);
      expect(action()).toBeNull();
      fixture.destroy();
    }
    store([record]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    open();
    action()!.click();
    fixture.detectChanges();
    const before = localStorage.getItem(key);
    spyOn(localStorage, 'setItem').and.throwError('blocked');
    (dialog()!.querySelector('.clear-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(history().textContent).toContain('پاک نشد');
    expect(localStorage.getItem(key)).toBe(before);
    expect(action()).not.toBeNull();
  });

  it('does not write when storage becomes unreadable before confirmation', () => {
    store([record]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    open();
    action()!.click();
    fixture.detectChanges();
    const write = spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'getItem').and.throwError('blocked');
    (dialog()!.querySelector('.clear-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(write).not.toHaveBeenCalled();
    expect(history().textContent).toContain('پاک نشد');
    expect(action()).toBeNull();
  });

  it('keeps the displayed result available after clearing history', () => {
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    fixture.componentInstance.answers.fill(0);
    fixture.componentInstance.submitAssessment();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card')).not.toBeNull();
    open();
    action()!.click();
    fixture.detectChanges();
    (dialog()!.querySelector('.clear-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();
    fixture.componentInstance.closeHistory();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card')).not.toBeNull();
    expect(fixture.componentInstance.score?.total).toBe(0);
  });

  it('storage boundary refuses empty and partial reads without writing', () => {
    const storage = new Phq9AssessmentStorage();
    const write = spyOn(localStorage, 'setItem').and.callThrough();
    expect(storage.clearAll().ok).toBeFalse();
    expect(write).not.toHaveBeenCalled();
    store([record, { id: 'bad' }]);
    const raw = localStorage.getItem(key);
    expect(storage.clearAll().ok).toBeFalse();
    expect(localStorage.getItem(key)).toBe(raw);
  });
});
