import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SchemaModule } from '../schema/schema.module';
import { ResponseFormatterService } from './response-formatter.service';

@Module({
  imports: [AiModule, SchemaModule],
  providers: [ResponseFormatterService],
  exports: [ResponseFormatterService],
})
export class ResponseModule {}

