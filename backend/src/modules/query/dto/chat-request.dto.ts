import { IsString, Length } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @Length(1, 1000)
  message!: string;
}

