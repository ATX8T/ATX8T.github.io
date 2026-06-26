/**
 * GitHub 资源浏览器
 * 使用 jsDelivr Data API 获取文件列表 (无需 Token)
 */

var OWNER = 'ATX8T';
var REPO = 'ATX8T.github.io';
var BRANCH = 'main';
var API = 'https://data.jsdelivr.com/v1/package/gh/' + OWNER + '/' + REPO;

var allFiles = [];
var currentFilter = 'all';
var currentDir = '';

var FILTERS = {
    image:   ['png','jpg','jpeg','gif','webp','svg','bmp','ico'],
    video:   ['mp4','webm','mov','avi','mkv'],
    archive: ['exe','msi','apk','dmg','deb','rpm','zip','rar','7z','tar','gz'],
    doc:     ['pdf','doc','docx','ppt','pptx','xls','xlsx','txt','md','csv','json','xml','html','css','js','py','java','c','cpp'],
};

function getFileType(filename) {
    var ext = filename.split('.').pop().toLowerCase();
    for (var t in FILTERS) {
        if (FILTERS[t].indexOf(ext) >= 0) return t;
    }
    return 'other';
}

function getIcon(filename) {
    var icons = { image:'🖼️', video:'🎬', archive:'📦', doc:'📄', other:'📁' };
    return icons[getFileType(filename)] || '📁';
}


// ==================== 加载 ====================

function loadFiles() {
    var loading = document.getElementById('loadingBox');
    var table = document.getElementById('fileTable');
    var empty = document.getElementById('emptyBox');

    loading.classList.remove('d-none');
    table.classList.add('d-none');
    empty.classList.add('d-none');

    fetch(API).then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
    }).then(function(data) {
        allFiles = (data.files || []).filter(function(f) { return f.type === 'file'; })
            .map(function(f) {
                var p = f.name; // 以 / 开头
                return {
                    name: p.split('/').pop(),
                    path: p,
                    size: f.size || 0,
                };
            })
            .sort(function(a, b) { return a.path.localeCompare(b.path); });

        document.getElementById('fileCount').textContent = allFiles.length;
        loading.classList.add('d-none');
        applyFilter();
    }).catch(function(err) {
        loading.classList.add('d-none');
        empty.classList.remove('d-none');
        empty.innerHTML = '<p class="text-danger">加载失败: ' + err.message + '</p><button class="btn btn-sm btn-outline-primary" onclick="loadFiles()">重试</button>';
    });
}


// ==================== 导航 ====================

function navigateTo(dir) {
    currentDir = dir;
    applyFilter();
    renderBreadcrumb();
}

function renderBreadcrumb() {
    var bc = document.getElementById('breadcrumb');
    var parts = currentDir.split('/').filter(Boolean);
    var html = '<nav><ol class="breadcrumb small">';
    html += '<li class="breadcrumb-item"><a href="#" onclick="navigateTo(\'\')">📁 根目录</a></li>';
    for (var i = 0; i < parts.length; i++) {
        var sp = parts.slice(0, i+1).join('/');
        html += '<li class="breadcrumb-item' + (i===parts.length-1?' active':'') + '">';
        if (i < parts.length-1) html += '<a href="#" onclick="navigateTo(\'' + sp + '\')">' + parts[i] + '</a>';
        else html += parts[i];
        html += '</li>';
    }
    html += '</ol></nav>';

    // 子目录快捷入口
    var subDirs = getSubDirs(currentDir);
    if (subDirs.length) {
        html += '<div class="d-flex flex-wrap gap-1">';
        subDirs.forEach(function(d) {
            html += '<a href="#" class="badge bg-light text-dark text-decoration-none border" onclick="navigateTo(\'' + d + '\')">📁 ' + d.split('/').pop() + '</a>';
        });
        html += '</div>';
    }
    bc.innerHTML = html;
}

function getSubDirs(parentPath) {
    var dirs = {};
    var prefix = parentPath ? '/' + parentPath + '/' : '/';
    allFiles.forEach(function(f) {
        if (f.path.indexOf(prefix) !== 0) return;
        var rel = f.path.substring(prefix.length);
        var idx = rel.indexOf('/');
        if (idx > 0) {
            var d = (parentPath ? parentPath + '/' : '') + rel.substring(0, idx);
            dirs[d] = true;
        }
    });
    return Object.keys(dirs).sort();
}


// ==================== 过滤 ====================

function setFilter(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('[data-filter]').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    applyFilter();
}

function applyFilter() {
    var files = allFiles;
    if (currentDir) {
        files = files.filter(function(f) { return f.path.indexOf('/' + currentDir + '/') === 0; });
    }
    if (currentFilter !== 'all') {
        files = files.filter(function(f) { return getFileType(f.name) === currentFilter; });
    }
    renderTable(files);
}


