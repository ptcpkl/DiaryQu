# DiaryQu

DiaryQu adalah aplikasi manajemen keluarga berbasis nilai Islami yang dibangun dengan React Native, Supabase, Zustand, dan React Navigation.

## Supabase

Project URL yang digunakan aplikasi:

`https://tcerisohqvlxvzpecwoi.supabase.co`

Client menggunakan publishable key Supabase. Publishable key memang ditujukan untuk aplikasi publik; jangan pernah menaruh `service_role` atau secret key di source code mobile.

Database schema DiaryQu dikelola melalui folder `supabase/migrations`.

## Flow aplikasi saat ini

`Login → cek Family Room → Buat/Gabung Family Room → Home`

Role `head/member` ditentukan oleh RPC database dan tidak diterima sebagai input bebas dari client.

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
