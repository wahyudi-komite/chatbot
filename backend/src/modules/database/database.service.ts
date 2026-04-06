import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(private readonly dataSource: DataSource) {}

  async query<T = unknown>(sql: string): Promise<T[]> {
    const result = await this.dataSource.query(sql);
    return Array.isArray(result) ? (result as T[]) : [];
  }
}

