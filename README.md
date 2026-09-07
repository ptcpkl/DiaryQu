# DiaryQu

DiaryQu adalah aplikasi manajemen keluarga berbasis nilai Islami yang dibangun dengan React Native, Supabase, Zustand, dan React Navigation.

## Supabase

Project URL yang digunakan aplikasi:

`https://tcerisohqvlxvzpecwoi.supabase.co`

Client menggunakan publishable key Supabase. Publishable key memang ditujukan untuk aplikasi publik; jangan pernah menaruh `service_role` atau secret key di source code mobile.

Database schema DiaryQu dikelola melalui folder `supabase/migrations`.

## Frontend demo mode

Selama fase frontend-first, `src/config/appMode.ts` mengaktifkan `FRONTEND_DEMO_MODE`.

Saat aktif:

- tombol `Log In` langsung masuk tanpa autentikasi Supabase
- user demo menggunakan identitas `Pak Dahlan`
- Family Room demo menggunakan `Keluarga Pak Dahlan` dengan role `head`
- Agenda memakai repository in-memory agar UI CRUD dapat diuji tanpa database
- `Log Out` mengembalikan aplikasi ke Login

Supabase dan service production tetap berada di codebase. Setelah UI selesai, demo mode dapat dimatikan tanpa membangun ulang screen dari nol.

## Flow aplikasi saat ini

`Login → Demo Session → Family Room Demo → Home`

Saat demo mode dimatikan, flow kembali menggunakan Supabase Auth + Family Room backend.

## Development

```bash
npm install
npm run android
```

## Quality checks

```bash
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```
