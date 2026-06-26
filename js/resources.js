/**
 * GitHub 资源浏览器
 *
 * 使用 jsDelivr Data API (无需 Token) 列出仓库文件
 * API: https://data.jsdelivr.com/v1/package/gh/{owner}/{repo}
 */

const OWNER = 'ATX8T';
const REPO = 'ATX8T.github.io';
const BRANCH = 'main';

// 文件类型分类
const FILE_TYPES = {
    image:   { exts: ['png','jpg','jpeg','gif','webp','svg','bmp','ico'], icon: '🖼️', color: 'info' },
    video:   { exts: ['mp4','webm','mov','avi','mkv','flv','wmv'],     icon: '🎬', color: 'success' },
    archive: { exts: ['exe','msi','apk','dmg','deb','rpm','zip','rar','7z','tar','gz'], icon: '📦', color: 'warning' },
    git:     { exts: ['git','bundle','pack'],                           icon: '📥', color: 'danger' },
    doc:     { exts: ['pdf','doc','docx','ppt','pptx','xls','xlsx','txt','md','csv','json','xml','html','css','js'], icon: '📄', color: 'secondary' },
};

let allFiles = [];
let currentFilter = 'all';
let currentDir = '';

// jsDelivr API 地址
const API_URL = `https://data.jsdelivr.com/v1/package/gh/${OWNER}/${REPO}`;


// ==================== 文件加载 ====================

async function loadFiles() {
    const loading = document.getElementById('loading');
    const fileTable = document.getElementById('fileTable');
    const emptyState = document.getElementById('emptyState');

    loading.classList.remove('d-none');
    fileTable.classList.add('d-none');
    emptyState.classList.add('d-none');

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('API 请求失败: ' + response.status);
        const data = await response.json();

        // jsDelivr 返回的 files 数组，每项: { name, hash, time, size, type }
        allFiles = (data.files || [])
            .filter(f => f.type === 'file')
            .map(f => ({
                name: f.name.split('/').pop(),         // 文件名
                path: f.name,                           // 完整路径 (以 / 开头)
                size: f.size || 0,
                time: f.time,
            }))
            .sort((a, b) => a.path.localeCompare(b.path));

        // 更新总数
        document.getElementById('fileCount').textContent = allFiles.length;

        // 构建目录列表
        const dirs = new Set();
        allFiles.forEach(f => {
            const parts = f.path.split('/');
            parts.pop(); // 去掉文件名
            for (let i = 0; i < parts.length; i++) {
                dirs.add(parts.slice(0, i + 1).join('/'));
            }
        });

        loading.classList.add('d-none');
        applyFilter();

    } catch (error) {
        loading.classList.add('d-none');
        emptyState.classList.remove('d-none');
        emptyState.innerHTML = `
            <div style="font-size:3rem;opacity:.3">❌</div>
            <h5 class="text-danger">加载失败</h5>
            <p class="text-secondary">${error.message}</p>
            <button class="btn btn-outline-light btn-sm" onclick="loadFiles()">重试</button>
        `;
        console.error('加载文件失败:', error);
    }
}


// ==================== 目录导航 ====================

function navigateTo(dir) {
    currentDir = dir;
    applyFilter();
    renderBreadcrumb();
}

function renderBreadcrumb() {
    const bc = document.getElementById('breadcrumb');
    const parts = currentDir.split('/').filter(Boolean);

    let html = '<nav><ol class="breadcrumb small mb-0">';
    html += `<li class="breadcrumb-item"><a href="#" class="text-info" onclick="navigateTo(\'\')">📁 根目录</a></li>`;
    for (let i = 0; i < parts.length; i++) {
        const subPath = parts.slice(0, i + 1).join('/');
        const isLast = i === parts.length - 1;
        if (isLast) {
            html += `<li class="breadcrumb-item active text-light">${parts[i]}</li>`;
        } else {
            html += `<li class="breadcrumb-item"><a href="#" class="text-info" onclick="navigateTo(\'${subPath}\')">${parts[i]}</a></li>`;
        }
    }
    html += '</ol></nav>';

    // 子目录快捷入口
    if (currentDir || !currentDir) {
        const subDirs = getSubDirs(currentDir);
        if (subDirs.length > 0) {
            html += '<div class="mt-1 d-flex flex-wrap gap-1">';
            subDirs.forEach(d => {
                const name = d.split('/').pop();
                html += `<a href="#" class="badge bg-secondary text-decoration-none" onclick="navigateTo(\'${d}\')">📁 ${name}</a>`;
            });
            html += '</div>';
        }
    }

    bc.innerHTML = html;
}


// ==================== 过滤 ====================

function setFilter(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    applyFilter();
}

function applyFilter() {
    let files = allFiles;

    // 按目录过滤
    if (currentDir) {
        files = files.filter(f => f.path.startsWith('/' + currentDir + '/'));
    }

    // 按文件类型过滤
    if (currentFilter !== 'all') {
        files = files.filter(f => getFileType(f.name) === currentFilter);
    }

    renderFileTable(files);
}

function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    for (const [type, config] of Object.entries(FILE_TYPES)) {
        if (config.exts.includes(ext)) return type;
    }
    return 'other';
}

function getFileConfig(filename) {
    const type = getFileType(filename);
    return FILE_TYPES[type] || { icon: '📄', color: 'secondary' };
}


// ==================== 子目录计算 ====================

