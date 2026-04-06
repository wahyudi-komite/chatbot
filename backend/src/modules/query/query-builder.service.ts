import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildSqlGenerationPrompt } from '../../prompts/sql-generation.prompt';
import { AiService } from '../ai/ai.service';
import { SchemaService } from '../schema/schema.service';
import { DatabaseSchema } from '../schema/schema.types';

@Injectable()
export class QueryBuilderService {
  private readonly machineTableAliases: Array<{ alias: RegExp; tableName: string }> = [
    {
      alias: /\bnut runner bolt conrod\b/i,
      tableName: 'mc09_nr_conrod',
    },
  ];

  constructor(
    private readonly aiService: AiService,
    private readonly schemaService: SchemaService,
    private readonly configService: ConfigService,
  ) {}

  async buildSql(question: string): Promise<string> {
    return this.generateSql(question);
  }

  async repairSql(question: string, previousOutput: string, validationError: string): Promise<string> {
    return this.generateSql(question, previousOutput, validationError);
  }

  private async generateSql(
    question: string,
    previousOutput?: string,
    validationError?: string,
  ): Promise<string> {
    const schema = await this.schemaService.getSchema();
    const deterministicSql = this.tryBuildLatestRowsShortcut(question, schema);
    if (deterministicSql) {
      return deterministicSql;
    }

    const enrichedQuestion = this.enrichQuestionWithTableHints(question);
    const businessContext = this.configService.get<string>(
      'BUSINESS_CONTEXT',
      'Sistem bisnis umum.',
    );
    const useStreaming = this.configService.get<string>('AI_STREAM', 'false') === 'true';

    const prompt =
      previousOutput && validationError
        ? [
            buildSqlGenerationPrompt({
              businessContext,
              schema,
              question: enrichedQuestion,
            }),
            '',
            'Perbaiki output sebelumnya agar menjadi SATU SQL SELECT yang valid.',
            `Output sebelumnya: ${previousOutput}`,
            `Alasan ditolak validator: ${validationError}`,
            'Aturan tambahan:',
            '- Jangan beri penjelasan, markdown, komentar, placeholder, atau ellipsis.',
            '- Jangan gunakan UNION kecuali benar-benar diperlukan dan semua tabel/kolom jelas ada di schema.',
            '- Jika pertanyaan ambigu, pilih query SELECT paling aman dan sederhana berdasarkan schema yang tersedia.',
            'Output: SQL query saja.',
          ].join('\n')
        : buildSqlGenerationPrompt({
            businessContext,
            schema,
            question: enrichedQuestion,
          });

    return this.aiService.generate(prompt, useStreaming);
  }

  private enrichQuestionWithTableHints(question: string): string {
    const matchedTables = this.machineTableAliases
      .filter(({ alias }) => alias.test(question))
      .map(({ tableName }) => tableName);

    if (matchedTables.length === 0) {
      return question;
    }

    return [
      question,
      '',
      `Hint sistem: nama mesin pada pertanyaan ini merujuk langsung ke tabel ${matchedTables.join(', ')}.`,
      'Gunakan tabel tersebut sebagai sumber utama query, bukan sebagai nilai filter kolom.',
    ].join('\n');
  }

  private tryBuildLatestRowsShortcut(question: string, schema: DatabaseSchema): string | null {
    const latestRowsMatch = question.match(/\b(?:tampilkan|ambil|show)\s+(\d+)\s+data\s+terakhir\b/i);
    if (!latestRowsMatch) {
      return null;
    }

    const requestedLimit = Number(latestRowsMatch[1]);
    if (!Number.isFinite(requestedLimit) || requestedLimit <= 0) {
      return null;
    }

    const matchedAlias = this.machineTableAliases.find(({ alias }) => alias.test(question));
    if (!matchedAlias) {
      return null;
    }

    const table = schema.tables.find(({ name }) => name === matchedAlias.tableName);
    if (!table) {
      return null;
    }

    const orderColumn = this.resolveLatestOrderColumn(table.columns.map((column) => column.name));
    return `SELECT * FROM ${matchedAlias.tableName} ORDER BY \`${orderColumn}\` DESC LIMIT ${requestedLimit};`;
  }

  private resolveLatestOrderColumn(columns: string[]): string {
    const preferredColumns = ['create', 'created_at', 'createdAt', 'time_job', 'id'];
    return preferredColumns.find((column) => columns.includes(column)) ?? columns[0] ?? 'id';
  }
}
