import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from './modules/ai/ai.module';
import { ChatModule } from './modules/chat/chat.module';
import { DatabaseModule } from './modules/database/database.module';
import { QueryModule } from './modules/query/query.module';
import { ResponseModule } from './modules/response/response.module';
import { SchemaModule } from './modules/schema/schema.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [],
      useFactory: () => ({
        type: 'mysql' as const,
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 3306),
        username: process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_NAME ?? '',
        autoLoadEntities: false,
        synchronize: false,
      }),
    }),
    AiModule,
    DatabaseModule,
    SchemaModule,
    QueryModule,
    ResponseModule,
    ChatModule,
  ],
})
export class AppModule {}