function getSubDirs(parentPath) {
    const dirs = new Set();
    const prefix = parentPath ? '/' + parentPath + '/' : '/';
    allFiles.forEach(f => {
        if (!f.path.startsWith(prefix)) return;
        const relative = f.path.substring(prefix.length);
        const slashIdx = relative.indexOf('/');
        if (slashIdx > 0) {
            const sub = (parentPath ? parentPath + '/' : '') + relative.substring(0, slashIdx);
            dirs.add(sub);
        }
    });
    return [...dirs].sort();
}


// ==================== 表格渲染 ====================

function renderFileTable(files) {
    const fileTable = document.getElementById('fileTable');
    const fileBody = document.getElementById('fileBody');
    const emptyState = document.getElementById('emptyState');

    if (files.length === 0) {
        fileTable.classList.add('d-none');
        emptyState.classList.remove('d-none');
        document.getElementById('fileCount').textContent = '0';
        return;
    }

    fileTable.classList.remove('d-none');
    emptyState.classList.add('d-none');
    fileBody.innerHTML = '';

    files.forEach((file, index) => {
        const config = getFileConfig(file.name);
        const size = formatSize(file.size);
        const rawUrl = buildRawUrl(file.path);
        const jsdelivrUrl = buildJsdelivrUrl(file.path);

        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td class="text-secondary small">${index + 1}</td>
            <td>
                <span class="text-${config.color} me-2">${config.icon}</span>
                <span class="file-name" title="${escapeHtml(file.path)}">${escapeHtml(file.name)}</span>
                <br><small class="text-secondary text-truncate d-inline-block" style="max-width:400px">${escapeHtml(file.path)}</small>
            </td>
            <td class="text-secondary small">${size}</td>
            <td>
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline-info" title="预览"
                            onclick="previewFile('${escapeAttr(file.name)}', '${escapeAttr(rawUrl)}')">
                        👁️
                    </button>
                    <button class="btn btn-sm btn-outline-success" title="下载"
                            onclick="downloadFile('${escapeAttr(jsdelivrUrl)}', '${escapeAttr(file.name)}')">
                        ⬇️
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" title="复制链接"
                            onclick="copyToClipboardUrl('${escapeAttr(jsdelivrUrl)}')">
                        🔗
                    </button>
                </div>
            </td>
        `;

        fileBody.appendChild(tr);
    });

    document.getElementById('fileCount').textContent = files.length;
}


// ==================== URL 构建 ====================

function buildRawUrl(filepath) {
    const encoded = filepath.split('/').map(s => encodeURIComponent(s)).join('/');
    return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}${encoded}`;
}

function buildJsdelivrUrl(filepath) {
    const encoded = filepath.split('/').map(s => encodeURIComponent(s)).join('/');
    return `https://cdn.jsdelivr.net/gh/${OWNER}/${REPO}@${BRANCH}${encoded}`;
}


// ==================== 预览 ====================

function previewFile(name, rawUrl) {
    const title = document.getElementById('previewTitle');
    const body = document.getElementById('previewBody');
    const downloadBtn = document.getElementById('previewDownload');
    const rawInput = document.getElementById('previewRawUrl');

    title.textContent = name;
    rawInput.value = rawUrl;
    downloadBtn.href = rawUrl;
    downloadBtn.download = name;

    const ext = name.split('.').pop().toLowerCase();
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const videoExts = ['mp4', 'webm', 'mov', 'ogg'];

    if (imageExts.includes(ext)) {
        body.innerHTML = `<img src="${rawUrl}" class="img-fluid rounded" style="max-height:70vh" alt="${name}"
                            onerror="document.getElementById('previewBody').innerHTML='<div class=\\'p-5 text-danger\\'>预览失败，请尝试下载</div>'">`;
    } else if (videoExts.includes(ext)) {
        body.innerHTML = `<video controls class="img-fluid rounded" style="max-height:70vh">
                            <source src="${rawUrl}">
                            不支持播放此视频
                          </video>`;
    } else if (ext === 'pdf') {
        body.innerHTML = `<iframe src="${rawUrl}" width="100%" height="600" class="rounded"></iframe>`;
    } else {
        const config = getFileConfig(name);
        body.innerHTML = `
            <div class="p-5 text-center">
                <div style="font-size:4rem">${config.icon}</div>
                <p class="text-${config.color} mt-2">${escapeHtml(name)}</p>
                <p class="text-secondary">${formatSize(0)} — 无法在线预览此文件类型</p>
                <a href="${rawUrl}" class="btn btn-success" download="${name}">直接下载</a>
            </div>
        `;
    }

    new bootstrap.Modal(document.getElementById('previewModal')).show();
}


// ==================== 下载 ====================

function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


// ==================== 复制链接 ====================

function copyToClipboardUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showTempBadge('已复制');
    }).catch(() => {
        prompt('复制以下链接:', url);
    });
}

function copyUrl(inputId) {
    const input = document.getElementById(inputId);
    navigator.clipboard.writeText(input.value).then(() => {
        showTempBadge('已复制');
    });
}

function showTempBadge(msg) {
    const badge = document.createElement('span');
    badge.className = 'position-fixed top-0 start-50 translate-middle-x badge bg-success mt-2';
    badge.style.cssText = 'z-index:99999;font-size:1rem;padding:8px 20px';
    badge.textContent = msg;
    document.body.appendChild(badge);
    setTimeout(() => badge.remove(), 1500);
}


// ==================== 工具函数 ====================

function formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0, size = bytes;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return size.toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}


// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
    loadFiles();
});

// 模态框关闭时停止视频播放
document.addEventListener('hidden.bs.modal', () => {
    const v = document.querySelector('#previewBody video');
    if (v) v.pause();
});
