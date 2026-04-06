import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildResponseFormatterPrompt } from '../../prompts/response-format.prompt';
import { AiService } from '../ai/ai.service';
import { SchemaService } from '../schema/schema.service';

@Injectable()
export class ResponseFormatterService {
  private readonly englishPattern =
    /\b(based on|it appears|these records|it's worth noting|suggests|latest records|created between|processed within|likely indicating|quality control)\b/i;

  constructor(
    private readonly aiService: AiService,
    private readonly schemaService: SchemaService,
    private readonly configService: ConfigService,
  ) {}

  async format(question: string, sql: string, rows: unknown[]): Promise<string> {
    if (rows.length === 0) {
      return 'Saya tidak menemukan data yang sesuai dengan pertanyaan tersebut.';
    }

    const schema = await this.schemaService.getSchema();
    const businessContext = this.configService.get<string>(
      'BUSINESS_CONTEXT',
      'Sistem bisnis umum.',
    );
    const styleInstruction = this.configService.get<string>(
      'AI_RESPONSE_STYLE',
      'Jawab ringkas, jelas, dan profesional.',
    );
    const useStreaming = this.configService.get<string>('AI_STREAM', 'false') === 'true';

    const prompt = buildResponseFormatterPrompt({
      businessContext,
      schema,
      question,
      sql,
      rows,
      styleInstruction,
    });

    const response = await this.aiService.generate(prompt, useStreaming);
    return this.ensureIndonesian(response, useStreaming);
  }

  private async ensureIndonesian(response: string, useStreaming: boolean): Promise<string> {
    if (!this.englishPattern.test(response)) {
      return response;
    }

    const prompt = [
      'Tulis ulang jawaban berikut menjadi bahasa Indonesia yang natural dan profesional.',
      'Aturan:',
      '- Seluruh kalimat harus berbahasa Indonesia.',
      '- Nama kolom, nama tabel, dan nilai data boleh tetap asli.',
      '- Jangan menambah fakta baru.',
      '- Jangan gunakan pembuka atau penjelasan bahasa Inggris.',
      `Jawaban asli: ${response}`,
      'Output: jawaban bahasa Indonesia saja.',
    ].join('\n');

    return this.aiService.generate(prompt, useStreaming);
  }
}
