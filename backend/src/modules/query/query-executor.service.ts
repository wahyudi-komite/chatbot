import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class QueryExecutorService {
  private readonly logger = new Logger(QueryExecutorService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async execute(sql: string): Promise<unknown[]> {
    if (this.configService.get<string>('ENABLE_QUERY_LOGGING', 'true') === 'true') {
      this.logger.log(`Executing SQL: ${sql}`);
    }

    return this.databaseService.query(sql);
  }
}