// ==================== 表格 ====================

function renderTable(files) {
    var table = document.getElementById('fileTable');
    var body = document.getElementById('fileBody');
    var empty = document.getElementById('emptyBox');

    if (!files.length) {
        table.classList.add('d-none');
        empty.classList.remove('d-none');
        document.getElementById('fileCount').textContent = '0';
        return;
    }

    table.classList.remove('d-none');
    empty.classList.add('d-none');
    body.innerHTML = '';

    files.forEach(function(f, i) {
        var rawUrl = buildRaw(f.path);
        var cdnUrl = buildCdn(f.path);
        var size = formatSize(f.size);
        var icon = getIcon(f.name);

        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td class="text-muted small">' + (i+1) + '</td>' +
            '<td>' +
                '<span class="file-icon">' + icon + '</span>' +
                '<span class="file-name">' + esc(f.name) + '</span>' +
                '<br><span class="file-path">' + esc(f.path) + '</span>' +
            '</td>' +
            '<td class="text-muted small">' + size + '</td>' +
            '<td>' +
                '<button class="btn btn-sm btn-outline-primary me-1" onclick="previewFile(\'' + escAttr(f.name) + '\',\'' + escAttr(rawUrl) + '\')">👁️</button>' +
                '<button class="btn btn-sm btn-outline-success me-1" onclick="downloadFile(\'' + escAttr(cdnUrl) + '\',\'' + escAttr(f.name) + '\')">⬇️</button>' +
                '<button class="btn btn-sm btn-outline-secondary" onclick="copyText(\'' + escAttr(cdnUrl) + '\')">🔗</button>' +
            '</td>';
        body.appendChild(tr);
    });

    document.getElementById('fileCount').textContent = files.length;
}


// ==================== URL 构建 ====================

function buildRaw(filepath) {
    var p = filepath.split('/').map(function(s) { return encodeURIComponent(s); }).join('/');
    return 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + p;
}

function buildCdn(filepath) {
    var p = filepath.split('/').map(function(s) { return encodeURIComponent(s); }).join('/');
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + BRANCH + p;
}


// ==================== 预览 & 下载 ====================

function previewFile(name, rawUrl) {
    document.getElementById('previewTitle').textContent = name;
    document.getElementById('currentRaw').value = rawUrl;
    document.getElementById('previewDl').href = rawUrl;
    document.getElementById('previewDl').download = name;

    var body = document.getElementById('previewBody');
    var ext = name.split('.').pop().toLowerCase();

    if (['png','jpg','jpeg','gif','webp','svg','bmp','ico'].indexOf(ext) >= 0) {
        body.innerHTML = '<img src="' + rawUrl + '" class="preview-img" alt="' + esc(name) + '" onerror="document.getElementById(\'previewBody\').innerHTML=\'<p class=\\\'text-danger p-4\\\'>预览失败，请下载</p>\'">';
    } else if (['mp4','webm','mov'].indexOf(ext) >= 0) {
        body.innerHTML = '<video controls class="preview-video"><source src="' + rawUrl + '"></video>';
    } else if (ext === 'pdf') {
        body.innerHTML = '<iframe src="' + rawUrl + '" width="100%" height="600" style="border:none"></iframe>';
    } else {
        body.innerHTML = '<div class="p-5"><span style="font-size:3rem">' + getIcon(name) + '</span><p class="text-muted mt-2">此文件类型不支持预览</p></div>';
    }

    new bootstrap.Modal(document.getElementById('previewModal')).show();
}

function copyRaw() {
    var raw = document.getElementById('currentRaw').value;
    navigator.clipboard.writeText(raw).then(function() { showToast('已复制 Raw 链接'); });
}

function downloadFile(url, name) {
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(function() { showToast('已复制'); })
        .catch(function() { prompt('', text); });
}

function showToast(msg) {
    var el = document.getElementById('copyToast');
    el.querySelector('span').textContent = msg;
    el.style.display = '';
    clearTimeout(el._t);
    el._t = setTimeout(function() { el.style.display = 'none'; }, 1500);
}


// ==================== 工具 ====================

function formatSize(bytes) {
    if (!bytes) return '0 B';
    var u = ['B','KB','MB','GB'], i = 0, s = bytes;
    while (s >= 1024 && i < u.length-1) { s /= 1024; i++; }
    return s.toFixed(i > 0 ? 1 : 0) + ' ' + u[i];
}

function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function escAttr(str) {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

document.addEventListener('DOMContentLoaded', loadFiles);
document.addEventListener('hidden.bs.modal', function() {
    var v = document.querySelector('#previewBody video');
    if (v) v.pause();
});
