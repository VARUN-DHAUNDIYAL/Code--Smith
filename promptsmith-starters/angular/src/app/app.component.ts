import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div style="text-align: center; padding: 2rem;">
      <h1>Angular App</h1>
      <div style="padding: 2rem;">
        <button (click)="count++">count is {{ count }}</button>
        <p>
          Edit <code>src/app/app.component.ts</code> and save to test HMR
        </p>
      </div>
    </div>
  `,
  styles: [`
    button {
      border-radius: 8px;
      border: 1px solid transparent;
      padding: 0.6em 1.2em;
      font-size: 1em;
      font-weight: 500;
      font-family: inherit;
      background-color: #1a1a1a;
      color: white;
      cursor: pointer;
      transition: border-color 0.25s;
    }

    button:hover {
      border-color: #646cff;
    }

    button:focus,
    button:focus-visible {
      outline: 4px auto -webkit-focus-ring-color;
    }
  `]
})
export class AppComponent {
  count = 0;
} 