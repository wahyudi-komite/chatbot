import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChatPageComponent } from './features/chat/chat-page.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChatPageComponent],
  template: `<app-chat-page />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}

