/**
 * GitHub 资源直链转换工具 (通用版)
 *
 * 输入任意 GitHub 仓库的文件链接 → 输出可直接下载/嵌入网页的直链
 *
 * 支持的输入格式:
 *   - https://github.com/{任意用户}/{任意仓库}/blob/{分支}/{路径}
 *   - https://raw.githubusercontent.com/{任意用户}/{任意仓库}/{分支}/{路径}
 *   - https://cdn.jsdelivr.net/gh/{任意用户}/{任意仓库}@{分支}/{路径}
 *   - https://cdn.staticaly.com/gh/{任意用户}/{任意仓库}/{分支}/{路径}
 */

// ==================== 解析 ====================

function parseGitHubUrl(str) {
    str = str.trim();
    if (!str) return null;

    var u;
    try { u = new URL(str); } catch (e) { return null; }

    var host = u.hostname.toLowerCase();
    var pathname = u.pathname.replace(/\/$/, '');
    var parts = pathname.split('/').filter(Boolean);

    // github.com/owner/repo/blob/branch/...path
    if (host === 'github.com' && parts.length >= 4 && parts[2] === 'blob') {
        return {
            owner: parts[0],
            repo: parts[1],
            branch: parts[3],
            filepath: parts.slice(4).join('/'),
            filename: parts[parts.length - 1]
        };
    }

    // raw.githubusercontent.com/owner/repo/branch/...path
    if (host === 'raw.githubusercontent.com' && parts.length >= 3) {
        return {
            owner: parts[0],
            repo: parts[1],
            branch: parts[2],
            filepath: parts.slice(3).join('/'),
            filename: parts[parts.length - 1]
        };
    }

    // cdn.jsdelivr.net/gh/owner/repo@branch/...path
    if (host === 'cdn.jsdelivr.net' && parts.length >= 2 && parts[0] === 'gh') {
        var rb = parts[1].split('@');
        if (rb.length < 3) return null;
        return {
            owner: rb[0],
            repo: rb[1],
            branch: rb[2],
            filepath: parts.slice(2).join('/'),
            filename: parts[parts.length - 1]
        };
    }

    // cdn.staticaly.com/gh/owner/repo/branch/...path
    if (host === 'cdn.staticaly.com' && parts.length >= 4 && parts[0] === 'gh') {
        return {
            owner: parts[1],
            repo: parts[2],
            branch: parts[3],
            filepath: parts.slice(4).join('/'),
            filename: parts[parts.length - 1]
        };
    }

    return null;
}

// ==================== URL 构建 ====================

function encodePath(filepath) {
    return filepath.split('/').map(function (s) {
        try { return encodeURIComponent(decodeURIComponent(s)); }
        catch (e) { return encodeURIComponent(s); }
    }).join('/');
}

function buildRawUrl(owner, repo, branch, filepath) {
    return 'https://raw.githubusercontent.com/' + owner + '/' + repo + '/' + branch + '/' + encodePath(filepath);
}

function buildJsdelivrUrl(owner, repo, branch, filepath) {
    return 'https://cdn.jsdelivr.net/gh/' + owner + '/' + repo + '@' + branch + '/' + encodePath(filepath);
}

function buildStaticalyUrl(owner, repo, branch, filepath) {
    return 'https://cdn.staticaly.com/gh/' + owner + '/' + repo + '/' + branch + '/' + encodePath(filepath);
}

// ==================== 主转换 ====================

