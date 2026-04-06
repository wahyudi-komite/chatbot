import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from '../query/dto/chat-request.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(
    @Body() dto: ChatRequestDto,
  ): Promise<{ reply: string; sql?: string; rows?: Record<string, unknown>[] }> {
    return this.chatService.handleMessage(dto.message);
  }
}
