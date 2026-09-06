# DiaryQu

DiaryQu adalah aplikasi manajemen keluarga berbasis nilai Islami yang dibangun dengan React Native, Supabase, Zustand, dan React Navigation.

## Supabase

Project URL yang digunakan aplikasi:

`https://tcerisohqvlxvzpecwoi.supabase.co`

Client menggunakan publishable key Supabase. Publishable key aman untuk aplikasi publik; jangan pernah menaruh `service_role` atau secret key di source code mobile.

Database schema DiaryQu dikelola melalui folder `supabase/migrations`.

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
