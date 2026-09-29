import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { PHQ9_ASSESSMENT_STORAGE_KEY, Phq9AssessmentRecord } from './phq9-assessment-record';
import { Phq9AssessmentStorage } from './phq9-assessment-storage';
import { Phq9ShellComponent } from './phq9-shell.component';

describe('individual history deletion', () => {
  const key = PHQ9_ASSESSMENT_STORAGE_KEY;
  const first: Phq9AssessmentRecord = {
    id: 'first', createdAt: '2026-09-25T10:30:00.000Z', answers: Array(9).fill(0),
    totalScore: 0, severityCategory: 'minimal',
    result: { severityLabel: 'Saved first', recommendation: 'Advice first', warnings: [] },
  };
  const second: Phq9AssessmentRecord = {
    id: 'second', createdAt: '2026-09-26T10:30:00.000Z', answers: Array(9).fill(3),
    totalScore: 27, severityCategory: 'severe',
    result: { severityLabel: 'Saved second', recommendation: 'Advice second', warnings: [] },
  };
  let fixture: ComponentFixture<Phq9ShellComponent>;

  const store = (records: unknown[]): void => localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, records }));
  const history = (): HTMLElement => fixture.nativeElement.querySelector('.history-view');
  const deleteAction = (id: string): HTMLButtonElement =>
    history().querySelector(`[data-record-id="${id}"] .history-delete`)!;
  const open = (): void => {
    const action = (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[])
      .find((button) => button.textContent?.trim() === 'تاریخچه آزمون‌ها');
    action!.click();
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

  it('keeps the selected record and bytes until confirmation, and restores focus on cancel', fakeAsync(() => {
    store([first, second]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    open();
    tick();
    const before = localStorage.getItem(key);
    deleteAction('first').click();
    fixture.detectChanges();
    tick();
    const dialog = history().querySelector('[role="alertdialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('۰');
    expect(dialog.textContent).toContain('حذف دائمی');
    expect(history().querySelectorAll('.history-list li').length).toBe(2);
    expect(localStorage.getItem(key)).toBe(before);
    (dialog.querySelector('.delete-cancel') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick();
    expect(document.activeElement).toBe(deleteAction('first'));
    expect(Array.from(history().querySelectorAll('.history-list li')).map((item) => item.getAttribute('data-record-id')))
      .toEqual(['second', 'first']);
    expect(localStorage.getItem(key)).toBe(before);
  }));

  it('deletes only the selected ID, updates the list, and survives reopening', fakeAsync(() => {
    store([first, second]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    open();
    tick();
    deleteAction('first').click();
    fixture.detectChanges();
    (history().querySelector('.delete-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick();
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ schemaVersion: 1, records: [second] });
    expect(history().querySelectorAll('.history-list li').length).toBe(1);
    expect(document.activeElement).toBe(deleteAction('second'));
    deleteAction('second').click();
    fixture.detectChanges();
    (history().querySelector('.delete-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick();
    expect(history().textContent).toContain('هنوز آزمونی در تاریخچه ذخیره نشده است');
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ schemaVersion: 1, records: [] });
    expect(document.activeElement).toBe(history().querySelector('#history-title'));
    (Array.from(history().querySelectorAll('button')) as HTMLButtonElement[])
      .find((button) => button.textContent?.trim() === 'بازگشت به آزمون')!.click();
    fixture.detectChanges();
    open();
    expect(history().querySelectorAll('.history-list li').length).toBe(0);
    tick();
  }));

  it('does not overwrite partial or unreadable history', () => {
    for (const raw of [
      JSON.stringify({ schemaVersion: 1, records: [first, { id: 'bad' }] }),
      JSON.stringify({ schemaVersion: 1, records: [first, first] }),
      '{broken',
      JSON.stringify({ schemaVersion: 2, records: [first] }),
    ]) {
      localStorage.setItem(key, raw);
      fixture = TestBed.createComponent(Phq9ShellComponent);
      fixture.detectChanges();
      open();
      expect(history().querySelector('.history-delete')).toBeNull();
      expect(new Phq9AssessmentStorage().delete(first.id).ok).toBeFalse();
      expect(localStorage.getItem(key)).toBe(raw);
      fixture.destroy();
    }
  });

  it('reports a vanished record and failed write without claiming success', () => {
    store([first, second]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    open();
    deleteAction('first').click();
    fixture.detectChanges();
    store([second]);
    (history().querySelector('.delete-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(history().querySelector('[role="alert"]')?.textContent).toContain('دیگر');
    expect(history().querySelector('[data-record-id="first"]')).toBeNull();

    deleteAction('second').click();
    fixture.detectChanges();
    const before = localStorage.getItem(key);
    spyOn(localStorage, 'setItem').and.throwError('blocked');
    (history().querySelector('.delete-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(history().textContent).toContain('حذف نشد');
    expect(localStorage.getItem(key)).toBe(before);
    expect(deleteAction('second')).toBeTruthy();
  });

  it('dismisses with Escape and restores focus without writing', fakeAsync(() => {
    store([first]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    open();
    tick();
    const before = localStorage.getItem(key);
    deleteAction('first').click();
    fixture.detectChanges();
    tick();
    expect(document.activeElement).toBe(history().querySelector('.delete-cancel'));
    (history().querySelector('.delete-dialog') as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    tick();
    expect(history().querySelector('.delete-dialog')).toBeNull();
    expect(Array.from(history().querySelectorAll('.history-list li')).map((item) => item.getAttribute('data-record-id')))
      .toEqual(['first']);
    expect(document.activeElement).toBe(deleteAction('first'));
    expect(localStorage.getItem(key)).toBe(before);
  }));

  it('rechecks storage at confirmation and refuses a newly partial or unreadable value', () => {
    store([first]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    open();
    deleteAction('first').click();
    fixture.detectChanges();
    store([first, { id: 'bad' }]);
    const partial = localStorage.getItem(key);
    (history().querySelector('.delete-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(history().querySelector('.history-delete')).toBeNull();
    expect(history().textContent).toContain('حذف نشد');
    expect(localStorage.getItem(key)).toBe(partial);

    fixture.destroy();
    store([first]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    open();
    deleteAction('first').click();
    fixture.detectChanges();
    const write = spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'getItem').and.throwError('blocked');
    (history().querySelector('.delete-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(history().textContent).toContain('حذف نشد');
    expect(history().querySelector('.history-delete')).toBeNull();
    expect(write).not.toHaveBeenCalled();
  });

  it('does not overwrite a missing, empty, or malformed value at confirmation', () => {
    for (const raw of [null, '{"schemaVersion":1,"records":[]}', '{broken']) {
      store([first]);
      fixture = TestBed.createComponent(Phq9ShellComponent);
      fixture.detectChanges();
      open();
      deleteAction('first').click();
      fixture.detectChanges();
      if (raw === null) localStorage.removeItem(key);
      else localStorage.setItem(key, raw);
      (history().querySelector('.delete-confirm') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(history().textContent).toContain('حذف نشد');
      expect(history().querySelector('.history-delete')).toBeNull();
      expect(localStorage.getItem(key)).toBe(raw);
      fixture.destroy();
    }
  });
});
