/**
 * 统一导航栏组件
 * 在各页面引入此脚本即可自动生成导航栏
 */
(function() {
    // 获取当前页面相对于根目录的深度
    function getBasePath() {
        const path = window.location.pathname;
        const depth = (path.match(/\//g) || []).length - 1;
        return '../'.repeat(depth) || './';
    }

    const basePath = getBasePath();

    // 导航栏HTML
    const navbarHTML = `
    <nav class="unified-navbar">
        <div class="navbar-container">
            <a href="${basePath}index.html" class="navbar-brand">
                <span class="brand-icon">🛠️</span>
                <span class="brand-text">ATX8T</span>
            </a>
            <button class="navbar-toggle" onclick="toggleMobileMenu()">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <div class="navbar-menu">
                <a href="${basePath}index.html" class="navbar-link">首页</a>
                <a href="${basePath}Password/index.html" class="navbar-link">密码生成器</a>
                <a href="${basePath}SubnetDivision/calcul451.html" class="navbar-link">子网划分</a>
                <a href="${basePath}Cloudflare/CloudflareR2Worker.html" class="navbar-link">图床管理</a>
                <a href="https://github.com/ATX8T" class="navbar-link" target="_blank">GitHub</a>
            </div>
        </div>
    </nav>
    `;

    // 导航栏样式
    const navbarCSS = `
    .unified-navbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        background: rgba(15, 15, 30, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0 20px;
    }
    .navbar-container {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 60px;
    }
    .navbar-brand {
        display: flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        color: #fff;
        font-weight: 700;
        font-size: 1.3rem;
    }
    .brand-icon { font-size: 1.4rem; }
    .navbar-menu {
        display: flex;
        gap: 8px;
    }
    .navbar-link {
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 0.9rem;
        transition: all 0.3s;
    }
    .navbar-link:hover {
        color: #fff;
        background: rgba(102, 126, 234, 0.3);
    }
    .navbar-toggle {
        display: none;
        flex-direction: column;
        gap: 5px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
    }
    .navbar-toggle span {
        width: 25px;
        height: 2px;
        background: #fff;
        border-radius: 2px;
        transition: all 0.3s;
    }
    @media (max-width: 768px) {
        .navbar-toggle { display: flex; }
        .navbar-menu {
            display: none;
            position: absolute;
            top: 60px;
            left: 0;
            right: 0;
            flex-direction: column;
            background: rgba(15, 15, 30, 0.98);
            padding: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .navbar-menu.active { display: flex; }
        .navbar-link {
            padding: 12px 16px;
            border-radius: 8px;
        }
    }
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = navbarCSS;
    document.head.appendChild(style);

    // 注入导航栏
    document.addEventListener('DOMContentLoaded', function() {
        document.body.insertAdjacentHTML('afterbegin', navbarHTML);
        // 为body添加顶部padding
        document.body.style.paddingTop = '60px';
    });

    // 移动端菜单切换
    window.toggleMobileMenu = function() {
        const menu = document.querySelector('.navbar-menu');
        if (menu) menu.classList.toggle('active');
    };
})();
