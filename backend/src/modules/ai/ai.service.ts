import {
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
}

interface OllamaGenerateResponse {
  response: string;
}

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {}

  async generate(prompt: string, stream = false): Promise<string> {
    const endpoint = this.configService.get<string>("AI_ENDPOINT");
    const model = this.configService.get<string>("AI_MODEL", "llama3");
    const configuredTimeout = this.configService.get<number>(
      "AI_TIMEOUT_MS",
      180000,
    );
    const timeout = Math.max(configuredTimeout, 180000);

    if (!endpoint) {
      throw new HttpException(
        "AI endpoint belum dikonfigurasi.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const payload: OllamaGenerateRequest = {
        model,
        prompt,
        stream,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new HttpException(
          `Ollama error: ${text}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      if (stream) {
        const text = await response.text();
        return this.extractStreamedText(text);
      }

      const body = (await response.json()) as OllamaGenerateResponse;
      return body.response?.trim() ?? "";
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new GatewayTimeoutException(
          `Timeout saat menunggu respons Ollama setelah ${timeout} ms.`,
        );
      }

      throw new HttpException(
        "Gagal berkomunikasi dengan layanan AI lokal.",
        HttpStatus.BAD_GATEWAY,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private extractStreamedText(raw: string): string {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          const parsed = JSON.parse(line) as Partial<OllamaGenerateResponse>;
          return parsed.response ?? "";
        } catch {
          return "";
        }
      })
      .join("")
      .trim();
  }
}
