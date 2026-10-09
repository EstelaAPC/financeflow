import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FinMascotComponent } from '../fin-mascot/fin-mascot.component';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [RouterLink, FinMascotComponent],
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.scss',
})
export class QuickActionsComponent {
  readonly expanded = signal(false);

  toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }

  close(): void {
    this.expanded.set(false);
  }
}
