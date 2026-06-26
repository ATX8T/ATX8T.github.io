/**
 * GitHub Image Gallery - 核心脚本
 * 
 * 功能: 通过 GitHub API 读取仓库中的图片文件并展示在网页上
 * 支持: 浏览、上传、删除图片, Lightbox 预览
 * 
 * 安全机制:
 *   源码中 Token 使用占位符 __GITHUB_TOKEN__
 *   GitHub Actions 在部署时会从 Secrets 读取真实 Token 并注入
 *   这样 Token 不会出现在 Git 历史记录中
 */

// ==================== 配置 ====================

// __GITHUB_TOKEN__ 是部署时的注入占位符，GitHub Actions 会替换为真实 Token
const GITHUB_TOKEN = '__GITHUB_TOKEN__';
const GITHUB_API = 'https://api.github.com';

let config = {
    owner: 'ATX8T',
    repo: 'ATX8T.github.io',
    path: 'images',        // 图片存储的文件夹路径
    branch: 'main',        // 分支名
};

// 图片扩展名白名单
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];

// ==================== 状态 ====================

let allImages = [];        // 当前加载的所有图片
let currentIndex = -1;     // Lightbox 当前索引

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
    // 从 localStorage 加载配置
    const savedConfig = localStorage.getItem('galleryConfig');
    if (savedConfig) {
        try {
            config = { ...config, ...JSON.parse(savedConfig) };
            document.getElementById('cfgOwner').value = config.owner;
            document.getElementById('cfgRepo').value = config.repo;
            document.getElementById('cfgPath').value = config.path;
        } catch (e) {
            /* ignore */
        }
    }

    // 上传按钮
    document.getElementById('uploadInput').addEventListener('change', handleFileUpload);

    // 键盘导航
    document.addEventListener('keydown', (e) => {
        const overlay = document.getElementById('lightboxOverlay');
        if (overlay && overlay.style.display !== 'none') {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigateImage(-1);
            if (e.key === 'ArrowRight') navigateImage(1);
        }
    });

    // 开始加载
    loadImages();
});

// ==================== API 封装 ====================

async function githubAPI(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API}/repos/${config.owner}/${config.repo}${endpoint}`;
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    // 速率限制信息
    const rateLimit = {
        remaining: response.headers.get('X-RateLimit-Remaining'),
        limit: response.headers.get('X-RateLimit-Limit'),
        reset: response.headers.get('X-RateLimit-Reset'),
    };

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const error = new Error(body.message || `GitHub API 错误: ${response.status}`);
        error.status = response.status;
        error.body = body;
        error.rateLimit = rateLimit;
        throw error;
    }

    const data = await response.json();
    data._rateLimit = rateLimit;
    return data;
}

// ==================== 加载图片 ====================

async function loadImages() {
    const gallery = document.getElementById('gallery');
    const loading = document.getElementById('loading');
    const errorBox = document.getElementById('errorBox');
    const emptyBox = document.getElementById('emptyBox');

    // 显示加载状态
    loading.classList.remove('d-none');
    errorBox.classList.add('d-none');
    emptyBox.classList.add('d-none');
    gallery.innerHTML = '';

    try {
        // 获取目录内容
        const contents = await githubAPI(`/contents/${config.path}?ref=${config.branch}`);

        // 过滤图片文件
        const imageFiles = Array.isArray(contents)
            ? contents.filter(item => {
                if (item.type !== 'file') return false;
                const ext = '.' + item.name.split('.').pop().toLowerCase();
                return IMAGE_EXTENSIONS.includes(ext);
            })
            : [];

        allImages = imageFiles;

        // 更新计数
        document.getElementById('imageCount').textContent = `${allImages.length} 张`;

        loading.classList.add('d-none');

        if (allImages.length === 0) {
            emptyBox.classList.remove('d-none');
        } else {
            renderGallery(allImages);
        }

        console.log(`✅ 加载了 ${allImages.length} 张图片`, {
            rateLimit: contents._rateLimit
        });

    } catch (error) {
        loading.classList.add('d-none');

        if (error.status === 404) {
            // 目录不存在
            emptyBox.classList.remove('d-none');
            document.getElementById('imageCount').textContent = '0 张';
            showError(`目录 "${config.path}" 不存在，请先在 GitHub 仓库中创建该文件夹，或修改上方配置中的路径。`);
        } else if (error.status === 401) {
            showError('GitHub Token 无效或已过期，请更新 Token。');
        } else if (error.status === 403 && error.rateLimit?.remaining === '0') {
            showError('GitHub API 速率限制已达上限，请稍后再试。');
        } else {
            showError(error.message || '加载图片时发生未知错误');
        }
    }
}

function showError(msg) {
    const errorBox = document.getElementById('errorBox');
    const errorMsg = document.getElementById('errorMsg');
    errorBox.classList.remove('d-none');
    errorMsg.textContent = msg;
}

// ==================== 渲染画廊 ====================

function renderGallery(images) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    images.forEach((img, index) => {
        const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3 col-lg-2';
        col.style.animationDelay = `${index * 0.03}s`;

        // 格式化文件大小
        const size = formatFileSize(img.size);

        col.innerHTML = `
            <div class="card bg-dark text-light gallery-card h-100" onclick="openLightbox(${index})">
                <div class="card-img-wrapper">
                    <img src="${img.download_url}" 
                         alt="${escapeHtml(img.name)}" 
                         loading="lazy"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2212%22>加载失败</text></svg>'">
                </div>
                <div class="card-body d-flex justify-content-between align-items-center">
                    <span class="card-name text-truncate small" title="${escapeHtml(img.name)}">${escapeHtml(img.name)}</span>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-outline-info" 
                                title="下载" 
                                onclick="event.stopPropagation(); downloadImage('${img.download_url}', '${escapeAttr(img.name)}')">
                            💾
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                title="删除" 
                                onclick="event.stopPropagation(); deleteImage('${escapeAttr(img.path)}', '${escapeAttr(img.name)}', ${index})">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-secondary px-2 py-1">
                    <small class="text-secondary">${size}</small>
                </div>
            </div>
        `;

        gallery.appendChild(col);
    });
}

// ==================== Lightbox 灯箱 ====================

function openLightbox(index) {
    currentIndex = index;
    renderLightbox();
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const overlay = document.getElementById('lightboxOverlay');
    if (overlay) {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
        }, 180);
    }
}

function navigateImage(direction) {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < allImages.length) {
        currentIndex = newIndex;
        renderLightbox();
    }
}

function renderLightbox() {
    // 移除旧 overlay
    const old = document.getElementById('lightboxOverlay');
    if (old) old.remove();

    const img = allImages[currentIndex];
    if (!img) return;

    const overlay = document.createElement('div');
    overlay.id = 'lightboxOverlay';
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
        <span class="lightbox-close" onclick="event.stopPropagation(); closeLightbox()">&times;</span>
        ${currentIndex > 0 ? '<span class="lightbox-nav lightbox-prev" onclick="event.stopPropagation(); navigateImage(-1)">&#10094;</span>' : ''}
        ${currentIndex < allImages.length - 1 ? '<span class="lightbox-nav lightbox-next" onclick="event.stopPropagation(); navigateImage(1)">&#10095;</span>' : ''}
        <div class="lightbox-img-container" onclick="event.stopPropagation()">
            <img src="${img.download_url}" alt="${escapeHtml(img.name)}" 
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22><rect fill=%22%23333%22 width=%22300%22 height=%22300%22/><text x=%22150%22 y=%22160%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2216%22>图片加载失败</text></svg>'">
            <div class="lightbox-info">
                <span>${escapeHtml(img.name)} · ${formatFileSize(img.size)} · ${currentIndex + 1}/${allImages.length}</span>
                <a href="${img.download_url}" download="${img.name}" class="btn btn-sm btn-outline-light" onclick="event.stopPropagation()">💾 下载原图</a>
            </div>
        </div>
    `;

    // 点击背景关闭
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLightbox();
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
}

