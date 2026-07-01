const STORAGE_KEY = 'vocab-cua-uyen-v2';

const CRITERIA = [
  'Từ vựng',
  'Phiên âm',
  'Loại từ',
  'Dịch nghĩa',
  'Dịch nghĩa + định nghĩa',
  'Ví dụ (NN/TV)',
  'Đồng nghĩa',
  'Trái nghĩa',
  'Band',
  'Topic'
];
const TOPICS = ['Business', 'Technology', 'Academic', 'Work/Study', 'Politics', 'Nature', 'Health', 'Economics', 'Personality', 'Communication'];
const BANDS = ['Band 5', 'Band 5.5', 'Band 6', 'Band 6.5', 'Band 7+'];
const PAGES = ['Dashboard', 'Library', 'Vocab List', 'Practice', 'Monthly Review', 'Settings'];

const seedItems = [
  {
    id: 'v1', word: 'confidential', ipa: '/ˌkɒn.fɪˈden.ʃəl/', type: 'adjective', meaning: 'bảo mật, bí mật',
    definition: 'Intended to be kept secret.', example: 'This document is confidential. / Tài liệu này là bảo mật.',
    synonyms: 'private, secret', antonyms: 'public, open', band: 'Band 6', topic: 'Business', source: 'IELTS',
    status: 'In Progress', mastery: 'Beginner', l3ds: 0.67, times: 1, createdAt: '2026-04-01'
  },
  {
    id: 'v2', word: 'advocate', ipa: '/ˈæd.və.keɪt/', type: 'verb/noun', meaning: 'ủng hộ; người ủng hộ',
    definition: 'To publicly support an idea or policy.', example: 'She advocates for better education. / Cô ấy ủng hộ giáo dục tốt hơn.',
    synonyms: 'support, promote', antonyms: 'oppose, reject', band: 'Band 6.5', topic: 'Politics', source: 'Article',
    status: 'Started', mastery: 'New', l3ds: 0, times: 0, createdAt: '2026-04-02'
  },
  {
    id: 'v3', word: 'fragile', ipa: '/ˈfrædʒ.aɪl/', type: 'adjective', meaning: 'dễ vỡ, mong manh',
    definition: 'Easily broken or damaged.', example: 'The vase is fragile. / Chiếc bình rất dễ vỡ.',
    synonyms: 'delicate, weak', antonyms: 'strong, durable', band: 'Band 5.5', topic: 'Nature', source: 'Book',
    status: 'Completed', mastery: 'Advanced', l3ds: 0.9, times: 2, createdAt: '2026-04-03'
  }
];

let state = loadState();
let draft = {
  quiz: state.draftQuiz || null,
  monthly: state.draftMonthly || { answers: {}, submitted: false, showCorrect: false }
};

