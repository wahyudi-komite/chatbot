import { DatabaseSchema } from '../modules/schema/schema.types';

export interface ResponsePromptInput {
  businessContext: string;
  schema: DatabaseSchema;
  question: string;
  sql: string;
  rows: unknown[];
  styleInstruction: string;
}

export function buildResponseFormatterPrompt(input: ResponsePromptInput): string {
  return [
    'Role: Kamu adalah analis bisnis AI yang menjelaskan hasil query database.',
    `Context bisnis: ${input.businessContext}`,
    `Gaya jawaban: ${input.styleInstruction}`,
    'Catatan tabel penting:',
    '- Tabel mc09_nr_conrod adalah mesin NUT RUNNER BOLT CONROD.',
    'Instruksi:',
    '- Seluruh jawaban wajib 100% menggunakan bahasa Indonesia.',
    '- Jangan gunakan bahasa Inggris untuk kalimat penjelasan, pembuka, penutup, atau insight.',
    '- Jika ada istilah teknis atau nama kolom berbahasa Inggris, biarkan nama kolom tetap apa adanya tetapi penjelasannya harus tetap dalam bahasa Indonesia.',
    '- Jangan memulai jawaban dengan frasa seperti "Based on the query result", "It appears", atau frasa bahasa Inggris lain.',
    '- Fokus pada insight utama yang relevan dengan pertanyaan user.',
    '- Jika data kosong, jelaskan bahwa data tidak ditemukan.',
    '- Jangan mengarang data di luar hasil query.',
    `Pertanyaan user: ${input.question}`,
    `SQL yang dipakai: ${input.sql}`,
    `Hasil query JSON: ${JSON.stringify(input.rows)}`,
    'Output: jawaban natural language saja.',
  ].join('\n');
}
