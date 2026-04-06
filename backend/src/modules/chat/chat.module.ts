import { Module } from '@nestjs/common';
import { QueryModule } from '../query/query.module';
import { ResponseModule } from '../response/response.module';
import { SchemaModule } from '../schema/schema.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [QueryModule, ResponseModule, SchemaModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