// ==================== 上传图片 ====================

async function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const progressToast = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('uploadProgressBar');
    const progressText = document.getElementById('uploadProgressText');

    progressToast.classList.remove('d-none');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = Math.round(((i) / files.length) * 100);
        progressBar.style.width = progress + '%';
        progressText.textContent = `正在上传 ${i + 1}/${files.length}: ${file.name}`;

        try {
            await uploadImage(file);
            successCount++;
        } catch (error) {
            failCount++;
            console.error('上传失败:', file.name, error);
        }
    }

    progressBar.style.width = '100%';
    progressText.textContent = successCount > 0
        ? `✅ 成功上传 ${successCount} 张${failCount > 0 ? `，${failCount} 张失败` : ''}`
        : `❌ 上传失败`;

    // 重置文件选择
    event.target.value = '';

    // 延迟隐藏进度
    setTimeout(() => {
        progressToast.classList.add('d-none');
        progressBar.style.width = '0%';
    }, 3000);

    // 重新加载
    if (successCount > 0) {
        setTimeout(loadImages, 500);
    }
}

async function uploadImage(file) {
    // 读取文件为 base64
    const base64Content = await readFileAsBase64(file);

    // 构建上传路径
    const filePath = `${config.path}/${file.name}`;

    // 提交信息
    const commitMessage = `📷 Upload: ${file.name}`;

    const body = {
        message: commitMessage,
        content: base64Content,
        branch: config.branch,
    };

    await githubAPI(`/contents/${filePath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    console.log(`✅ 已上传: ${file.name}`);
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // 去掉 data:image/xxx;base64, 前缀
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==================== 删除图片 ====================

async function deleteImage(path, name, index) {
    if (!confirm(`确定要删除 "${name}" 吗？此操作不可撤销。`)) return;

    try {
        // 先获取文件的 sha
        const fileInfo = await githubAPI(`/contents/${path}?ref=${config.branch}`);

        await githubAPI(`/contents/${path}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `🗑️ Delete: ${name}`,
                sha: fileInfo.sha,
                branch: config.branch,
            }),
        });

        console.log(`✅ 已删除: ${name}`);

        // 从列表中移除
        allImages.splice(index, 1);
        if (allImages.length === 0) {
            document.getElementById('emptyBox').classList.remove('d-none');
            document.getElementById('gallery').innerHTML = '';
        } else {
            renderGallery(allImages);
        }
        document.getElementById('imageCount').textContent = `${allImages.length} 张`;

        // 关闭 lightbox
        closeLightbox();

    } catch (error) {
        alert(`删除失败: ${error.message}`);
    }
}

// ==================== 下载图片 ====================

function downloadImage(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ==================== 配置保存 ====================

function saveAndReload() {
    config.owner = document.getElementById('cfgOwner').value.trim();
    config.repo = document.getElementById('cfgRepo').value.trim();
    config.path = document.getElementById('cfgPath').value.trim();

    localStorage.setItem('galleryConfig', JSON.stringify(config));
    loadImages();
}

// ==================== 工具函数 ====================

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }
    return size.toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\\/g, '\\\\');
}
