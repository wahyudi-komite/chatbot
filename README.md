# AI Database Assistant

Fullstack AI Agent untuk membaca database bisnis menggunakan bahasa alami dengan backend NestJS, frontend Angular standalone, MySQL, dan Ollama `llama3`.

## Struktur Folder

```text
backend/
  src/
    modules/
      ai/
      chat/
      database/
      query/
      response/
      schema/
    prompts/
frontend/
  src/app/
    core/
    features/chat/
    services/
    shared/
```

## Flow Utama

1. User mengirim pertanyaan ke `POST /api/chat`
2. `SchemaService` memuat schema dari MySQL atau file JSON
3. `QueryBuilderService` membuat prompt dinamis lalu memanggil Ollama
4. `QueryValidatorService` memastikan SQL hanya `SELECT`
5. `QueryExecutorService` menjalankan query ke MySQL dengan limit aman
6. `ResponseFormatterService` mengubah hasil query menjadi jawaban natural language

## Konfigurasi Backend

Salin `backend/.env.example` menjadi `backend/.env`, lalu isi:

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `AI_ENDPOINT`, `AI_MODEL`
- `BUSINESS_CONTEXT`
- `QUERY_MAX_ROWS`
- `DB_SCHEMA_FILE` bila ingin memakai schema JSON

## Konfigurasi Frontend

- Ubah `frontend/public/app-config.js` untuk mengarah ke URL backend
- File `frontend/.env.example` disediakan sebagai referensi deployment

## Menjalankan Aplikasi

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Endpoint

`POST /api/chat`

Request:

```json
{
  "message": "tampilkan 10 data terakhir dari nama tabel mc02_prespincyb"
}
```

Response:

```json
{
  "reply": "Total produksi bulan ini adalah 12.450 unit.",
  "sql": "SELECT COALESCE(SUM(quantity), 0) AS total_production FROM productions WHERE YEAR(production_date) = YEAR(CURDATE()) AND MONTH(production_date) = MONTH(CURDATE()) LIMIT 1;"
}
```

## Catatan Reusability

- Prompt AI tersentral di `backend/src/prompts/`
- Context bisnis bisa diganti dari `.env`
- Loader schema tidak menghardcode tabel
- Frontend hanya berkomunikasi ke backend API sehingga database/schema dapat berubah tanpa ubah UI
