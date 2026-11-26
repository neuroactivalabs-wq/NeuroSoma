/* Códigos de desbloqueo: SHA-256 en JS puro (funciona sin internet y sin HTTPS) */
(function(){
  var primes=[];for(var n=2;primes.length<64;n++){var ok=true;for(var i=0;i<primes.length;i++){if(n%primes[i]===0){ok=false;break}}if(ok)primes.push(n)}
  var frac=function(x){return Math.floor((x-Math.floor(x))*4294967296)>>>0};
  var K=primes.map(function(p){return frac(Math.cbrt(p))});
  var H0=primes.slice(0,8).map(function(p){return frac(Math.sqrt(p))});
  function rotr(x,n){return (x>>>n)|(x<<(32-n))}
  function sha256(str){
    var msg=new TextEncoder().encode(str),l=msg.length,bits=l*8,pad=((l+9+63)>>6)<<6;
    var buf=new Uint8Array(pad);buf.set(msg);buf[l]=0x80;
    var dv=new DataView(buf.buffer);dv.setUint32(pad-4,bits>>>0);dv.setUint32(pad-8,Math.floor(bits/4294967296));
    var h=H0.slice(),w=new Uint32Array(64);
    for(var o=0;o<pad;o+=64){
      for(var i=0;i<16;i++)w[i]=dv.getUint32(o+i*4);
      for(i=16;i<64;i++){var a=w[i-15],b=w[i-2];
        var s0=rotr(a,7)^rotr(a,18)^(a>>>3),s1=rotr(b,17)^rotr(b,19)^(b>>>10);
        w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0}
      var A=h[0],B=h[1],C=h[2],D=h[3],E=h[4],F=h[5],G=h[6],Hh=h[7];
      for(i=0;i<64;i++){
        var S1=rotr(E,6)^rotr(E,11)^rotr(E,25),ch=(E&F)^(~E&G),t1=(Hh+S1+ch+K[i]+w[i])>>>0;
        var S0=rotr(A,2)^rotr(A,13)^rotr(A,22),mj=(A&B)^(A&C)^(B&C),t2=(S0+mj)>>>0;
        Hh=G;G=F;F=E;E=(D+t1)>>>0;D=C;C=B;B=A;A=(t1+t2)>>>0}
      h=[h[0]+A,h[1]+B,h[2]+C,h[3]+D,h[4]+E,h[5]+F,h[6]+G,h[7]+Hh].map(function(x){return x>>>0})
    }
    var out=new Uint8Array(32),odv=new DataView(out.buffer);h.forEach(function(x,i){odv.setUint32(i*4,x)});return out
  }
  var AL='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function codeFor(secret,id){
    var h=sha256(secret+'|'+String(id).toUpperCase().trim()),s='';
    for(var i=0;i<8;i++)s+=AL[h[i]%AL.length];
    return s.slice(0,4)+'-'+s.slice(4)
  }
  function norm(c){c=String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'');return c.length===8?c.slice(0,4)+'-'+c.slice(4):c}
  window.NSCode={sha256:sha256,codeFor:codeFor,norm:norm,AL:AL};
})();
