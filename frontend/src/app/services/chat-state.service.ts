import { inject, Injectable } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { BehaviorSubject, EMPTY, Observable } from "rxjs";
import { catchError, finalize, tap } from "rxjs/operators";
import { ChatApiService } from "./chat-api.service";
import { ChatMessage } from "../core/models/chat.models";

@Injectable({ providedIn: "root" })
export class ChatStateService {
  private readonly chatApi = inject(ChatApiService);
  private readonly messagesSubject = new BehaviorSubject<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Halo, saya siap membantu membaca database traceability Anda. Tanyakan apapun tentang data traceability.",
      createdAt: new Date().toISOString(),
    },
  ]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly messages$ = this.messagesSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  sendMessage(content: string): Observable<unknown> {
    const trimmed = content.trim();
    if (!trimmed) {
      return EMPTY;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const placeholder: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Debi sedang berpikir...",
      createdAt: new Date().toISOString(),
      loading: true,
    };

    this.messagesSubject.next([
      ...this.messagesSubject.value,
      userMessage,
      placeholder,
    ]);
    this.loadingSubject.next(true);

    return this.chatApi.sendMessage({ message: trimmed }).pipe(
      tap((response) => {
        this.replacePlaceholder({
          ...placeholder,
          content: response.reply,
          sql: response.sql,
          rows: response.rows,
          loading: false,
        });
      }),
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this.replacePlaceholder({
          ...placeholder,
          content: message,
          loading: false,
        });
        return EMPTY;
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      }),
    );
  }

  private replacePlaceholder(nextMessage: ChatMessage): void {
    this.messagesSubject.next(
      this.messagesSubject.value.map((message) =>
        message.id === nextMessage.id ? nextMessage : message,
      ),
    );
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = error.error?.message;
      if (typeof backendMessage === "string" && backendMessage.trim()) {
        return backendMessage;
      }

      if (Array.isArray(backendMessage) && backendMessage.length > 0) {
        return backendMessage.join(", ");
      }

      if (error.status === 0) {
        return "Frontend tidak dapat terhubung ke backend API.";
      }
    }

    return "Terjadi kendala saat memproses permintaan. Periksa koneksi backend, Ollama, dan database.";
  }
}
