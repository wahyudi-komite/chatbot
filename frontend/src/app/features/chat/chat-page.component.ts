import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { toSignal } from "@angular/core/rxjs-interop";
import { ChatStateService } from "../../services/chat-state.service";
import { ThemeService } from "../../services/theme.service";
import { ChatMessage } from "../../core/models/chat.models";
import { ChatBubbleComponent } from "../../shared/components/chat-bubble.component";

@Component({
  selector: "app-chat-page",
  standalone: true,
  imports: [CommonModule, FormsModule, ChatBubbleComponent],
  template: `
    <main
      class="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_30%),linear-gradient(180deg,_#f8fcff_0%,_#eef7fb_48%,_#e6f0f7_100%)] text-slate-900 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] dark:text-slate-100"
    >
      <div class="absolute inset-0 -z-10 overflow-hidden">
        <div
          class="absolute left-[10%] top-16 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl animate-float dark:bg-cyan-500/10"
        ></div>
        <div
          class="absolute right-[12%] top-32 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl animate-float [animation-delay:-4s] dark:bg-emerald-500/10"
        ></div>
      </div>

      <section
        class="mx-auto flex h-screen max-w-6xl flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8"
      >
        <header class="mb-6 flex items-start justify-between gap-4">
          <div class="max-w-2xl">
            <p
              class="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200"
            >
              <span
                class="flex h-6 w-6 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 shadow-[0_0_24px_rgba(14,165,233,0.14)] dark:border-cyan-300/30 dark:bg-cyan-400/15 dark:text-cyan-100 dark:shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]"
                >
                  <circle cx="12" cy="12" r="8.5"></circle>
                  <path d="M9 12h6"></path>
                  <path d="M12 9v6"></path>
                </svg>
              </span>
              Debi
            </p>
            <h1
              class="text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-white"
            >
              Debi siap membantu Anda.
            </h1>
            <p
              class="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300"
            >
              Natural language in, SQL read-only out, insight profesional
              kembali ke user.
            </p>
          </div>

          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-cyan-50 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:border-cyan-300/40 dark:hover:bg-cyan-400/15"
            (click)="themeService.toggle()"
          >
            {{ themeLabel() }}
          </button>
        </header>

        <div class="grid min-h-0 flex-1 gap-4 ">
          <section
            class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/78 shadow-[0_24px_60px_rgba(148,163,184,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 dark:shadow-2xl"
          >
            <div
              #scrollContainer
              class="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 w-full"
            >
              <app-chat-bubble
                *ngFor="let message of messages()"
                [message]="message"
                (editRequested)="editMessage($event)"
              />
            </div>

            <form
              class="sticky bottom-0 z-10 border-t border-slate-200/80 bg-white/72 px-4 py-2 sm:px-6 dark:border-white/10 dark:bg-slate-950/60"
              (ngSubmit)="submit()"
            >
              <div
                class="flex items-end gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-3 py-2 shadow-[0_10px_30px_rgba(148,163,184,0.12)] dark:border-white/10 dark:bg-white/6 dark:shadow-inner"
              >
                <textarea
                  #composer
                  [(ngModel)]="draft"
                  name="draft"
                  rows="1"
                  class="flex-1 resize-none overflow-hidden bg-transparent px-1 py-[0.55rem] text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
                  placeholder="Contoh: tampilkan 10 data terakhir dari nama tabel mc02_prespincyb"
                  (keydown)="handleComposerKeydown($event)"
                ></textarea>

                <button
                  type="submit"
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  [disabled]="loading()"
                  [attr.aria-label]="loading() ? 'Memproses' : 'Kirim'"
                >
                  <svg
                    viewBox="0 0 24 24"
                    class="h-4.5 w-4.5 fill-none stroke-current stroke-[2]"
                    aria-hidden="true"
                  >
                    <path d="M4 12h12"></path>
                    <path d="M11 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPageComponent implements AfterViewInit {
  @ViewChild("scrollContainer")
  private scrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild("composer")
  private composer?: ElementRef<HTMLTextAreaElement>;

  readonly chatState = inject(ChatStateService);
  readonly themeService = inject(ThemeService);

  draft = "";
  readonly messages = toSignal(this.chatState.messages$, {
    initialValue: [] as ChatMessage[],
  });
  readonly loading = toSignal(this.chatState.loading$, { initialValue: false });
  readonly themeLabel = computed(() =>
    this.themeService.mode() === "dark" ? "Light Mode" : "Dark Mode",
  );
  private readonly initialized = signal(false);

  constructor() {
    effect(() => {
      this.messages();
      this.loading();

      if (!this.initialized()) {
        return;
      }

      queueMicrotask(() => this.scrollToBottom());
    });
  }

  ngAfterViewInit(): void {
    this.initialized.set(true);
    queueMicrotask(() => this.scrollToBottom());
  }

  submit(): void {
    const message = this.draft.trim();
    if (!message) {
      return;
    }

    this.draft = "";
    this.chatState.sendMessage(message).subscribe();
  }

  handleComposerKeydown(event: KeyboardEvent): void {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.submit();
  }

  editMessage(content: string): void {
    this.draft = content;
    queueMicrotask(() => this.composer?.nativeElement.focus());
  }

  private scrollToBottom(): void {
    if (!this.initialized() || !this.scrollContainer) {
      return;
    }

    const element = this.scrollContainer.nativeElement;
    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    });
  }
}
