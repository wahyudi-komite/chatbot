import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SchemaService } from './schema.service';

@Module({
  imports: [DatabaseModule],
  providers: [SchemaService],
  exports: [SchemaService],
})
export class SchemaModule {}

