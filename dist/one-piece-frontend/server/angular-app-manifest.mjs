
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "preload": [
      "chunk-TWXHY3RU.js",
      "chunk-JLCK43JV.js",
      "chunk-FC3TEKEO.js"
    ],
    "route": "/"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-7D5MYWUU.js",
      "chunk-FC3TEKEO.js"
    ],
    "route": "/login"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-FGXSJY7M.js",
      "chunk-JLCK43JV.js",
      "chunk-FC3TEKEO.js"
    ],
    "route": "/season/*"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 12952, hash: '5844ce35c37008d065922395e8dc243f8bd795022909abab9f23f2ea70eece77', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1005, hash: '50235cef6e11440fb3a9a57d27d0bc4d4dc909edecc655140bc5e9b2254726c9', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'login/index.html': {size: 18170, hash: 'a193635a06206f3aba0a2f0d0faddf140292f9a80c39a769860a7698996f32b3', text: () => import('./assets-chunks/login_index_html.mjs').then(m => m.default)},
    'index.html': {size: 44989, hash: '74a0b11ef48a6cb427c8b065231101e05c336baf9de4c90a26e9a079b0874a38', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-WCPYCY2E.css': {size: 25263, hash: 'W35fNgbFCN8', text: () => import('./assets-chunks/styles-WCPYCY2E_css.mjs').then(m => m.default)}
  },
};