function convertUrl() {
    var input = document.getElementById('inputUrl').value.trim();
    var resultArea = document.getElementById('resultArea');

    if (!input) { toast('请输入 GitHub 文件链接', 'error'); return; }

    var parsed = parseGitHubUrl(input);
    if (!parsed) {
        resultArea.classList.add('d-none');
        toast('无法识别此链接格式', 'error');
        return;
    }

    var rawUrl = buildRawUrl(parsed.owner, parsed.repo, parsed.branch, parsed.filepath);
    var cdnUrl = buildJsdelivrUrl(parsed.owner, parsed.repo, parsed.branch, parsed.filepath);
    var statUrl = buildStaticalyUrl(parsed.owner, parsed.repo, parsed.branch, parsed.filepath);

    // 结果区
    document.getElementById('rawText').textContent = rawUrl;
    document.getElementById('cdnText').textContent = cdnUrl;
    document.getElementById('statText').textContent = statUrl;
    document.getElementById('repoInfo').textContent = parsed.owner + '/' + parsed.repo + ' @' + parsed.branch;
    resultArea.classList.remove('d-none');

    // 下载/打开按钮
    var btnDl = document.getElementById('btnDownload');
    var btnOpen = document.getElementById('btnOpen');
    btnDl.style.display = '';
    btnDl.href = rawUrl;
    btnDl.download = parsed.filename;
    btnOpen.style.display = '';
    btnOpen.href = rawUrl;

    // 嵌入代码
    var ext = parsed.filepath.split('.').pop().toLowerCase();
    var embedArea = document.getElementById('embedArea');

    document.getElementById('htmlImg').textContent =
        '<img src="' + cdnUrl + '" alt="' + parsed.filename + '" />';
    document.getElementById('mdImg').textContent =
        '![' + parsed.filename + '](' + cdnUrl + ')';
    document.getElementById('htmlLink').textContent =
        '<a href="' + cdnUrl + '" download>' + parsed.filename + '</a>';

    // 预览
    resetPreview();

    var IMG = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    var VID = ['mp4', 'webm', 'mov'];

    if (IMG.indexOf(ext) >= 0) {
        embedArea.style.display = '';
        showImgPreview(rawUrl);
    } else if (VID.indexOf(ext) >= 0) {
        embedArea.style.display = 'none';
        showVideoPreview(rawUrl);
    } else {
        embedArea.style.display = 'none';
        document.getElementById('previewMsg').textContent = ext.toUpperCase() + ' 文件 — 点击下方按钮下载';
    }

    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==================== 预览 ====================

function resetPreview() {
    var img = document.getElementById('previewImg');
    var vid = document.getElementById('previewVideo');
    var msg = document.getElementById('previewMsg');
    img.style.display = 'none';
    img.removeAttribute('src');
    vid.style.display = 'none';
    vid.innerHTML = '';
    msg.style.display = '';
    msg.textContent = '正在加载...';
}

function showImgPreview(url) {
    var img = document.getElementById('previewImg');
    document.getElementById('previewMsg').style.display = 'none';
    img.style.display = '';
    img.src = url;
}

function showVideoPreview(url) {
    var vid = document.getElementById('previewVideo');
    document.getElementById('previewMsg').style.display = 'none';
    vid.style.display = '';
    vid.innerHTML = '<source src="' + url + '">';
    vid.load();
}

function previewFail() {
    var img = document.getElementById('previewImg');
    var vid = document.getElementById('previewVideo');
    img.style.display = 'none';
    vid.style.display = 'none';
    document.getElementById('previewMsg').style.display = '';
    document.getElementById('previewMsg').textContent = '预览失败 — 请直接点击下方按钮下载';
}

// ==================== 手动拼接 ====================

function manualBuild() {
    var owner = document.getElementById('owner').value.trim();
    var repo = document.getElementById('repo').value.trim();
    var branch = document.getElementById('branch').value.trim();
    var filepath = document.getElementById('filepath').value.trim();

    if (!owner || !repo || !branch || !filepath) { toast('请填写所有字段', 'error'); return; }

    document.getElementById('mRaw').textContent = buildRawUrl(owner, repo, branch, filepath);
    document.getElementById('mCdn').textContent = buildJsdelivrUrl(owner, repo, branch, filepath);
    document.getElementById('manualResult').classList.remove('d-none');
}

// ==================== 复制 ====================

function doCopy(id) {
    var text = document.getElementById(id).textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(function () {
        toast('已复制到剪贴板');
    }).catch(function () {
        prompt('手动复制 (Ctrl+C):', text);
    });
}

function copyCode(id) {
    var text = document.getElementById(id).textContent;
    navigator.clipboard.writeText(text).then(function () {
        toast('代码已复制');
    }).catch(function () {
        prompt('手动复制 (Ctrl+C):', text);
    });
}

// ==================== Toast ====================

function toast(msg, type) {
    var bar = document.getElementById('toastBar');
    var span = bar.querySelector('span');
    span.textContent = msg;
    span.style.background = (type === 'error') ? '#dc3545' : '#198754';
    bar.style.display = '';
    clearTimeout(bar._timer);
    bar._timer = setTimeout(function () { bar.style.display = 'none'; }, 2000);
}

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('inputUrl');
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') convertUrl();
    });
    input.addEventListener('paste', function () {
        setTimeout(function () {
            if (input.value.trim() && parseGitHubUrl(input.value)) convertUrl();
        }, 150);
    });
    ['owner', 'repo', 'branch', 'filepath'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') manualBuild();
        });
    });
});
