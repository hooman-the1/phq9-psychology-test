import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: '<main><h1>PHQ-9</h1></main>',
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }

      main {
        box-sizing: border-box;
        margin: 0 auto;
        max-width: 40rem;
        padding: 2rem;
      }
    `,
  ],
})
export class AppComponent {}
