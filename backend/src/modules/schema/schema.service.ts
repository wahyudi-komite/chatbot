import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { DatabaseService } from '../database/database.service';
import { DatabaseSchema } from './schema.types';

interface SchemaCacheEntry {
  expiresAt: number;
  schema: DatabaseSchema;
}

@Injectable()
export class SchemaService {
  private readonly logger = new Logger(SchemaService.name);
  private cache?: SchemaCacheEntry;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async getSchema(forceRefresh = false): Promise<DatabaseSchema> {
    const ttl = this.configService.get<number>('SCHEMA_CACHE_TTL_MS', 300000);

    if (!forceRefresh && this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.schema;
    }

    const schema = (await this.loadSchemaFromJson()) ?? (await this.loadSchemaFromDatabase());
    this.cache = {
      schema,
      expiresAt: Date.now() + ttl,
    };

    return schema;
  }

  private async loadSchemaFromJson(): Promise<DatabaseSchema | null> {
    const filePath = this.configService.get<string>('DB_SCHEMA_FILE');

    if (!filePath) {
      return null;
    }

    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as DatabaseSchema;
  }

  private async loadSchemaFromDatabase(): Promise<DatabaseSchema> {
    const databaseName = this.configService.get<string>('DB_NAME');

    if (!databaseName) {
      throw new InternalServerErrorException('DB_NAME belum dikonfigurasi.');
    }

    const rows = await this.databaseService.query<{
      TABLE_NAME: string;
      COLUMN_NAME: string;
      COLUMN_TYPE: string;
      IS_NULLABLE: 'YES' | 'NO';
      COLUMN_KEY: string;
    }>(
      `
      SELECT
        TABLE_NAME,
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_KEY
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = '${databaseName}'
      ORDER BY TABLE_NAME, ORDINAL_POSITION;
      `,
    );

    if (rows.length === 0) {
      this.logger.warn('Schema database kosong atau tidak dapat dimuat.');
    }

    const tableMap = new Map<string, DatabaseSchema['tables'][number]>();

    for (const row of rows) {
      if (!tableMap.has(row.TABLE_NAME)) {
        tableMap.set(row.TABLE_NAME, {
          name: row.TABLE_NAME,
          columns: [],
        });
      }

      tableMap.get(row.TABLE_NAME)?.columns.push({
        name: row.COLUMN_NAME,
        type: row.COLUMN_TYPE,
        nullable: row.IS_NULLABLE === 'YES',
        key: row.COLUMN_KEY,
      });
    }

    return {
      database: databaseName,
      tables: Array.from(tableMap.values()),
    };
  }
}

