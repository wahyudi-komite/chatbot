import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QueryValidatorService {
  private readonly blockedPattern =
    /\b(insert|update|delete|drop|truncate|alter|replace|grant|revoke|merge|call|execute|exec|set)\b|--|\/\*|\*\/|;.*\S/i;
  private readonly blockedSystemSchemaPattern =
    /\b(information_schema|performance_schema|mysql|sys)\b/i;
  private readonly blockedPlaceholderPattern =
    /\b(database_name|nama_database|your_table|your_database)\b/i;

  constructor(private readonly configService: ConfigService) {}

  validateAndNormalize(sql: string): string {
    const cleaned = this.extractSelectQuery(sql);

    if (!/^select\b/i.test(cleaned)) {
      throw new BadRequestException('SQL harus berupa SELECT.');
    }

    if (this.blockedPattern.test(cleaned)) {
      throw new BadRequestException('SQL mengandung keyword atau pola berbahaya.');
    }

    if (this.blockedSystemSchemaPattern.test(cleaned)) {
      throw new BadRequestException('SQL tidak boleh mengakses schema sistem database.');
    }

    if (this.blockedPlaceholderPattern.test(cleaned)) {
      throw new BadRequestException('SQL mengandung placeholder yang bukan nama database atau tabel nyata.');
    }

    const maxRows = this.configService.get<number>('QUERY_MAX_ROWS', 100);
    return this.enforceLimit(cleaned, maxRows);
  }

  private enforceLimit(sql: string, maxRows: number): string {
    const withoutTrailingSemicolon = sql.replace(/;+\s*$/g, '');
    const limitMatch = withoutTrailingSemicolon.match(/\blimit\s+(\d+)\b/i);

    if (!limitMatch) {
      return `${withoutTrailingSemicolon} LIMIT ${maxRows};`;
    }

    const requestedLimit = Number(limitMatch[1]);
    if (requestedLimit > maxRows) {
      return withoutTrailingSemicolon.replace(/\blimit\s+\d+\b/i, `LIMIT ${maxRows}`) + ';';
    }

    return `${withoutTrailingSemicolon};`;
  }

  private extractSelectQuery(rawSql: string): string {
    const normalized = rawSql.trim().replace(/```sql|```/gi, '').trim();
    const selectMatch = normalized.match(/select[\s\S]*?(?:;|$)/i);

    return selectMatch ? selectMatch[0].trim() : normalized;
  }
}