function $(selector) { return document.querySelector(selector); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function today() { return new Date().toISOString().slice(0, 10); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function save() {
  state.draftQuiz = draft.quiz;
  state.draftMonthly = draft.monthly;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function loadState() {
  const base = {
    page: 'Dashboard',
    items: clone(seedItems),
    reviewLog: [],
    settings: {
      defaultQuestions: 10,
      defaultLanguage: 'Foreign',
      defaultCriteria: ['Loại từ', 'Dịch nghĩa', 'Đồng nghĩa'],
      strict: false,
      autoSaveOnSubmit: true,
      showCorrectOnSubmit: true,
      apiKey: ''
    },
    draftQuiz: null,
    draftMonthly: { answers: {}, submitted: false, showCorrect: false }
  };
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return base;
  }
}
function toast(message) {
  let box = $('#toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast';
    box.className = 'toast';
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => box.classList.remove('show'), 2600);
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}
function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s,;/.-]/g, '')
    .trim();
}
function avg(values) { return values.length ? values.reduce((sum, v) => sum + Number(v || 0), 0) / values.length : 0; }
function pct(value) { return `${Math.round((Number(value) || 0) * 100)}%`; }
function matchAnswer(answer, correct) {
  const a = normalize(answer);
  const c = normalize(correct);
  if (!a || !c) return false;
  if (state.settings.strict) return a === c;
  const parts = c.split(/[,;/]/).map(x => x.trim()).filter(Boolean);
  return a === c || parts.some(p => a === p || a.includes(p) || p.includes(a)) || c.includes(a);
}
function itemField(item, criterion) {
  const map = {
    'Từ vựng': item.word,
    'Phiên âm': item.ipa,
    'Loại từ': item.type,
    'Dịch nghĩa': item.meaning,
    'Dịch nghĩa + định nghĩa': item.definition,
    'Ví dụ (NN/TV)': item.example,
    'Đồng nghĩa': item.synonyms,
    'Trái nghĩa': item.antonyms,
    'Band': item.band,
    'Topic': item.topic
  };
  return map[criterion] || '';
}
function badge(text, type = 'neutral') { return `<span class="badge ${type}">${escapeHtml(text)}</span>`; }
function button(text, id, type = 'ghost') { return `<button id="${id}" class="${type}">${text}</button>`; }
function select(id, options, value) {
  return `<select id="${id}">${options.map(o => `<option value="${escapeHtml(o)}" ${o === value ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}</select>`;
}
function field(label, content) { return `<label class="field"><span>${label}</span>${content}</label>`; }
function pageHeader(title, subtitle, actions = '') {
  return `<div class="page-head"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="toolbar">${actions}</div></div>`;
}

function render() {
  renderNav();
  const main = $('#main');
  const views = { Dashboard, Library, 'Vocab List': VocabList, Practice, 'Monthly Review': MonthlyReview, Settings };
  main.innerHTML = views[state.page]();
  bindPageEvents();
  save();
}
function renderNav() {
  $('#nav').innerHTML = PAGES.map(page => `<button data-nav="${page}" class="${state.page === page ? 'active' : ''}">${page}</button>`).join('');
}

function Dashboard() {
  const completed = state.items.filter(i => i.status === 'Completed').length;
  const active = state.items.filter(i => i.status !== 'Completed' && i.status !== 'Storage').length;
  const score = avg(state.reviewLog.map(l => l.score));
  const due = getDueItems().slice(0, 6);
  return pageHeader('Dashboard', 'Tự động gợi ý từ cần ôn và theo dõi tiến độ.', `${button('Start Auto Practice', 'goPractice', 'primary')}`) + `
    <section class="stats">
      <div class="card stat"><span>Words Stored</span><b>${state.items.length}</b></div>
      <div class="card stat"><span>Active Words</span><b>${active}</b></div>
      <div class="card stat"><span>Completed</span><b>${completed}</b></div>
      <div class="card stat"><span>Avg Score</span><b>${pct(score)}</b></div>
    </section>
    <section class="grid2">
      <div class="card"><h3>Smart Review Queue</h3>${due.length ? due.map(i => `<p><b>${escapeHtml(i.word)}</b> ${badge(i.mastery)} <small>${escapeHtml(i.meaning)}</small></p>`).join('') : '<p class="empty">Không có từ cần ôn.</p>'}</div>
      <div class="card"><h3>Quick Actions</h3><div class="toolbar">${button('Add Word', 'quickAdd', 'primary')}${button('Review Due Words', 'reviewDue', 'submit')}${button('Import Text', 'quickImport', 'ghost')}</div><p class="hint">Workflow tối ưu: thêm từ → tự điền thông tin → app tự tạo bài → submit tự lưu log.</p></div>
    </section>
    <section class="grid2">
      <div class="card"><h3>Status Distribution</h3>${barChart(['Storage', 'Started', 'In Progress', 'Completed'].map(s => [s, state.items.filter(i => i.status === s).length]))}</div>
      <div class="card"><h3>Band Distribution</h3>${barChart(BANDS.map(b => [b, state.items.filter(i => i.band === b).length]))}</div>
    </section>`;
}
function barChart(rows) {
  const max = Math.max(1, ...rows.map(r => r[1]));
  return rows.map(([name, value]) => `<p><b>${escapeHtml(name)}</b> ${value}<div class="progress"><span style="width:${(value / max) * 100}%"></span></div></p>`).join('');
}
function getDueItems() {
  return [...state.items].filter(i => i.status !== 'Storage').sort((a, b) => (a.l3ds || 0) - (b.l3ds || 0) || (a.times || 0) - (b.times || 0));
}

function Library() {
  return pageHeader('Vocabulary Library', 'Kho từ tổng. Có thể add vào danh sách học chỉ bằng một nút.', `${button('+ Add Storage Word', 'addStorage', 'primary')}${button('Import Text', 'importText', 'ghost')}`) + `
    <div class="card table-wrap"><table><thead><tr><th>Status</th><th>Word</th><th>Meaning</th><th>Source</th><th>Band</th><th>Action</th></tr></thead><tbody>
      ${state.items.map(item => `<tr><td>${statusBadge(item.status)}</td><td><b>${escapeHtml(item.word)}</b></td><td>${escapeHtml(item.meaning)}</td><td>${escapeHtml(item.source || 'manual')}</td><td>${escapeHtml(item.band)}</td><td>${item.status === 'Storage' ? `<button data-start="${item.id}">Add to List</button>` : `<button data-practice-word="${item.id}">Practice</button>`}</td></tr>`).join('')}
    </tbody></table></div>`;
}
function statusBadge(status) {
  const type = status === 'Completed' ? 'good' : status === 'In Progress' ? 'warn' : 'neutral';
  return badge(status, type);
}

function VocabList() {
  return pageHeader('My Vocab List', 'Danh sách từ đang học. Add word sẽ tự tạo nghĩa/định nghĩa demo.', `${button('+ Add Word', 'addWord', 'primary')}${button('Auto Fill Missing', 'fillMissing', 'submit')}`) + `
    <div class="card kpi-line">${badge('Auto define')}${badge('L3Ds tự cập nhật')}${badge('Status tự đổi')}</div>
    <div class="card table-wrap"><table><thead><tr><th>🔊</th><th>Word</th><th>IPA</th><th>Type</th><th>Meaning</th><th>Definition</th><th>Example</th><th>Synonyms</th><th>Band</th><th>Topic</th><th>L3Ds</th><th>Status</th></tr></thead><tbody>
      ${state.items.filter(i => i.status !== 'Storage').map(item => `<tr><td><button data-speak="${item.id}">🔊</button></td><td><b>${escapeHtml(item.word)}</b></td><td>${escapeHtml(item.ipa)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.meaning)}</td><td>${escapeHtml(item.definition)}</td><td>${escapeHtml(item.example)}</td><td>${escapeHtml(item.synonyms)}</td><td>${escapeHtml(item.band)}</td><td>${escapeHtml(item.topic)}</td><td>${badge(pct(item.l3ds || 0), item.l3ds >= .8 ? 'good' : item.l3ds >= .5 ? 'warn' : 'bad')}</td><td>${statusBadge(item.status)}</td></tr>`).join('')}
    </tbody></table></div>`;
}

function Practice() {
  ensureQuiz();
  const quiz = draft.quiz;
  const answered = quiz.questions.filter(q => q.answers.some(Boolean)).length;
  const score = quiz.questions.length ? avg(quiz.questions.map(q => q.score || 0)) : 0;
  return pageHeader('Practice / Vocab Test', 'Workflow tối ưu: Auto Random → nhập đáp án → Submit & Auto Save.', '') + `
    <div class="practice-layout">
      <section class="card test-card">
        <div class="test-top"><h2>Vocab Test</h2><div class="score-big">${quiz.submitted ? pct(score) : `${answered}/${quiz.questions.length || 0}`}</div></div>
        <div class="controls">
          ${field('Mode', select('qMode', ['Due words', 'Random all', 'New words', 'Weak words'], quiz.mode))}
          ${field('Language', select('qLanguage', ['Foreign', 'Vietnamese'], quiz.language))}
          ${field('Number', `<input id="qCount" type="number" min="1" max="50" value="${quiz.count}">`)}
          ${button('Auto Random Set', 'randomSet', 'primary')}
          ${button('Submit & Auto Save', 'submitSave', 'submit')}
          ${button('Clear', 'clearQuiz', 'danger')}
        </div>
        <div class="criteria">${[0, 1, 2].map(i => field(`Criteria ${i + 1}`, select(`qCrit${i}`, CRITERIA, quiz.criteria[i]))).join('')}${button(quiz.showCorrect ? 'Hide Correct' : 'Show Correct', 'toggleCorrect', 'ghost')}</div>
        <p class="hint">Correct Answer tự ẩn trước khi submit. Sau submit, app tự chấm, tự lưu Review & Score, tự cập nhật L3Ds.</p>
        <div class="table-wrap"><table><thead><tr><th>Question</th><th>Check</th>${quiz.criteria.map(c => `<th>Your Answer<br><small>${escapeHtml(c)}</small></th>`).join('')}${quiz.criteria.map(c => `<th class="correct">Correct<br><small>${escapeHtml(c)}</small></th>`).join('')}</tr></thead><tbody>
          ${quiz.questions.map(q => practiceRow(q)).join('')}
        </tbody></table>${quiz.questions.length ? '' : '<div class="empty">Bấm Auto Random Set để tạo bài.</div>'}</div>
      </section>
      <aside class="card"><h2>Review & Score</h2>${state.reviewLog.slice(0, 12).map(log => `<div class="review-row"><b>${escapeHtml(log.date)}</b><span>${log.answers.length} words</span>${badge(pct(log.score), log.score >= .8 ? 'good' : log.score >= .5 ? 'warn' : 'bad')}</div>`).join('') || '<p class="empty">Chưa có lịch sử.</p>'}</aside>
    </div>`;
}
function practiceRow(q) {
  const item = state.items.find(i => i.id === q.itemId);
  const check = q.submitted ? badge(pct(q.score), q.score >= 1 ? 'good' : q.score > 0 ? 'warn' : 'bad') : '';
  return `<tr><td><b>${escapeHtml(q.question)}</b></td><td>${check}</td>${[0, 1, 2].map(i => `<td><input class="answer-input" data-answer="${q.id}:${i}" value="${escapeHtml(q.answers[i] || '')}" placeholder="Nhập đáp án..."></td>`).join('')}${q.criteria.map(c => `<td class="correct ${draft.quiz.showCorrect || q.submitted ? '' : 'hidden-correct'}">${draft.quiz.showCorrect || q.submitted ? escapeHtml(itemField(item, c)) : '••••••'}</td>`).join('')}</tr>`;
}
function ensureQuiz() {
  if (draft.quiz) return;
  draft.quiz = {
    mode: 'Due words',
    language: state.settings.defaultLanguage,
    count: state.settings.defaultQuestions,
    criteria: [...state.settings.defaultCriteria],
    questions: [],
    submitted: false,
    showCorrect: false,
    saved: false
  };
}
function buildQuestion(item, language) {
  return language === 'Vietnamese' ? item.word : item.meaning;
}
function createQuiz(mode = draft.quiz.mode) {
  const quiz = draft.quiz;
  quiz.mode = mode;
  let pool = state.items.filter(i => i.status !== 'Storage');
  if (mode === 'Due words') pool = getDueItems();
  if (mode === 'New words') pool = pool.filter(i => i.mastery === 'New' || i.status === 'Started');
  if (mode === 'Weak words') pool = pool.filter(i => (i.l3ds || 0) < 0.75);
  if (mode === 'Random all') pool = pool.sort(() => Math.random() - 0.5);
  pool = pool.slice(0, Math.max(1, Math.min(Number(quiz.count) || 10, 50)));
  quiz.questions = pool.map(item => ({
    id: uid(),
    itemId: item.id,
    question: buildQuestion(item, quiz.language),
    criteria: [...quiz.criteria],
    answers: ['', '', ''],
    checks: [false, false, false],
    score: 0,
    submitted: false
  }));
  quiz.submitted = false;
  quiz.saved = false;
  quiz.showCorrect = false;
}
function gradeQuiz() {
  const quiz = draft.quiz;
  quiz.questions = quiz.questions.map(q => {
    const item = state.items.find(i => i.id === q.itemId);
    const checks = q.criteria.map((criterion, index) => matchAnswer(q.answers[index], itemField(item, criterion)));
    const used = q.answers.filter(Boolean).length || q.criteria.length;
    return { ...q, checks, score: checks.filter(Boolean).length / used, submitted: true };
  });
  quiz.submitted = true;
  quiz.showCorrect = true;
}
function saveQuizLog() {
  const quiz = draft.quiz;
  const answered = quiz.questions.filter(q => q.answers.some(Boolean));
  if (!answered.length || quiz.saved) return false;
  const log = {
    id: uid(),
    date: today(),
    language: quiz.language,
    criteria: [...quiz.criteria],
    score: avg(answered.map(q => q.score)),
    answers: answered.map(q => ({ itemId: q.itemId, score: q.score, answers: q.answers, checks: q.checks }))
  };
  state.reviewLog.unshift(log);
  for (const answer of log.answers) {
    const item = state.items.find(i => i.id === answer.itemId);
    if (!item) continue;
    const previous = state.reviewLog.flatMap(l => l.answers).filter(a => a.itemId === item.id).map(a => a.score).slice(0, 3);
    item.l3ds = avg(previous);
    item.times = previous.length;
    item.mastery = item.l3ds >= 0.9 ? 'Mastery' : item.l3ds >= 0.65 ? 'Advanced' : item.l3ds > 0 ? 'Beginner' : 'New';
    item.status = item.l3ds >= 0.9 ? 'Completed' : 'In Progress';
  }
  quiz.saved = true;
  return true;
}

function MonthlyReview() {
  const m = draft.monthly;
  const list = state.items.filter(i => i.status !== 'Storage' && (!m.topic || m.topic === 'All' || i.topic === m.topic) && (!m.band || m.band === 'All' || i.band === m.band));
  return pageHeader('Monthly Review', 'Ôn tập theo tháng/topic/band, có submit và save riêng.', `${button('Auto Load Due', 'loadMonthly', 'primary')}${button('Submit Review', 'submitMonthly', 'submit')}${button('Save Review', 'saveMonthly', 'danger')}`) + `
    <div class="card">
      <div class="controls">
        ${field('Language', select('mLanguage', ['Foreign', 'Vietnamese'], m.language || 'Foreign'))}
        ${field('Topic', select('mTopic', ['All', ...TOPICS], m.topic || 'All'))}
        ${field('Band', select('mBand', ['All', ...BANDS], m.band || 'All'))}
        ${button(m.showCorrect ? 'Hide Correct' : 'Show Correct', 'toggleMonthlyCorrect', 'ghost')}
      </div>
      <div class="criteria">${[0, 1, 2].map(i => field(`Criteria ${i + 1}`, select(`mCrit${i}`, CRITERIA, (m.criteria || ['Từ vựng', 'Phiên âm', 'Loại từ'])[i]))).join('')}</div>
      <div class="table-wrap"><table><thead><tr><th>Check</th><th>Question</th>${(m.criteria || ['Từ vựng', 'Phiên âm', 'Loại từ']).map((c, i) => `<th>Answer ${i + 1}<br><small>${escapeHtml(c)}</small></th>`).join('')}<th>Notes</th>${(m.criteria || ['Từ vựng', 'Phiên âm', 'Loại từ']).map(c => `<th class="correct">Correct<br><small>${escapeHtml(c)}</small></th>`).join('')}</tr></thead><tbody>
        ${list.map(item => monthlyRow(item, m)).join('')}
      </tbody></table></div>
    </div>`;
}
function monthlyRow(item, m) {
  const answers = m.answers[item.id] || ['', '', '', ''];
  const criteria = m.criteria || ['Từ vựng', 'Phiên âm', 'Loại từ'];
  const checks = criteria.map((c, i) => matchAnswer(answers[i], itemField(item, c)));
  const score = checks.filter(Boolean).length / criteria.length;
  return `<tr><td>${m.submitted && answers.slice(0, 3).some(Boolean) ? badge(pct(score), score >= 1 ? 'good' : score > 0 ? 'warn' : 'bad') : ''}</td><td><b>${escapeHtml((m.language || 'Foreign') === 'Vietnamese' ? item.word : item.meaning)}</b></td>${[0, 1, 2].map(i => `<td><input data-monthly="${item.id}:${i}" value="${escapeHtml(answers[i] || '')}" placeholder="Nhập đáp án..."></td>`).join('')}<td><input data-monthly="${item.id}:3" value="${escapeHtml(answers[3] || '')}" placeholder="Notes..."></td>${criteria.map(c => `<td class="correct ${m.showCorrect || m.submitted ? '' : 'hidden-correct'}">${m.showCorrect || m.submitted ? escapeHtml(itemField(item, c)) : '••••••'}</td>`).join('')}</tr>`;
}

function Settings() {
  return pageHeader('Settings', 'Cấu hình mặc định và dữ liệu demo.', `${button('Save Settings', 'saveSettings', 'primary')}`) + `
    <div class="grid2">
      <section class="card"><h3>Learning Automation</h3>
        ${field('Default questions', `<input id="defaultQuestions" type="number" min="1" max="50" value="${state.settings.defaultQuestions}">`)}
        ${field('Default language', select('defaultLanguage', ['Foreign', 'Vietnamese'], state.settings.defaultLanguage))}
        <label><input id="autoSaveOnSubmit" type="checkbox" ${state.settings.autoSaveOnSubmit ? 'checked' : ''}> Auto-save when Submit & Auto Save is clicked</label><br>
        <label><input id="showCorrectOnSubmit" type="checkbox" ${state.settings.showCorrectOnSubmit ? 'checked' : ''}> Show correct answers after submit</label><br>
        <label><input id="strictCheck" type="checkbox" ${state.settings.strict ? 'checked' : ''}> Strict checking</label>
      </section>
      <section class="card"><h3>API Settings</h3>
        ${field('OpenAI API Key placeholder', `<input id="apiKey" type="password" value="${escapeHtml(state.settings.apiKey)}" placeholder="sk-...">`)}
        <p class="hint">Bản frontend không gọi API thật để tránh lộ key. Bản production cần backend.</p>
        <div class="toolbar">${button('Export JSON', 'exportJson', 'ghost')}${button('Reset Demo Data', 'resetData', 'danger')}</div>
      </section>
    </div>`;
}

function addWord(status = 'Started') {
  const word = prompt('Nhập từ mới:');
  if (!word) return;
  state.items.unshift(autoDefine(word, status));
  toast('Đã thêm từ và tự điền thông tin demo.');
  render();
}
function autoDefine(word, status = 'Started') {
  const clean = word.trim();
  return {
    id: uid(), word: clean, ipa: '/auto/', type: guessType(clean), meaning: `${clean} - nghĩa tiếng Việt demo`,
    definition: `Short AI-style definition for "${clean}".`, example: `I learned ${clean} today. / Hôm nay tôi học từ ${clean}.`,
    synonyms: 'related, similar', antonyms: 'opposite', band: 'Band 6', topic: 'Academic', source: 'manual',
    status, mastery: status === 'Storage' ? 'New' : 'New', l3ds: 0, times: 0, createdAt: today()
  };
}
function guessType(word) {
  if (word.endsWith('ly')) return 'adverb';
  if (word.endsWith('tion') || word.endsWith('ment') || word.endsWith('ness')) return 'noun';
  if (word.endsWith('ive') || word.endsWith('al') || word.endsWith('ous')) return 'adjective';
  return 'noun/verb';
}
function importText() {
  const text = prompt('Dán danh sách từ, mỗi từ cách nhau bằng dấu phẩy hoặc xuống dòng:');
  if (!text) return;
  const words = [...new Set(text.split(/[\n,;]/).map(w => w.trim()).filter(Boolean))];
  state.items.unshift(...words.map(w => autoDefine(w, 'Started')));
  toast(`Đã import ${words.length} từ.`);
  render();
}
function fillMissing() {
  state.items = state.items.map(item => item.meaning && item.definition ? item : { ...autoDefine(item.word, item.status), ...item });
  toast('Đã auto fill các ô thiếu.');
  render();
}
function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vocab-cua-uyen-${today()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function bindPageEvents() {
  document.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => { state.page = btn.dataset.nav; render(); }));
  document.querySelectorAll('[data-start]').forEach(btn => btn.addEventListener('click', () => {
    const item = state.items.find(i => i.id === btn.dataset.start);
    if (item) item.status = 'Started';
    toast('Đã chuyển vào Vocab List.');
    render();
  }));
  document.querySelectorAll('[data-practice-word]').forEach(btn => btn.addEventListener('click', () => {
    const item = state.items.find(i => i.id === btn.dataset.practiceWord);
    ensureQuiz();
    draft.quiz.questions = item ? [{ id: uid(), itemId: item.id, question: buildQuestion(item, draft.quiz.language), criteria: [...draft.quiz.criteria], answers: ['', '', ''], checks: [false, false, false], score: 0, submitted: false }] : [];
    state.page = 'Practice';
    render();
  }));
  document.querySelectorAll('[data-answer]').forEach(input => input.addEventListener('input', event => {
    const [id, index] = event.target.dataset.answer.split(':');
    const question = draft.quiz.questions.find(q => q.id === id);
    if (question) question.answers[Number(index)] = event.target.value;
    save();
  }));
  document.querySelectorAll('[data-monthly]').forEach(input => input.addEventListener('input', event => {
    const [id, index] = event.target.dataset.monthly.split(':');
    draft.monthly.answers[id] = draft.monthly.answers[id] || ['', '', '', ''];
    draft.monthly.answers[id][Number(index)] = event.target.value;
    save();
  }));

  const actions = {
    goPractice: () => { state.page = 'Practice'; render(); },
    reviewDue: () => { state.page = 'Practice'; ensureQuiz(); createQuiz('Due words'); render(); },
    quickAdd: () => addWord('Started'),
    quickImport: importText,
    addStorage: () => addWord('Storage'),
    importText,
    addWord: () => addWord('Started'),
    fillMissing,
    randomSet: () => { syncQuizControls(); createQuiz(draft.quiz.mode); toast('Đã tạo bộ câu hỏi tự động.'); render(); },
    submitSave: () => { syncQuizControls(); gradeQuiz(); const saved = saveQuizLog(); toast(saved ? 'Đã submit, tự lưu Review & Score và cập nhật L3Ds.' : 'Đã submit. Không có đáp án mới để lưu.'); render(); },
    clearQuiz: () => { draft.quiz = null; toast('Đã xoá bài hiện tại.'); render(); },
    toggleCorrect: () => { draft.quiz.showCorrect = !draft.quiz.showCorrect; render(); },
    loadMonthly: () => { draft.monthly.submitted = false; draft.monthly.showCorrect = false; toast('Đã load danh sách review theo filter.'); render(); },
    submitMonthly: () => { draft.monthly.submitted = true; draft.monthly.showCorrect = true; toast('Đã chấm Monthly Review.'); render(); },
    saveMonthly: saveMonthlyReview,
    toggleMonthlyCorrect: () => { draft.monthly.showCorrect = !draft.monthly.showCorrect; render(); },
    saveSettings: saveSettings,
    exportJson,
    resetData: () => { if (confirm('Reset toàn bộ dữ liệu demo?')) { localStorage.removeItem(STORAGE_KEY); state = loadState(); draft.quiz = null; draft.monthly = state.draftMonthly; render(); } }
  };
  Object.entries(actions).forEach(([id, fn]) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); });

  ['qMode', 'qLanguage', 'qCount', 'qCrit0', 'qCrit1', 'qCrit2'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('change', syncQuizControls); });
  ['mLanguage', 'mTopic', 'mBand', 'mCrit0', 'mCrit1', 'mCrit2'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('change', syncMonthlyControls); });
}
function syncQuizControls() {
  ensureQuiz();
  draft.quiz.mode = $('#qMode')?.value || draft.quiz.mode;
  draft.quiz.language = $('#qLanguage')?.value || draft.quiz.language;
  draft.quiz.count = Number($('#qCount')?.value || draft.quiz.count);
  draft.quiz.criteria = [0, 1, 2].map(i => $(`#qCrit${i}`)?.value || draft.quiz.criteria[i]);
  if (draft.quiz.questions.length && !draft.quiz.submitted) {
    draft.quiz.questions = draft.quiz.questions.map(q => {
      const item = state.items.find(i => i.id === q.itemId);
      return { ...q, question: buildQuestion(item, draft.quiz.language), criteria: [...draft.quiz.criteria] };
    });
  }
  save();
}
function syncMonthlyControls() {
  const m = draft.monthly;
  m.language = $('#mLanguage')?.value || m.language || 'Foreign';
  m.topic = $('#mTopic')?.value || m.topic || 'All';
  m.band = $('#mBand')?.value || m.band || 'All';
  m.criteria = [0, 1, 2].map(i => $(`#mCrit${i}`)?.value || (m.criteria || ['Từ vựng', 'Phiên âm', 'Loại từ'])[i]);
  m.submitted = false;
  save();
  render();
}
function saveMonthlyReview() {
  syncMonthlyControls();
  const m = draft.monthly;
  const answers = Object.entries(m.answers || {}).filter(([, row]) => row.slice(0, 3).some(Boolean));
  if (!answers.length) return toast('Chưa có đáp án Monthly Review để lưu.');
  const scored = answers.map(([id, row]) => {
    const item = state.items.find(i => i.id === id);
    const checks = m.criteria.map((c, index) => matchAnswer(row[index], itemField(item, c)));
    return { itemId: id, score: checks.filter(Boolean).length / m.criteria.length, answers: row.slice(0, 3), notes: row[3] || '' };
  });
  state.reviewLog.unshift({ id: uid(), date: today(), type: 'Monthly Review', language: m.language, criteria: [...m.criteria], score: avg(scored.map(s => s.score)), answers: scored });
  toast('Đã lưu Monthly Review vào Review & Score.');
  draft.monthly = { answers: {}, submitted: false, showCorrect: false, language: m.language, topic: m.topic, band: m.band, criteria: m.criteria };
  render();
}
function saveSettings() {
  state.settings.defaultQuestions = Number($('#defaultQuestions')?.value || 10);
  state.settings.defaultLanguage = $('#defaultLanguage')?.value || 'Foreign';
  state.settings.autoSaveOnSubmit = Boolean($('#autoSaveOnSubmit')?.checked);
  state.settings.showCorrectOnSubmit = Boolean($('#showCorrectOnSubmit')?.checked);
  state.settings.strict = Boolean($('#strictCheck')?.checked);
  state.settings.apiKey = $('#apiKey')?.value || '';
  toast('Đã lưu Settings.');
  render();
}

render();
