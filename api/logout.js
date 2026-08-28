const { handle } = require('./core.js');
const PATH = '/api/logout';
module.exports = async (req, res) => {
  let body = {};
  if(req.method !== 'GET' && req.method !== 'DELETE'){
    body = await new Promise(resolve => {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => { try{ resolve(JSON.parse(b || '{}')); }catch(e){ resolve({}); } });
    });
  }
  const cookies = {};
  (req.headers.cookie || '').split(';').forEach(kv => {
    const i = kv.indexOf('=');
    if(i > 0) cookies[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
  });
  const out = await handle(req.method, PATH, body, cookies);
  if(out.setCookie) res.setHeader('Set-Cookie', out.setCookie);
  res.status(out.status).json(out.json);
};
