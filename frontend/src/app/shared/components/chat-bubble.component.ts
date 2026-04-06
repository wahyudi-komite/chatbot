import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ChatMessage } from '../../core/models/chat.models';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block',
  },
  template: `
    <article
      class="group w-full max-w-full overflow-hidden animate-message rounded-3xl border px-4 py-3 shadow-lg backdrop-blur-sm transition duration-300"
      [ngClass]="
        message.role === 'user'
          ? 'ml-auto border-cyan-400/30 bg-cyan-500/12 text-slate-800 shadow-[0_14px_35px_rgba(14,165,233,0.12)] dark:bg-cyan-500/15 dark:text-slate-50'
          : 'mr-auto border-slate-200 bg-white text-slate-800 shadow-[0_14px_35px_rgba(148,163,184,0.12)] dark:border-white/10 dark:bg-white/6 dark:text-slate-100'
      "
    >
      <div class="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-600 dark:text-slate-300/80">
        <ng-container *ngIf="message.role === 'assistant'; else userLabel">
          <span
                class="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 shadow-[0_0_24px_rgba(14,165,233,0.14)] dark:border-cyan-300/30 dark:bg-cyan-400/15 dark:text-cyan-100 dark:shadow-[0_0_24px_rgba(34,211,238,0.18)]"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current stroke-[1.8]">
              <circle cx="12" cy="12" r="8.5"></circle>
              <path d="M9 12h6"></path>
              <path d="M12 9v6"></path>
            </svg>
          </span>
          <span>Debi</span>
        </ng-container>
        <ng-template #userLabel>
          <span>User</span>
        </ng-template>
        <span *ngIf="message.loading" class="inline-flex gap-1">
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.3s]"></span>
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.15s]"></span>
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300"></span>
        </span>
      </div>

      <div *ngIf="message.loading; else messageContent" class="space-y-3">
        <p
          class="whitespace-pre-wrap text-sm leading-7 text-cyan-700 dark:text-cyan-100"
        >
          {{ message.content }}
        </p>
        <div class="flex items-center gap-2 text-xs text-cyan-700/90 dark:text-cyan-200/90">
          <span class="inline-flex gap-1">
            <span class="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.3s]"></span>
            <span class="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.15s]"></span>
            <span class="h-2 w-2 animate-bounce rounded-full bg-cyan-300"></span>
          </span>
          <span class="animate-shimmer bg-[linear-gradient(90deg,_rgba(103,232,249,0.25)_0%,_rgba(255,255,255,0.95)_50%,_rgba(103,232,249,0.25)_100%)] bg-[length:220%_100%] bg-clip-text text-transparent">
            Merangkai query dan merapikan jawaban untuk Anda
          </span>
        </div>
      </div>

      <ng-template #messageContent>
        <div class="overflow-x-auto">
          <p class="whitespace-pre-wrap text-sm leading-7 text-current">{{ message.content }}</p>
        </div>
      </ng-template>

      <div
        *ngIf="message.rows?.length && tableColumns.length"
        class="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-slate-950/70"
      >
        <table class="min-w-full text-left text-xs text-slate-700 dark:text-slate-100">
          <thead class="bg-slate-100 text-[11px] uppercase tracking-[0.2em] text-cyan-700 dark:bg-white/8 dark:text-cyan-200">
            <tr>
              <th *ngFor="let column of tableColumns" class="px-3 py-2 font-medium whitespace-nowrap">
                {{ column }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              *ngFor="let row of message.rows"
              class="border-t border-white/10 align-top transition hover:bg-white/6"
            >
              <td
                *ngFor="let column of tableColumns"
                class="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-200"
              >
                {{ formatCell(row[column]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <pre
        *ngIf="message.sql"
        class="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-cyan-700 opacity-90 transition group-hover:opacity-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-cyan-200 dark:opacity-85"
      ><code>{{ message.sql }}</code></pre>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatBubbleComponent {
  @Input({ required: true }) message!: ChatMessage;
  @Output() editRequested = new EventEmitter<string>();
  readonly copied = signal(false);

  get tableColumns(): string[] {
    const firstRow = this.message.rows?.[0];
    return firstRow ? Object.keys(firstRow) : [];
  }

  formatCell(value: unknown): string {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  requestEdit(): void {
    this.editRequested.emit(this.message.content);
  }

  async copyAnswer(): Promise<void> {
    const parts = [this.message.content];

    if (this.message.sql) {
      parts.push(`SQL:\n${this.message.sql}`);
    }

    if (this.message.rows?.length) {
      parts.push(JSON.stringify(this.message.rows, null, 2));
    }

    await navigator.clipboard.writeText(parts.filter(Boolean).join('\n\n'));
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }
}
