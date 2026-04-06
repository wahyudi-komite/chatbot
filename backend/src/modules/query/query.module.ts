import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';
import { SchemaModule } from '../schema/schema.module';
import { QueryBuilderService } from './query-builder.service';
import { QueryExecutorService } from './query-executor.service';
import { QueryValidatorService } from './query-validator.service';

@Module({
  imports: [AiModule, DatabaseModule, SchemaModule],
  providers: [QueryBuilderService, QueryValidatorService, QueryExecutorService],
  exports: [QueryBuilderService, QueryValidatorService, QueryExecutorService],
})
export class QueryModule {}

