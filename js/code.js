/* Códigos de activación firmados (ECDSA P-256).
   Esta app SOLO contiene la llave PÚBLICA: sirve para comprobar códigos, no para crearlos.
   La llave privada vive únicamente en la herramienta privada del vendedor. */
(function () {
  var AL = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';           // alfabeto del ID del teléfono
  var B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';          // alfabeto del código
  function norm(s) { return String(s || '').toUpperCase().replace(/[^A-Z2-7]/g, ''); }
  function normId(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function b32dec(s) {
    var bits = 0, val = 0, out = [];
    for (var i = 0; i < s.length; i++) {
      val = (val << 5) | B32.indexOf(s[i]); bits += 5;
      if (bits >= 8) { bits -= 8; out.push((val >>> bits) & 255); val &= (1 << bits) - 1; }
    }
    return new Uint8Array(out);
  }
  function b32enc(bytes) {
    var bits = 0, val = 0, out = '';
    for (var i = 0; i < bytes.length; i++) {
      val = (val << 8) | bytes[i]; bits += 8;
      while (bits >= 5) { bits -= 5; out += B32[(val >>> bits) & 31]; val &= (1 << bits) - 1; }
    }
    if (bits > 0) out += B32[(val << (5 - bits)) & 31];
    return out;
  }
  function msg(id) { return new TextEncoder().encode('NSOMA1|' + String(id || '').toUpperCase()); }
  function verify(pubJwk, code, id) {
    try {
      var c = norm(code); if (c.length !== 103) return Promise.resolve(false);
      var sig = b32dec(c); if (sig.length !== 64) return Promise.resolve(false);
      if (!window.crypto || !crypto.subtle) return Promise.resolve(false);
      return crypto.subtle.importKey('jwk', pubJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
        .then(function (k) { return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, sig, msg(id)); })
        .catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }
  function sign(privJwk, id) {   // solo lo usa la herramienta privada del vendedor
    return crypto.subtle.importKey('jwk', privJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
      .then(function (k) { return crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, msg(id)); })
      .then(function (sig) { return b32enc(new Uint8Array(sig)).match(/.{1,6}/g).join('-'); });
  }
  window.NSCode = { AL: AL, norm: norm, normId: normId, verify: verify, sign: sign, b32enc: b32enc, b32dec: b32dec };
})();
