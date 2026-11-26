/* ============================================================
   CONFIGURACIÓN DE NEUROSOMA  (lo único que necesitas editar)
   Guarda el archivo y vuelve a subir la carpeta a Netlify.
   ============================================================ */
window.CONFIG = {
  // Tu WhatsApp para recibir el ID del cliente. Solo números, con código de país. Ejemplo Panamá: "50761234567"
  WA_NUMBER: "50764387978",
  // Enlace de tu catálogo donde se compra NeuroSoma VIP (EMP). Si lo dejas vacío, el botón de compra se oculta.
  CATALOGO_URL: "https://emp-neuroactiva.pages.dev/",
  // Precio que se muestra en la pantalla VIP
  PRECIO_TXT: "US$2.99",
  // Recursos imprimibles (1 al 6) que se pueden usar gratis. Los demás se abren con VIP.
  KIT_LIBRES: [1, 2],
  // LLAVE PÚBLICA para comprobar códigos de activación. Es pública a propósito: NO sirve para crear códigos.
  PUBLIC_KEY: {"kty":"EC","crv":"P-256","x":"fMooStjwoJ-muUB6YmGlnSAiiuYeTG8L8OoDvDg6ES4","y":"zVGS1J_OfDxG_-ukR8ZVLSQupStjxCQ5ce_Y5vZ1nVQ"},
  VERSION: "1.1.0"
};
