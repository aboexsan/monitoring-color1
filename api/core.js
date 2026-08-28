// ============================================================
//  core.js — logika API Monitoring Color (Vercel serverless)
//  Semua data & session tersimpan di Upstash Redis (REST, gratis)
// ============================================================
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const L = require('../logic.js');

const UP_URL = process.env.UPSTASH_REDIS_REST_URL;
const UP_TOK = process.env.UPSTASH_REDIS_REST_TOKEN;
const upOn = () => !!(UP_URL && UP_TOK);
const DB_KEY = 'monitoring-color-db';
const SESS_TTL = 7 * 24 * 3600 * 1000; // 7 hari

// ---------- Upstash REST (format resmi: command JSON array) ----------
async function upCmd(cmd){
  const r = await fetch(UP_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UP_TOK}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  if(!r.ok) throw new Error('Upstash HTTP ' + r.status);
  const j = await r.json();
  if(j.error) throw new Error('Upstash: ' + j.error);
  return ('result' in j) ? j.result : null;
}
async function upGet(key){
  const result = await upCmd(['get', key]);
  return result ? JSON.parse(result) : null;
}
async function upSet(key, val){
  await upCmd(['set', key, JSON.stringify(val)]);
}
async function upDel(key){
  await upCmd(['del', key]);
}

// ---------- password ----------
function hash(pw, salt){ return crypto.createHash('sha256').update(salt + ':' + pw).digest('hex'); }

// ---------- database default ----------
function defaultDB(){
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-db.json'), 'utf8'));
  return {
    users: [
      {id:'QE1',    label:'Admin Utama',    role:'admin',    salt:'s1', pass: hash('qe1','s1')},
      {id:'Tosso1', label:'Operator Input', role:'operator', salt:'s2', pass: hash('tosso1','s2')},
      {id:'Tosso2', label:'Operator Input', role:'operator', salt:'s3', pass: hash('tosso2','s3')},
      {id:'QSS',    label:'Operator Input', role:'operator', salt:'s4', pass: hash('qss','s4')}
    ],
    units: seed.units,
    measurements: seed.measurements || []
  };
}
async function getDB(){
  if(!upOn()) throw new Error('Database cloud belum siap — env UPSTASH belum diisi');
  let db = await upGet(DB_KEY);
  if(!db){ db = defaultDB(); await upSet(DB_KEY, db); }
  return db;
}
async function saveDB(db){ db.savedAt = new Date().toISOString(); await upSet(DB_KEY, db); }

// ---------- session ----------
async function createSession(user){
  const sid = crypto.randomBytes(24).toString('hex');
  await upSet('sess:' + sid, { user: {id:user.id, role:user.role, label:user.label}, exp: Date.now() + SESS_TTL });
  return sid;
}
async function getSession(sid){
  if(!sid) return null;
  const s = await upGet('sess:' + sid);
  if(!s || (s.exp && Date.now() > s.exp)){ if(s) await upDel('sess:' + sid); return null; }
  return s.user;
}

const safeDB = db => ({ units: db.units, measurements: db.measurements });
const publicUser = u => ({ id: u.id, role: u.role, label: u.label });

