/**
 * GitHub 图床 - URL 转换工具
 *
 * 支持的转换：
 *   1. GitHub 页面 URL → Raw / jsDelivr / Staticaly
 *   2. Raw URL → jsDelivr / Staticaly
 *   3. 手动拼接
 */


// ==================== URL 解析 ====================

/**
 * 从各种 GitHub URL 中提取 owner, repo, branch, filepath
 *
 * 支持的输入格式:
 *   - https://github.com/ATX8T/ATX8T.github.io/blob/main/images/example.png
 *   - https://github.com/ATX8T/ATX8T.github.io/blob/main/images/example.png?raw=true
 *   - https://raw.githubusercontent.com/ATX8T/ATX8T.github.io/main/images/example.png
 *   - https://cdn.jsdelivr.net/gh/ATX8T/ATX8T.github.io@main/images/example.png
 *   - ATX8T/ATX8T.github.io/blob/main/images/example.png
 */
function parseGitHubUrl(url) {
    url = url.trim();

    // 移除协议前缀便于解析
    const cleanUrl = url.replace(/^https?:\/\//, '');

    // 模式1: github.com/{owner}/{repo}/blob/{branch}/{path}
    const githubBlobMatch = cleanUrl.match(/^github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/);
    if (githubBlobMatch) {
        let filepath = githubBlobMatch[4];
        // 移除 ?raw=true 等查询参数
        filepath = filepath.split('?')[0];
        return {
            owner: githubBlobMatch[1],
            repo: githubBlobMatch[2],
            branch: githubBlobMatch[3],
            filepath: filepath,
        };
    }

    // 模式2: raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
    const rawMatch = cleanUrl.match(/^raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)$/);
    if (rawMatch) {
        return {
            owner: rawMatch[1],
            repo: rawMatch[2],
            branch: rawMatch[3],
            filepath: rawMatch[4].split('?')[0],
        };
    }

    // 模式3: cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}
    const jsdelivrMatch = cleanUrl.match(/^cdn\.jsdelivr\.net\/gh\/([^\/]+)\/([^@]+)@([^\/]+)\/(.+)$/);
    if (jsdelivrMatch) {
        return {
            owner: jsdelivrMatch[1],
            repo: jsdelivrMatch[2],
            branch: jsdelivrMatch[3],
            filepath: jsdelivrMatch[4].split('?')[0],
        };
    }

    // 模式4: cdn.staticaly.com/gh/{owner}/{repo}/{branch}/{path}
    const staticalyMatch = cleanUrl.match(/^cdn\.staticaly\.com\/gh\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)$/);
    if (staticalyMatch) {
        return {
            owner: staticalyMatch[1],
            repo: staticalyMatch[2],
            branch: staticalyMatch[3],
            filepath: staticalyMatch[4].split('?')[0],
        };
    }

    return null;
}


// ==================== URL 生成 ====================

function buildRawUrl(owner, repo, branch, filepath) {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filepath}`;
}

function buildJsdelivrUrl(owner, repo, branch, filepath) {
    return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${filepath}`;
}

function buildStaticalyUrl(owner, repo, branch, filepath) {
    return `https://cdn.staticaly.com/gh/${owner}/${repo}/${branch}/${filepath}`;
}


// ==================== 方式一：粘贴自动转换 ====================

function convertUrl() {
    const inputUrl = document.getElementById('inputUrl').value.trim();
    const resultArea = document.getElementById('resultArea');

    if (!inputUrl) {
        showError('请先输入 GitHub 图片链接');
        return;
    }

    const parsed = parseGitHubUrl(inputUrl);

    if (!parsed) {
        resultArea.classList.add('d-none');
        showError(
            '无法识别此链接格式。\n\n' +
            '支持的格式：\n' +
            '  • https://github.com/{owner}/{repo}/blob/{branch}/{path}\n' +
            '  • https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}\n' +
            '  • https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}'
        );
        return;
    }

    const { owner, repo, branch, filepath } = parsed;

    const rawUrl = buildRawUrl(owner, repo, branch, filepath);
    const jsdelivrUrl = buildJsdelivrUrl(owner, repo, branch, filepath);
    const staticalyUrl = buildStaticalyUrl(owner, repo, branch, filepath);

    // 填充结果
    document.getElementById('rawUrl').value = rawUrl;
    document.getElementById('jsdelivrUrl').value = jsdelivrUrl;
    document.getElementById('staticalyUrl').value = staticalyUrl;

    // 预览（使用 jsDelivr 作为预览源，国内更快）
    const imgPreview = document.getElementById('imgPreview');
    imgPreview.src = jsdelivrUrl;

    // 显示结果区
    resultArea.classList.remove('d-none');

    // 滚动到结果
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
        `<span class="text-info">📦 Raw:</span> ${rawUrl}`;
    document.getElementById('manualJsdelivr').innerHTML =
        `<span class="text-success">🚀 jsDelivr:</span> ${jsdelivrUrl}`;
    document.getElementById('manualStaticaly').innerHTML =
        `<span class="text-warning">🌐 Staticaly:</span> ${staticalyUrl}`;

    document.getElementById('manualResult').classList.remove('d-none');
}


// ==================== 复制到剪贴板 ====================

function copyToClipboard(inputId, btn) {
    const input = document.getElementById(inputId);
    input.select();
    input.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(input.value).then(() => {
        // 按钮反馈
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ 已复制';
        btn.classList.add('btn-success');
        btn.classList.remove('btn-outline-info', 'btn-outline-success', 'btn-outline-warning');
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-success');
            if (inputId.includes('raw')) btn.classList.add('btn-outline-info');
            else if (inputId.includes('jsdelivr')) btn.classList.add('btn-outline-success');
            else btn.classList.add('btn-outline-warning');
        }, 1500);

        showToast('✅ 已复制到剪贴板');
    }).catch(() => {
        showError('复制失败，请手动选择并复制');
    });
}


// ==================== 工具函数 ====================

function showError(msg) {
    const toastEl = document.querySelector('#toast .toast');
    toastEl.className = 'toast align-items-center text-bg-danger border-0';
    toastEl.querySelector('.toast-body').textContent = msg;
    toastEl.querySelector('.btn-close')?.classList.replace('btn-close-white', 'btn-close-white');
    showToast();
}

function showToast(msg) {
    const toastEl = document.querySelector('#toast .toast');
    // 如果是成功消息
    if (msg && msg.includes('✅')) {
        toastEl.className = 'toast align-items-center text-bg-success border-0';
        toastEl.querySelector('.toast-body').textContent = msg;
    }
    const toast = new bootstrap.Toast(toastEl, { delay: 2000 });
    toast.show();
}


// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
    // 回车键触发转换
    document.getElementById('inputUrl').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') convertUrl();
    });

    // 手动拼接的回车键
    const manualInputs = ['owner', 'repo', 'branch', 'filepath'];
    manualInputs.forEach(id => {
        document.getElementById(id).addEventListener('keydown', (e) => {
            if (e.key === 'Enter') manualBuild();
        });
    });

    // 粘贴时自动触发转换（延迟一点等值填入）
    document.getElementById('inputUrl').addEventListener('paste', () => {
        setTimeout(() => {
            const val = document.getElementById('inputUrl').value.trim();
            if (val && parseGitHubUrl(val)) {
                convertUrl();
            }
        }, 100);
    });
});
