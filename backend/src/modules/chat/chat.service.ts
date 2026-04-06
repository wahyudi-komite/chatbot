import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueryBuilderService } from '../query/query-builder.service';
import { QueryExecutorService } from '../query/query-executor.service';
import { QueryValidatorService } from '../query/query-validator.service';
import { ResponseFormatterService } from '../response/response-formatter.service';
import { SchemaService } from '../schema/schema.service';

interface CachedChatResponse {
  expiresAt: number;
  value: { reply: string; sql?: string; rows?: Record<string, unknown>[] };
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly cache = new Map<string, CachedChatResponse>();

  constructor(
    private readonly configService: ConfigService,
    private readonly queryBuilderService: QueryBuilderService,
    private readonly queryValidatorService: QueryValidatorService,
    private readonly queryExecutorService: QueryExecutorService,
    private readonly responseFormatterService: ResponseFormatterService,
    private readonly schemaService: SchemaService,
  ) {}

  async handleMessage(
    message: string,
  ): Promise<{ reply: string; sql?: string; rows?: Record<string, unknown>[] }> {
    const sanitizedMessage = this.sanitizeMessage(message);
    const cached = this.getCachedResponse(sanitizedMessage);

    if (cached) {
      this.logger.log(`Serving cached response for message: ${sanitizedMessage}`);
      return cached;
    }

    const schemaSummaryResponse = await this.tryHandleSchemaSummaryQuestion(sanitizedMessage);
    if (schemaSummaryResponse) {
      this.storeCache(sanitizedMessage, schemaSummaryResponse);
      return schemaSummaryResponse;
    }

    const sql = await this.generateValidatedSql(sanitizedMessage);
    const rows = await this.queryExecutorService.execute(sql);
    const reply = await this.responseFormatterService.format(sanitizedMessage, sql, rows);

    const response = {
      reply,
      sql,
      rows: rows as Record<string, unknown>[],
    };

    this.storeCache(sanitizedMessage, response);
    return response;
  }

  private sanitizeMessage(message: string): string {
    return message.replace(/\s+/g, ' ').trim();
  }

  private getCachedResponse(
    message: string,
  ): { reply: string; sql?: string; rows?: Record<string, unknown>[] } | null {
    if (this.configService.get<string>('ENABLE_CHAT_CACHE', 'true') !== 'true') {
      return null;
    }

    const entry = this.cache.get(message);
    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.delete(message);
      return null;
    }

    return entry.value;
  }

  private storeCache(
    message: string,
    value: { reply: string; sql?: string; rows?: Record<string, unknown>[] },
  ): void {
    if (this.configService.get<string>('ENABLE_CHAT_CACHE', 'true') !== 'true') {
      return;
    }

    const ttl = this.configService.get<number>('CHAT_CACHE_TTL_MS', 120000);
    this.cache.set(message, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  private async generateValidatedSql(message: string): Promise<string> {
    let generatedSql = await this.queryBuilderService.buildSql(message);

    try {
      return this.queryValidatorService.validateAndNormalize(generatedSql);
    } catch (error) {
      if (!(error instanceof BadRequestException)) {
        throw error;
      }

      const validationMessage = this.extractExceptionMessage(error);
      this.logger.warn(`Generated SQL rejected, retrying once. Reason: ${validationMessage}`);

      generatedSql = await this.queryBuilderService.repairSql(
        message,
        generatedSql,
        validationMessage,
      );

      return this.queryValidatorService.validateAndNormalize(generatedSql);
    }
  }

  private extractExceptionMessage(error: BadRequestException): string {
    const response = error.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response &&
      typeof response.message === 'string'
    ) {
      return response.message;
    }

    return error.message;
  }

  private async tryHandleSchemaSummaryQuestion(
    message: string,
  ): Promise<{ reply: string; sql?: string; rows?: Record<string, unknown>[] } | null> {
    const normalized = message.toLowerCase();
    const asksTableCount =
      normalized.includes('jumlah tabel') ||
      normalized.includes('berapa tabel') ||
      normalized.includes('ada berapa tabel') ||
      normalized.includes('total tabel');
    const asksTableNames =
      normalized.includes('nama tabel') ||
      normalized.includes('daftar tabel') ||
      normalized.includes('list tabel') ||
      normalized.includes('semua tabel');

    if (!asksTableCount && !asksTableNames) {
      return null;
    }

    const schema = await this.schemaService.getSchema();
    if (asksTableNames) {
      const rows = schema.tables.map((table, index) => ({
        no: index + 1,
        nama_tabel: table.name,
        jumlah_kolom: table.columns.length,
      }));

      return {
        reply: `Berikut daftar ${rows.length} tabel yang ada di database ${schema.database}.`,
        rows,
      };
    }

    const totalTables = schema.tables.length;

    return {
      reply: `Terdapat ${totalTables} tabel di dalam database ${schema.database}.`,
      rows: [
        {
          database: schema.database,
          jumlah_tabel: totalTables,
        },
      ],
    };
  }
}
