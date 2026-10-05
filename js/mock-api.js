// A fake backend so you can build and fix the front end on its own.
// It is only used while CONFIG.USE_MOCK is true in config.js.
function makeSamplePdf() {
  const stream = 'BT /F1 18 Tf 20 70 Td (Sample book PDF) Tj ET';
  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 150]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',
    '<</Length ' + stream.length + '>>\nstream\n' + stream + '\nendstream',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>'
  ];
  let out = '%PDF-1.4\n', offsets = [];
  objs.forEach((o, i) => { offsets.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
  const xref = out.length;
  out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' +
    offsets.map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('') +
    'trailer\n<</Size ' + (objs.length + 1) + '/Root 1 0 R>>\nstartxref\n' + xref + '\n%%EOF';
  return out;
}
const SAMPLE_PDF = makeSamplePdf();

// Uploaded PDFs are kept in this browser (small ones only) so View and Read PDF open the real file.
const readAsDataUrl = f => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(null); r.readAsDataURL(f); });
const dataUrlToBlob = u => { const [h, d] = u.split(','); const bin = atob(d); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: 'application/pdf' }); };

const mock = (() => {
  const seed = {
    books: [
      { id: 1, title: 'Clean Code', author: 'Robert Martin', category: 'Programming', has_pdf: true },
      { id: 2, title: 'Things Fall Apart', author: 'Chinua Achebe', category: 'Fiction', has_pdf: true },
      { id: 3, title: 'Atomic Habits', author: 'James Clear', category: 'Self help', has_pdf: false },
      { id: 4, title: 'The Diary of A Wimpy Kid', author: 'Jeff Kinney', category: 'Children fiction', image:'../images/Diary of a Wimpy Kid (BK1) by Jeff Kinney.jpeg', has_pdf: false }
    ],
    members: [{ id: 1, name: 'Ada Obi', email: 'ada@example.com', created_at: '2026-09-20' }]
  };
  let data;
  try { data = JSON.parse(localStorage.getItem('mock-db')) || seed; } catch (e) { data = seed; }
  data.admins = data.admins || [];   // older saved demo data has no admins list
  let pdfs;
  try { pdfs = JSON.parse(localStorage.getItem('mock-pdfs')) || {}; } catch (e) { pdfs = {}; }
  return { data, pdfs, save() {
    try { localStorage.setItem('mock-db', JSON.stringify(this.data)); } catch (e) {}
    try { localStorage.setItem('mock-pdfs', JSON.stringify(this.pdfs)); } catch (e) {}
  } };
})();

const mockReply = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function mockApi(url, opts = {}) {
  await new Promise(r => setTimeout(r, 250));
  const method = (opts.method || 'GET').toUpperCase();
  const b = opts.body instanceof FormData ? Object.fromEntries(opts.body.entries()) : (opts.body || {});
  const path = url.split('?')[0];
  const m = path.match(/^\/api\/books\/(\d+)(\/pdf)?$/);
  const book = m && mock.data.books.find(x => x.id === Number(m[1]));
  const clean = s => String(s || '').trim();
  const fail = msg => { throw new Error(msg); };
  const hasFile = b.pdf && b.pdf.size > 0;
  const imgData = b.image && b.image.size > 0 && b.image.size < 500 * 1024
? await readAsDataUrl(b.image) : null;
  const pdfData = hasFile && b.pdf.size < 2 * 1024 * 1024 ? await readAsDataUrl(b.pdf) : null;

  if (path === '/api/auth/login') {
    if (!clean(b.email) || !b.password) fail('Invalid email or password');
    const admin = b.portal === 'admin' && mock.data.admins.find(a => a.email === clean(b.email).toLowerCase());
    return mockReply({ token: 'demo-token', role: b.portal === 'admin' ? 'admin' : 'member', name: admin ? admin.name : clean(b.email).split('@')[0] });
  }
  if (path === '/api/auth/register-admin') {
    const email = clean(b.email).toLowerCase();
    if (!clean(b.name) || !email || String(b.password || '').length < 8)
      fail('Enter your name, email, and a password of 8+ characters');
    if (clean(b.code).toUpperCase() !== CONFIG.ADMIN_CODE) fail('That admin access code is not correct');
    if (mock.data.admins.some(a => a.email === email)) fail('An admin with this email already exists');
    mock.data.admins.push({ id: Date.now(), name: clean(b.name), email });   // demo only: passwords are never stored
    mock.save();
    return mockReply({ ok: true }, 201);
  }
  if (path === '/api/auth/register') {
    if (!clean(b.name) || !clean(b.email) || String(b.password || '').length < 8)
      fail('Enter your name, email, and a password of 8+ characters');
    mock.data.members.unshift({ id: Date.now(), name: clean(b.name), email: clean(b.email), created_at: new Date().toISOString().slice(0, 10) });
    mock.save();
    return mockReply({ ok: true }, 201);
  }
  if (path === '/api/books' && method === 'GET')
    return mockReply([...mock.data.books].sort((x, y) => x.title.localeCompare(y.title)));
  if (path === '/api/books' && method === 'POST') {
    if (!clean(b.title) || !clean(b.author)) fail('Title and author are required');
    const id = Date.now();
    mock.data.books.push({ id, title: clean(b.title), author: clean(b.author), category: clean(b.category) || null, has_pdf: !!hasFile, image: imgData });
    if (pdfData) mock.pdfs[id] = pdfData;
    mock.save();
    return mockReply({ ok: true }, 201);
  }
  if (m && !m[2] && method === 'PUT') {
    if (!book) fail('Book not found');
    if (!clean(b.title) || !clean(b.author)) fail('Title and author are required');
    Object.assign(book, { title: clean(b.title), author: clean(b.author), category: clean(b.category) || null, has_pdf: book.has_pdf || !!hasFile });
    if (imgData) book.image = imgData;
    if (pdfData) mock.pdfs[book.id] = pdfData;
    mock.save();
    return mockReply({ ok: true });
  }
  if (m && !m[2] && method === 'DELETE') {
    if (!book) fail('Book not found');
    mock.data.books = mock.data.books.filter(x => x !== book);
    delete mock.pdfs[book.id];
    mock.save();
    return mockReply({ ok: true });
  }
  if (m && m[2]) {
    if (!book || !book.has_pdf) fail('No PDF for this book yet');
    return new Response(mock.pdfs[book.id] ? dataUrlToBlob(mock.pdfs[book.id]) : new Blob([SAMPLE_PDF], { type: 'application/pdf' }));
  }
  if (path === '/api/admin/stats') return mockReply({
    books: mock.data.books.length,
    pdfs: mock.data.books.filter(x => x.has_pdf).length,
    members: mock.data.members.length
  });
  if (path === '/api/admin/members') return mockReply(mock.data.members);
  fail('Demo mode has no route for ' + method + ' ' + path);
}
