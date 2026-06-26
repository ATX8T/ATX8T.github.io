/**
 * GitHub 图床 - URL 转换工具
 *
 * 支持:
 *   1. GitHub 页面 URL → Raw / jsDelivr / Staticaly
 *   2. Raw URL → jsDelivr / Staticaly
 *   3. 手动拼接
 *   4. 中文文件名自动处理 (decodeURIComponent + 重新编码)
 */


// ==================== URL 解析 ====================

function parseGitHubUrl(url) {
    url = url.trim();

    // 移除协议前缀
    const cleanUrl = url.replace(/^https?:\/\//, '');

    // 模式1: github.com/{owner}/{repo}/blob/{branch}/{path}
    const githubBlobMatch = cleanUrl.match(/^github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/);
    if (githubBlobMatch) {
        return {
            owner: githubBlobMatch[1],
            repo: githubBlobMatch[2],
            branch: githubBlobMatch[3],
            filepath: decodePath(githubBlobMatch[4]),
        };
    }

    // 模式2: raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
    const rawMatch = cleanUrl.match(/^raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)$/);
    if (rawMatch) {
        return {
            owner: rawMatch[1],
            repo: rawMatch[2],
            branch: rawMatch[3],
            filepath: decodePath(rawMatch[4]),
        };
    }

    // 模式3: cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}
    const jsdelivrMatch = cleanUrl.match(/^cdn\.jsdelivr\.net\/gh\/([^\/]+)\/([^@]+)@([^\/]+)\/(.+)$/);
    if (jsdelivrMatch) {
        return {
            owner: jsdelivrMatch[1],
            repo: jsdelivrMatch[2],
            branch: jsdelivrMatch[3],
            filepath: decodePath(jsdelivrMatch[4]),
        };
    }

    // 模式4: cdn.staticaly.com/gh/{owner}/{repo}/{branch}/{path}
    const staticalyMatch = cleanUrl.match(/^cdn\.staticaly\.com\/gh\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)$/);
    if (staticalyMatch) {
        return {
            owner: staticalyMatch[1],
            repo: staticalyMatch[2],
            branch: staticalyMatch[3],
            filepath: decodePath(staticalyMatch[4]),
        };
    }

    return null;
}


/**
 * 解码文件路径中的百分号编码字符（中文等）
 * 输入: images/%E3%80%90...png?raw=true
 * 输出: images/【哲风壁纸】壁纸-天空-度假胜地.png
 */
function decodePath(path) {
    // 先去掉查询参数
    path = path.split('?')[0];
    // 分段解码
    return path.split('/').map(seg => {
        try { return decodeURIComponent(seg); }
        catch (e) { return seg; }
    }).join('/');
}


// ==================== URL 生成 ====================

/**
 * Raw URL: 使用 encodeURIComponent 确保中文正确编码
 */
function buildRawUrl(owner, repo, branch, filepath) {
    const encodedPath = filepath.split('/').map(s => encodeURIComponent(s)).join('/');
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodedPath}`;
}

/**
 * jsDelivr CDN: 推荐用于国内访问
 */
function buildJsdelivrUrl(owner, repo, branch, filepath) {
    const encodedPath = filepath.split('/').map(s => encodeURIComponent(s)).join('/');
    return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${encodedPath}`;
}

/**
 * Staticaly CDN
 */
function buildStaticalyUrl(owner, repo, branch, filepath) {
    const encodedPath = filepath.split('/').map(s => encodeURIComponent(s)).join('/');
    return `https://cdn.staticaly.com/gh/${owner}/${repo}/${branch}/${encodedPath}`;
}


// ==================== 方式一：粘贴自动转换 ====================

