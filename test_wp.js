require('dotenv').config();
const axios = require('axios');

function buildXml(user, pass) {
  return '<?xml version="1.0"?><methodCall><methodName>wp.getProfile</methodName><params><param><value><int>1</int></value></param><param><value><string>' + user + '</string></value></param><param><value><string>' + pass + '</string></value></param></params></methodCall>';
}

const combos = [
  ['kisangyu624@gmail.com', 'Yks@036624/'],
  ['kisangyu624', 'Yks@036624/'],
  ['kisangyu', 'Yks@036624/'],
];

async function test() {
  for (const [u, p] of combos) {
    try {
      const r = await axios.post('https://staywellgo.com/xmlrpc.php', buildXml(u, p), {headers:{'Content-Type':'text/xml'}});
      const ok = !r.data.includes('faultCode');
      console.log((ok ? '✅ 성공!' : '❌ 실패:'), u);
      if (ok) console.log('  -> 사용자명:', u);
    } catch(e) { console.log('오류:', e.message); }
  }
}
test();
