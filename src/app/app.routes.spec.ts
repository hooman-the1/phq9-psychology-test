import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';

describe('application root route', () => {
  it('resolves / to the local PHQ-9 application shell', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(appRoutes), provideLocationMocks()],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(AppComponent);

    await router.navigateByUrl('/');
    fixture.detectChanges();

    expect(router.url).toBe('/');
    expect(fixture.nativeElement.textContent).toContain('PHQ-9');
  });

  it('does not expose unrelated application routes', () => {
    expect(appRoutes.map((route) => route.path)).toEqual(['']);
  });
});
