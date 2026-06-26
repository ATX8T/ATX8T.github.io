/**
 * 密码生成器 — 纯前端，使用 crypto.getRandomValues 确保安全随机
 *
 * 功能:
 *   - 长度 6-64，字符类型自由组合
 *   - 排除易混淆字符、禁止连续重复
 *   - 实时强度检测 (基于熵值评分)
 *   - 批量生成 (1-10)
 *   - 历史记录 (最近10条)
 */

// ==================== 状态 ====================

var state = {
    length: 16,
    lower: true, upper: true, number: true, symbol: true,
    exclude: true,
    unique: false,
    count: 1,
};
var history = [];
var MAX_HISTORY = 10;

// 字符集
var CHARS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    number: '0123456789',
    symbol: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};
var AMBIGUOUS = { l:1, I:1, 1:1, 0:1, O:1, o:1 };


// ==================== 生成 ====================

function generate() {
    // 构建字符集
    var pool = '';
    if (state.lower) pool += CHARS.lower;
    if (state.upper) pool += CHARS.upper;
    if (state.number) pool += CHARS.number;
    if (state.symbol) pool += CHARS.symbol;

    // 排除易混淆
    if (state.exclude) {
        pool = pool.split('').filter(function(c) { return !AMBIGUOUS[c]; }).join('');
    }

    if (!pool) {
        setDisplay('请至少选一种字符类型', false);
        updateStrength('');
        return;
    }

    // 批量生成
    var passwords = [];
    for (var i = 0; i < state.count; i++) {
        passwords.push(generateOne(pool));
    }

    // 显示
    if (state.count === 1) {
        setDisplay(passwords[0], true);
    } else {
        setDisplay(passwords[0], true);
        renderBatch(passwords);
    }

    updateStrength(passwords[0]);

    // 加入历史
    addHistory(passwords);
}


function generateOne(pool) {
    var arr = new Uint32Array(state.length);
    crypto.getRandomValues(arr);

    var result = '';
    for (var i = 0; i < state.length; i++) {
        var idx = arr[i] % pool.length;
        var ch = pool[idx];

        // 禁止连续重复
        if (state.unique && result.length > 0) {
            var retries = 0;
            while (ch === result[result.length - 1] && retries < 10) {
                arr[i] = (arr[i] * 16807 + 1) % 2147483647; // simple LCG
                idx = arr[i] % pool.length;
                ch = pool[idx];
                retries++;
            }
        }
        result += ch;
    }
    return result;
}


// ==================== 显示 ====================

function setDisplay(text, generated) {
    var el = document.getElementById('passwordText');
    el.textContent = text;
    el.className = 'password-text' + (generated ? ' generated' : '');
}

function renderBatch(passwords) {
    var batch = document.getElementById('batchResult');
    var list = document.getElementById('batchList');
    batch.style.display = '';
    list.innerHTML = '';

    passwords.forEach(function(pw, i) {
        var div = document.createElement('div');
        div.className = 'batch-item';
        div.innerHTML =
            '<span class="batch-pw">' + pw + '</span>' +
            '<button class="batch-copy" onclick="copyText(\'' + esq(pw) + '\')">复制</button>';
        list.appendChild(div);
    });
}


// ==================== 强度检测 ====================