// ---------- ROUTER UTAMA ----------
async function handle(method, pathname, body, cookies){
  try{
    // ---- LOGIN ----
    if(method === 'POST' && pathname === '/api/login'){
      const db = await getDB();
      const u = db.users.find(x => x.id.toLowerCase() === String(body.id||'').toLowerCase() && x.pass === hash(String(body.pw||''), x.salt));
      if(!u) return { status: 401, json: { error: 'ID atau password salah — cek lagi ya' } };
      const sid = await createSession(u);
      return { status: 200, json: { user: publicUser(u), db: safeDB(db) }, setCookie: `sid=${sid}; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=${SESS_TTL/1000}` };
    }

    // ---- LOGOUT ----
    if(method === 'POST' && pathname === '/api/logout'){
      if(cookies.sid) await upDel('sess:' + cookies.sid);
      return { status: 200, json: { ok: true }, setCookie: 'sid=; HttpOnly; Path=/; Max-Age=0' };
    }

    // ---- BOOTSTRAP ----
    if(method === 'GET' && pathname === '/api/bootstrap'){
      const user = await getSession(cookies.sid);
      if(!user) return { status: 200, json: { user: null, db: null } };
      const db = await getDB();
      return { status: 200, json: { user, db: safeDB(db) } };
    }

    const user = await getSession(cookies.sid);
    if(!user) return { status: 401, json: { error: 'Belum login' } };
    const db = await getDB();
    const isAdmin = user.role === 'admin';
    const deny = () => ({ status: 403, json: { error: 'Khusus admin — akun operator hanya bisa input data' } });

    // ---- INPUT PENGUKURAN (operator & admin) ----
    if(method === 'POST' && pathname === '/api/measurements'){
      const u = db.units.find(x => x.id === body.unitId);
      if(!u) return { status: 404, json: { error: 'Unit tidak ada' } };
      if(!body.tanggal || !body.rows || !Object.keys(body.rows).length) return { status: 400, json: { error: 'Data pengukuran tidak lengkap' } };
      const rec = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
        tanggal: String(body.tanggal), shift: String(body.shift||''), unitId: u.id,
        kode: String(body.kode||''), noBody: String(body.noBody||''), area: body.area || 'FULL',
        rows: body.rows
      };
      rec.maxDE = Math.max(...Object.values(rec.rows).flatMap(v => v.dE || []));
      rec.ng = L.hitungNG(rec).length;
      db.measurements.unshift(rec);
      const w = u.warna.find(x => x.kode === rec.kode);
      if(w){
        w.tanggal = rec.tanggal;
        w.status = rec.ng ? 'Perlu Cek' : 'Checked';
        w.lastUpdate = new Date().toISOString();
      }
      u.updated = new Date().toISOString();
      await saveDB(db);
      return { status: 200, json: { db: safeDB(db), rec } };
    }

    // ---- HAPUS PENGUKURAN (admin) ----
    let m = pathname.match(/^\/api\/measurements\/([^/]+)$/);
    if(method === 'DELETE' && m){
      if(!isAdmin) return deny();
      const before = db.measurements.length;
      db.measurements = db.measurements.filter(x => x.id !== m[1]);
      if(db.measurements.length === before) return { status: 404, json: { error: 'Record tidak ada' } };
      await saveDB(db);
      return { status: 200, json: { db: safeDB(db) } };
    }

    // ---- TAMBAH WARNA (admin) ----
    m = pathname.match(/^\/api\/units\/([^/]+)\/colors$/);
    if(method === 'POST' && m){
      if(!isAdmin) return deny();
      const u = db.units.find(x => x.id === m[1]);
      if(!u) return { status: 404, json: { error: 'Unit tidak ada' } };
      if(!body.nama || !String(body.nama).trim()) return { status: 400, json: { error: 'Nama warna wajib diisi' } };
      u.warna.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
        nama: String(body.nama).trim(), kode: String(body.kode||'').trim(), hex: body.hex || '#cccccc',
        status: body.status || 'N/Y Check', tanggal: body.tanggal || '', catatan: '',
        lastUpdate: new Date().toISOString()
      });
      u.updated = new Date().toISOString();
      await saveDB(db);
      return { status: 200, json: { db: safeDB(db) } };
    }

    // ---- EDIT WARNA (admin) ----
    m = pathname.match(/^\/api\/units\/([^/]+)\/colors\/([^/]+)$/);
    if(method === 'PUT' && m){
      if(!isAdmin) return deny();
      const u = db.units.find(x => x.id === m[1]);
      if(!u) return { status: 404, json: { error: 'Unit tidak ada' } };
      const w = u.warna.find(x => x.id === m[2]);
      if(!w) return { status: 404, json: { error: 'Warna tidak ada' } };
      if(body.nama    !== undefined) w.nama    = String(body.nama).trim();
      if(body.kode    !== undefined) w.kode    = String(body.kode).trim();
      if(body.hex     !== undefined) w.hex     = body.hex;
      if(body.status  !== undefined) w.status  = body.status;
      if(body.tanggal !== undefined) w.tanggal = body.tanggal;
      w.lastUpdate = new Date().toISOString();
      u.updated = new Date().toISOString();
      await saveDB(db);
      return { status: 200, json: { db: safeDB(db) } };
    }

    // ---- HAPUS WARNA (admin) ----
    if(method === 'DELETE' && m){
      if(!isAdmin) return deny();
      const u = db.units.find(x => x.id === m[1]);
      if(!u) return { status: 404, json: { error: 'Unit tidak ada' } };
      const before = u.warna.length;
      u.warna = u.warna.filter(x => x.id !== m[2]);
      if(u.warna.length === before) return { status: 404, json: { error: 'Warna tidak ada' } };
      u.updated = new Date().toISOString();
      await saveDB(db);
      return { status: 200, json: { db: safeDB(db) } };
    }

    return { status: 404, json: { error: 'Endpoint tidak ada' } };
  }catch(e){
    return { status: 500, json: { error: e.message || 'Server error' } };
  }
}

module.exports = { handle };