function convertUrl() {
    const inputUrl = document.getElementById('inputUrl').value.trim();
    const resultArea = document.getElementById('resultArea');

    if (!inputUrl) {
        showError('请先输入 GitHub 链接');
        return;
    }

    const parsed = parseGitHubUrl(inputUrl);

    if (!parsed) {
        resultArea.classList.add('d-none');
        showError('无法识别此链接格式。\n\n支持的格式：\n  https://github.com/{owner}/{repo}/blob/{branch}/{path}\n  https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}\n  https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}');
        return;
    }

    const { owner, repo, branch, filepath } = parsed;

    const rawUrl = buildRawUrl(owner, repo, branch, filepath);
    const jsdelivrUrl = buildJsdelivrUrl(owner, repo, branch, filepath);
    const staticalyUrl = buildStaticalyUrl(owner, repo, branch, filepath);

    document.getElementById('rawUrl').value = rawUrl;
    document.getElementById('jsdelivrUrl').value = jsdelivrUrl;
    document.getElementById('staticalyUrl').value = staticalyUrl;

    // 预览 - 用 raw URL 作为最可靠的预览源
    const imgPreview = document.getElementById('imgPreview');
    imgPreview.src = rawUrl;
    imgPreview.onerror = function () {
        // raw 失败则尝试 jsdelivr
        if (this.src === rawUrl) {
            this.src = jsdelivrUrl;
        } else {
            this.parentElement.innerHTML = '<span class="text-danger small">图片加载失败</span>';
        }
    };

    resultArea.classList.remove('d-none');
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


// ==================== 方式二：手动拼接 ====================

function manualBuild() {
    const owner = document.getElementById('owner').value.trim();
    const repo = document.getElementById('repo').value.trim();
    const branch = document.getElementById('branch').value.trim();
    const filepath = document.getElementById('filepath').value.trim();

    if (!owner || !repo || !branch || !filepath) {
        showError('请填写所有字段');
        return;
    }

    const rawUrl = buildRawUrl(owner, repo, branch, filepath);
    const jsdelivrUrl = buildJsdelivrUrl(owner, repo, branch, filepath);
    const staticalyUrl = buildStaticalyUrl(owner, repo, branch, filepath);

    document.getElementById('manualRaw').innerHTML =
        '<span class="text-info">Raw:</span> ' + rawUrl;
    document.getElementById('manualJsdelivr').innerHTML =
        '<span class="text-success">jsDelivr:</span> ' + jsdelivrUrl;
    document.getElementById('manualStaticaly').innerHTML =
        '<span class="text-warning">Staticaly:</span> ' + staticalyUrl;

    document.getElementById('manualResult').classList.remove('d-none');
}


// ==================== 复制到剪贴板 ====================

function copyToClipboard(inputId, btn) {
    const input = document.getElementById(inputId);
    input.select();
    input.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(input.value).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = '已复制';
        btn.classList.add('btn-success');
        ['btn-outline-info', 'btn-outline-success', 'btn-outline-warning'].forEach(c => btn.classList.remove(c));
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.classList.remove('btn-success');
            if (inputId.includes('raw')) btn.classList.add('btn-outline-info');
            else if (inputId.includes('jsdelivr')) btn.classList.add('btn-outline-success');
            else btn.classList.add('btn-outline-warning');
        }, 1500);
    }).catch(() => {
        showError('复制失败，请手动选择并复制');
    });
}


// ==================== 工具函数 ====================

function showError(msg) {
    const el = document.querySelector('#toast .toast');
    el.className = 'toast align-items-center text-bg-danger border-0';
    el.querySelector('.toast-body').textContent = msg;
    new bootstrap.Toast(el, { delay: 3000 }).show();
}


// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('inputUrl').addEventListener('keydown', e => {
        if (e.key === 'Enter') convertUrl();
    });

    ['owner', 'repo', 'branch', 'filepath'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => {
            if (e.key === 'Enter') manualBuild();
        });
    });

    document.getElementById('inputUrl').addEventListener('paste', () => {
        setTimeout(() => {
            const val = document.getElementById('inputUrl').value.trim();
            if (val && parseGitHubUrl(val)) convertUrl();
        }, 100);
    });
});
