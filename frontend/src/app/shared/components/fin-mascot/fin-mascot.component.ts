import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type FinMood = 'welcome' | 'empty' | 'positive' | 'warning' | 'loading';

@Component({
  selector: 'app-fin-mascot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fin-mascot.component.html',
  styleUrl: './fin-mascot.component.scss',
})
export class FinMascotComponent {
  @Input() mood: FinMood = 'welcome';
  @Input() message = 'Seu assistente financeiro está pronto.';
  @Input() compact = false;
}
