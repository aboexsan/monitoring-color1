# 📱 Deploy Monitoring Color — Vercel + Upstash (GRATIS, TANPA KARTU)

## A. Upload file baru ke GitHub repo kamu (±3 menit)

1. Buka repo `monitoring-color` kamu di github.com
2. Klik **Add file → Upload files**
3. Dari folder hasil ekstrak zip ini, **drag & drop**:
   - folder `api` (berisi 3 file)
   - `vercel.json`
   - `README-VERCEL.md`
   - `package.json` (replaces the old one — GitHub will show "package.json already exists, replacing")
4. Klik **Commit changes**.
   (File lama seperti server.js / data boleh dibiarkan — tidak mengganggu)

## B. Buat database Upstash (±2 menit)

1. Buka **upstash.com** → **Sign in with GitHub**
2. **Create Database** → nama bebas → region **Singapore** → plan **Free** → Create
3. Di halaman database, cari **REST API** → copy **UPSTASH_REDIS_REST_URL** dan **UPSTASH_REDIS_REST_TOKEN**

## C. Deploy ke Vercel (±3 menit)

1. Buka **vercel.com** → **Continue with GitHub** → izinkan
2. **Add New… → Project** → cari repo `monitoring-color` → **Import**
3. Framework Preset biarkan **Other** → langsung klik **Deploy**
4. Tunggu ±1 menit → akan dapat URL seperti `monitoring-color-xxx.vercel.app`
5. Buka URL → halaman login muncul → login QE1/qe1 sudah bisa!

## D. Hubungkan database (WAJIB, ±2 menit)

1. Di Vercel: project `monitoring-color` → tab **Settings** → **Environment Variables**
2. Tambah 2 variabel:
   - `UPSTASH_REDIS_REST_URL` = (paste dari langkah B)
   - `UPSTASH_REDIS_REST_TOKEN` = (paste dari langkah B)
3. **Save** → tab **Deployments** → klik titik tiga di deployment teratas → **Redeploy**
4. Selesai ✅ — sekarang semua data tersimpan permanen di cloud.

## Akun
- QE1 / qe1 → Admin (edit penuh)
- Tosso1 / tossо1, Tosso2 / tosso2, QSS / qss → Operator (input saja)

⚠️ Catatan: password masih default — jangan lupa diganti sebelum dipakai serius.
