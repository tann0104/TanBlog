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
function renderProjects(projects) {
  const container = document.getElementById('projects-container');
  container.innerHTML = '';

  if (projects.length === 0) {
    container.innerHTML = '<p class="col-span-full text-center text-gray-400 py-8">該当するプロジェクトがありません 😿</p>';
    return;
  }

  projects.forEach(project => {
    const card = document.createElement('div');
    // 見やすく・かわいいカードデザイン
    card.className = "project-card bg-white dark:bg-slate-900 border-2 border-pink-100 dark:border-purple-900/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between";

    card.innerHTML = `
      <div>
        <!-- タグ ＆ アイコン -->
        <div class="flex items-center justify-between mb-3">
          <span class="tag-badge px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-600 dark:bg-purple-950 dark:text-purple-300 dark:border dark:border-purple-700">
            🏷️ ${project.tag || 'Other'}
          </span>
          <span class="text-xs text-gray-400">✨</span>
        </div>

        <!-- タイトル -->
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 leading-snug">
          ${project.title}
        </h3>

        <!-- 説明文 -->
        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          ${project.description || '説明はありません'}
        </p>
      </div>

      <!-- 下部のリンクボタン（必要な場合） -->
      <div class="pt-3 border-t border-pink-50 dark:border-purple-900/30 flex justify-end">
        <button class="text-xs font-bold text-pink-500 hover:text-pink-600 dark:text-purple-400 flex items-center gap-1">
          詳細をみる ➔
        </button>
      </div>
    `;

    container.appendChild(card);
  });
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