function updateStrength(password) {
    if (!password || password.length < 2) {
        document.getElementById('strengthText').textContent = '-';
        document.getElementById('strengthBar').style.width = '0%';
        document.getElementById('strengthDetails').textContent = '';
        return;
    }

    // 计算熵
    var charsetSize = 0;
    if (password.match(/[a-z]/)) charsetSize += 26;
    if (password.match(/[A-Z]/)) charsetSize += 26;
    if (password.match(/[0-9]/)) charsetSize += 10;
    if (password.match(/[^a-zA-Z0-9]/)) charsetSize += 30;

    var entropy = password.length * Math.log2(charsetSize || 26);

    // 评分
    var score, label, color, pct;
    if (entropy < 40)       { score = 0; label = '弱'; color = '#ef4444'; pct = 15; }
    else if (entropy < 60)  { score = 1; label = '一般'; color = '#f59e0b'; pct = 35; }
    else if (entropy < 80)  { score = 2; label = '良好'; color = '#3b82f6'; pct = 60; }
    else if (entropy < 100) { score = 3; label = '强'; color = '#10b981'; pct = 80; }
    else                    { score = 4; label = '非常强'; color = '#059669'; pct = 100; }

    var bar = document.getElementById('strengthBar');
    bar.style.width = pct + '%';
    bar.style.background = color;

    document.getElementById('strengthText').textContent = label;
    document.getElementById('strengthText').style.color = color;
    document.getElementById('strengthDetails').textContent =
        '熵值: ' + Math.round(entropy) + ' bit | 长度: ' + password.length + ' | 字符集: ' + charsetSize + ' 种';
}


// ==================== 历史记录 ====================

function addHistory(passwords) {
    passwords.forEach(function(pw) {
        history.unshift(pw);
        if (history.length > MAX_HISTORY) history.pop();
    });
    renderHistory();
}

function renderHistory() {
    var container = document.getElementById('historyList');
    if (!history.length) {
        container.innerHTML = '<div class="history-empty">点击「刷新」生成第一条密码</div>';
        return;
    }
    container.innerHTML = '';
    history.forEach(function(pw, i) {
        var div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML =
            '<span class="h-pw">' + pw + '</span>' +
            '<span class="h-actions">' +
                '<button class="h-btn" onclick="copyText(\'' + esq(pw) + '\')">📋</button>' +
            '</span>';
        container.appendChild(div);
    });
}


// ==================== 交互 ====================

function onLengthChange(val) {
    state.length = parseInt(val);
    document.getElementById('lengthValue').textContent = val;
    generate();
}

function toggleOption(type) {
    state[type] = !state[type];
    var el = document.getElementById('toggle' + type.charAt(0).toUpperCase() + type.slice(1));
    if (state[type]) el.classList.add('active');
    else el.classList.remove('active');

    // 至少选一种
    var any = state.lower || state.upper || state.number || state.symbol;
    if (!any) {
        state.lower = true;
        document.getElementById('toggleLower').classList.add('active');
    }

    // 如果批量模式则重置
    if (state.count > 1) {
        document.getElementById('batchResult').style.display = 'none';
    }
    generate();
}

function toggleCheck(type) {
    state[type] = !state[type];
    var el = document.getElementById('check' + type.charAt(0).toUpperCase() + type.slice(1));
    var box = document.getElementById('check' + type.charAt(0).toUpperCase() + type.slice(1) + 'Box');
    if (state[type]) { el.classList.add('checked'); box.textContent = '✓'; }
    else { el.classList.remove('checked'); box.textContent = ''; }
    generate();
}

function copyPassword() {
    var text = document.getElementById('passwordText').textContent;
    copyText(text);
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(function() {
        toast('✅ 已复制到剪贴板');
    }).catch(function() {
        prompt('手动复制 (Ctrl+C):', text);
    });
}

function toast(msg) {
    var bar = document.getElementById('toastBar');
    bar.querySelector('span').textContent = msg;
    bar.style.display = '';
    clearTimeout(bar._timer);
    bar._timer = setTimeout(function() { bar.style.display = 'none'; }, 1800);
}

function esq(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }


// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', function() {
    // 批量数量滑块
    document.getElementById('countSlider').addEventListener('input', function() {
        state.count = parseInt(this.value);
        document.getElementById('countValue').textContent = state.count;
        document.getElementById('batchResult').style.display = 'none';
        generate();
    });

    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        if (e.key === 'r' && e.ctrlKey) {
            e.preventDefault();
            generate();
        }
        if (e.key === 'c' && e.ctrlKey && document.activeElement === document.body) {
            copyPassword();
        }
    });

    // 首次生成
    generate();
});
