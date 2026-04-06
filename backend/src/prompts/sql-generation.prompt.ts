import { DatabaseSchema } from '../modules/schema/schema.types';

export interface SqlPromptInput {
  businessContext: string;
  schema: DatabaseSchema;
  question: string;
}

export function buildSqlGenerationPrompt(input: SqlPromptInput): string {
  const tableNotes = [
    '- Tabel mc09_nr_conrod adalah mesin NUT RUNNER BOLT CONROD.',
    '- Jika user menyebut mesin NUT RUNNER BOLT CONROD, gunakan tabel mc09_nr_conrod.',
    '- Jangan mengartikan NUT RUNNER BOLT CONROD sebagai nilai filter kolom seperti mc, line, atau process kecuali user memang meminta filter kolom tersebut.',
  ].join('\n');
  const schemaText = input.schema.tables
    .map((table) => {
      const columns = table.columns
        .map(
          (column) =>
            `- ${column.name} (${column.type}, nullable: ${column.nullable ? 'yes' : 'no'}, key: ${column.key || 'none'})`,
        )
        .join('\n');

      return `Table: ${table.name}\n${columns}`;
    })
    .join('\n\n');

  return [
    'Role: Kamu adalah AI database assistant.',
    `Context bisnis: ${input.businessContext}`,
    `Database aktif: ${input.schema.database}`,
    'Tugas: ubah pertanyaan user menjadi SQL query.',
    'Rules:',
    '- Hanya boleh menghasilkan satu SQL SELECT read-only.',
    '- Dilarang menggunakan INSERT, UPDATE, DELETE, DROP, TRUNCATE, ALTER, CREATE, REPLACE, GRANT, REVOKE, UNION berbasis injeksi, komentar SQL, atau multiple statements.',
    '- Gunakan nama tabel dan kolom persis seperti schema.',
    '- Hanya gunakan tabel yang benar-benar ada pada schema yang diberikan.',
    '- Jangan query INFORMATION_SCHEMA, performance_schema, mysql, atau sys.',
    '- Jangan gunakan placeholder seperti database_name, nama_database, your_table, atau sejenisnya.',
    '- Jika ada mapping nama mesin ke tabel pada catatan tabel penting, prioritaskan tabel tersebut secara langsung.',
    '- Bila perlu agregasi, gunakan alias yang jelas.',
    '- Tambahkan LIMIT wajar bila query berpotensi mengembalikan banyak baris.',
    '- Output harus SQL query saja tanpa markdown atau penjelasan.',
    'Few-shot examples:',
    'Q: tampilkan 5 data terakhir untuk mesin NUT RUNNER BOLT CONROD',
    'A: SELECT * FROM mc09_nr_conrod ORDER BY `create` DESC LIMIT 5;',
    'Q: tampilkan 10 data terakhir dari nama tabel mc02_prespincyb',
    'A: SELECT * FROM mc02_prespincyb ORDER BY `create` DESC LIMIT 10;',
    'Q: Produk mana dengan stok terendah?',
    'A: SELECT sku, stock FROM inventories ORDER BY stock ASC LIMIT 10;',
    'Catatan tabel penting:',
    tableNotes,
    'Schema:',
    schemaText,
    `User question: ${input.question}`,
    'Output: SQL query saja.',
  ].join('\n');
}
