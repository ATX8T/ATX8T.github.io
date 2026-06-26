/**
 * GitHub 图床 URL 转换器
 * 使用 URL API 解析，比正则更可靠，完美处理中文文件名
 *
 * 转换规则:
 *   github.com/OWNER/REPO/blob/BRANCH/PATH
 *     → raw.githubusercontent.com/OWNER/REPO/BRANCH/PATH    (Raw)
 *     → cdn.jsdelivr.net/gh/OWNER/REPO@BRANCH/PATH            (jsDelivr)
 *     → cdn.staticaly.com/gh/OWNER/REPO/BRANCH/PATH           (Staticaly)
 */

// ==================== 解析 ====================

function parseGitHubUrl(str) {
    str = str.trim();
    if (!str) return null;

    var u;
    try { u = new URL(str); } catch(e) { return null; }

    var host = u.hostname.toLowerCase();
    var pathname = u.pathname.replace(/\/$/, ''); // 去掉末尾 /
    var parts = pathname.split('/').filter(Boolean);

    // 模式1: github.com/owner/repo/blob/branch/...path
    if (host === 'github.com' && parts.length >= 4 && parts[2] === 'blob') {
        return {
            owner: parts[0],
            repo: parts[1],
            branch: parts[3],
            filepath: parts.slice(4).join('/'),
        };
    }

    // 模式2: raw.githubusercontent.com/owner/repo/branch/...path
    if (host === 'raw.githubusercontent.com' && parts.length >= 3) {
        return {
            owner: parts[0],
            repo: parts[1],
            branch: parts[2],
            filepath: parts.slice(3).join('/'),
        };
    }

    // 模式3: cdn.jsdelivr.net/gh/owner/repo@branch/...path
    if (host === 'cdn.jsdelivr.net' && parts.length >= 2 && parts[0] === 'gh') {
        var repoAndBranch = parts[1].split('@');
        if (repoAndBranch.length < 2) return null;
        return {
            owner: repoAndBranch[0],
            repo: repoAndBranch[1],
            branch: repoAndBranch[2],
            filepath: parts.slice(2).join('/'),
        };
    }

    // 模式4: cdn.staticaly.com/gh/owner/repo/branch/...path
    if (host === 'cdn.staticaly.com' && parts.length >= 4 && parts[0] === 'gh') {
        return {
            owner: parts[1],
            repo: parts[2],
            branch: parts[3],
            filepath: parts.slice(4).join('/'),
        };
    }

    return null;
}


// ==================== URL 生成 ====================

function buildRawUrl(owner, repo, branch, filepath) {
    // 分段编码路径（保留 / 分隔符）
    var encoded = filepath.split('/').map(function(s) {
        return encodeURIComponent(decodeURIComponent(s));
    }).join('/');
    return 'https://raw.githubusercontent.com/' + owner + '/' + repo + '/' + branch + '/' + encoded;
}

function buildJsdelivrUrl(owner, repo, branch, filepath) {
    var encoded = filepath.split('/').map(function(s) {
        return encodeURIComponent(decodeURIComponent(s));
    }).join('/');
    return 'https://cdn.jsdelivr.net/gh/' + owner + '/' + repo + '@' + branch + '/' + encoded;
}

function buildStaticalyUrl(owner, repo, branch, filepath) {
    var encoded = filepath.split('/').map(function(s) {
        return encodeURIComponent(decodeURIComponent(s));
    }).join('/');
    return 'https://cdn.staticaly.com/gh/' + owner + '/' + repo + '/' + branch + '/' + encoded;
}


// ==================== 主转换 ====================

function convertUrl() {
    var input = document.getElementById('inputUrl').value.trim();
    var resultArea = document.getElementById('resultArea');

    if (!input) {
        toast('请输入 GitHub 链接', 'error');
        return;
    }

    var parsed = parseGitHubUrl(input);

    if (!parsed) {
        resultArea.classList.add('d-none');
        toast('无法识别此链接格式，请检查是否为 GitHub 文件链接', 'error');
        return;
    }

    var rawUrl = buildRawUrl(parsed.owner, parsed.repo, parsed.branch, parsed.filepath);
    var cdnUrl = buildJsdelivrUrl(parsed.owner, parsed.repo, parsed.branch, parsed.filepath);
    var statUrl = buildStaticalyUrl(parsed.owner, parsed.repo, parsed.branch, parsed.filepath);

    // 填充结果
    document.getElementById('rawText').textContent = rawUrl;
    document.getElementById('cdnText').textContent = cdnUrl;
    document.getElementById('statText').textContent = statUrl;

    // 结果区可见
    resultArea.classList.remove('d-none');

    // 预览图片
    var img = document.getElementById('previewImg');
    var placeholder = document.getElementById('previewPlaceholder');
    var ext = parsed.filepath.split('.').pop().toLowerCase();
    var imageExts = ['jpg','jpeg','png','gif','webp','svg','bmp','ico'];

    if (imageExts.indexOf(ext) >= 0) {
        img.style.display = '';
        placeholder.style.display = 'none';
        img.src = rawUrl;
    } else {
        img.style.display = 'none';
        placeholder.style.display = '';
        placeholder.textContent = '此文件不是图片，无法预览（可用下载链接直接访问）';
    }

    // 滚动到结果
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ==================== 手动拼接 ====================

function manualBuild() {
    var owner = document.getElementById('owner').value.trim();
    var repo = document.getElementById('repo').value.trim();
    var branch = document.getElementById('branch').value.trim();
    var filepath = document.getElementById('filepath').value.trim();

    if (!owner || !repo || !branch || !filepath) {
        toast('请填写所有字段', 'error');
        return;
    }

    var rawUrl = buildRawUrl(owner, repo, branch, filepath);
    var cdnUrl = buildJsdelivrUrl(owner, repo, branch, filepath);

    document.getElementById('mRaw').textContent = rawUrl;
    document.getElementById('mCdn').textContent = cdnUrl;
    document.getElementById('manualResult').classList.remove('d-none');
}


// ==================== 复制 ====================

function doCopy(id) {
    var text = document.getElementById(id).textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(function() {
        toast('已复制到剪贴板');
    }).catch(function() {
        prompt('手动复制:', text);
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
    bar._timer = setTimeout(function() { bar.style.display = 'none'; }, 2000);
}


// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', function() {
    var input = document.getElementById('inputUrl');

    // 回车转换
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') convertUrl();
    });

    // 粘贴自动转换
    input.addEventListener('paste', function() {
        setTimeout(function() {
            var val = input.value.trim();
            if (val && parseGitHubUrl(val)) convertUrl();
        }, 150);
    });

    // 手动拼接回车
    ['owner','repo','branch','filepath'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') manualBuild();
        });
    });
});
