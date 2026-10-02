// --- Supabase 初期設定 ---
const SUPABASE_URL = 'https://wkwnovzxkafjbvdromru.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UobG-NeXrSQQFPduyfba7A_MSUQ0o6Y';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- グローバル変数 ---
let allProjects = [];
let currentSelectedTag = '';

// --- DOM 要素 ---
const themeBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text'); // テキスト追加
const searchInput = document.getElementById('search-input');
const projectListEl = document.getElementById('project-list');
const tagButtons = document.querySelectorAll('.tag-btn');

// --- 1. ダークモード / ライトモード初期化 ---
function initTheme() {
  const isLight = localStorage.theme === 'light' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: light)').matches);
  
  if (isLight) {
    document.documentElement.classList.remove('dark');
    themeIcon.textContent = '☀️';
    if (themeText) themeText.textContent = 'Day ✨';
  } else {
    document.documentElement.classList.add('dark');
    themeIcon.textContent = '🌙';
    if (themeText) themeText.textContent = 'Night 🎀';
  }
}

themeBtn.addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  // アイコンとテキストの切り替え
  themeIcon.textContent = isDark ? '🌙' : '☀️';
  if (themeText) themeText.textContent = isDark ? 'Night 🎀' : 'Day ✨';
});

// --- 2. データ取得 (Supabase) ---
async function fetchProjects() {
  const { data, error } = await supabaseClient
    .from('projects')
    .select('*, comments(*)');

  if (error) {
    console.error(error);
    projectListEl.innerHTML = `<div class="col-span-full text-center text-red-500 py-12">データの読み込みに失敗しました</div>`;
    return;
  }
  allProjects = data;
  renderProjects();
}

// --- 3. プロジェクト一覧の描画 ---
function renderProjects() {
  const keyword = searchInput.value.toLowerCase();

  const filtered = allProjects.filter(p => {
    const matchKeyword = p.title.toLowerCase().includes(keyword) || (p.description && p.description.toLowerCase().includes(keyword));
    const matchTag = currentSelectedTag === '' || p.tag === currentSelectedTag;
    return matchKeyword && matchTag;
  });

  if (filtered.length === 0) {
    projectListEl.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400">該当するプロジェクトが見つかりません</div>`;
    return;
  }

  projectListEl.innerHTML = filtered.map(p => `
    <article class="project-card group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-start mb-3">
          <h3 class="text-xl font-bold group-hover:text-emerald-500 transition-colors">${escapeHtml(p.title)}</h3>
          ${p.tag ? `<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">${escapeHtml(p.tag)}</span>` : ''}
        </div>
        <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">${escapeHtml(p.description || '')}</p>
      </div>

      <!-- コメントエリア -->
      <div class="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-auto">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Comments (${p.comments ? p.comments.length : 0})</h4>
        
        <div class="custom-scrollbar space-y-2 mb-4 max-h-36 overflow-y-auto pr-1">
          ${(p.comments || []).map(c => `
            <div class="text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span class="font-bold text-slate-700 dark:text-slate-300">${escapeHtml(c.user_name)}:</span>
              <span class="text-slate-600 dark:text-slate-400">${escapeHtml(c.content)}</span>
            </div>
          `).join('')}
        </div>

        <!-- コメント入力 -->
        <div class="flex gap-2">
          <input type="text" id="name-${p.id}" placeholder="名前" class="w-1/3 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500">
          <input type="text" id="comment-${p.id}" placeholder="コメントを追加..." class="w-2/3 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500">
          <button onclick="addComment(${p.id})" class="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition">送信</button>
        </div>
      </div>
    </article>
  `).join('');
}

// --- 4. コメント送信機能 ---
async function addComment(projectId) {
  const nameInput = document.getElementById(`name-${projectId}`);
  const contentInput = document.getElementById(`comment-${projectId}`);

  if (!contentInput.value.trim()) return;

  const { error } = await supabaseClient
    .from('comments')
    .insert([{
      project_id: projectId,
      user_name: nameInput.value.trim() || '名無し',
      content: contentInput.value.trim()
    }]);

  if (error) {
    alert('コメントの送信に失敗しました');
  } else {
    fetchProjects();
  }
}

// --- 5. タグフィルター切り替え ---
tagButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    currentSelectedTag = e.target.getAttribute('data-tag');
    
    tagButtons.forEach(b => {
      b.classList.remove('bg-emerald-500', 'text-white');
      b.classList.add('bg-slate-200', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
    });

    e.target.classList.remove('bg-slate-200', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
    e.target.classList.add('bg-emerald-500', 'text-white');

    renderProjects();
  });
});

// ユーティリティ: XSS対策
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// --- 初期化実行 ---
searchInput.addEventListener('input', renderProjects);
initTheme();
fetchProjects();
