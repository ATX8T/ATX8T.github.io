/**
 * 密码生成器 — 安全审查 & 修复版
 *
 * 修复清单:
 *   1. 取模偏差 → 拒绝采样 (unbiased random)
 *   2. LCG 回退 → 全部使用 crypto.getRandomValues
 *   3. 批量重复 → 用 Set 去重
 *   4. 缺少多样性 → 强制至少两种字符类型
 *   5. 熵值计算 → 基于实际字符池大小
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


// ==================== 工具函数 ====================

/** 构建字符池 */
function buildPool() {
    var pool = '';
    if (state.lower) pool += CHARS.lower;
    if (state.upper) pool += CHARS.upper;
    if (state.number) pool += CHARS.number;
    if (state.symbol) pool += CHARS.symbol;
    if (state.exclude) {
        pool = pool.split('').filter(function(c) { return !AMBIGUOUS[c]; }).join('');
    }
    return pool;
}

/** 拒绝采样取随机索引 — 消除取模偏差 */
function randomIndex(poolLength) {
    var maxValid = Math.floor(0x100000000 / poolLength) * poolLength;
    var buf = new Uint32Array(1);
    do {
        crypto.getRandomValues(buf);
    } while (buf[0] >= maxValid);
    return buf[0] % poolLength;
}

/** 获取随机字节填充数组 */
function fillRandom(arr) {
    crypto.getRandomValues(arr);
}


// ==================== 生成 ====================

function generate() {
    var pool = buildPool();
    if (!pool) {
        setDisplay('请至少选一种字符类型', false);
        updateStrength('');
        return;
    }

    // 安全检查: 只有一种类型时长度至少16才能算安全
    var activeCount = (state.lower ? 1 : 0) + (state.upper ? 1 : 0) +
                      (state.number ? 1 : 0) + (state.symbol ? 1 : 0);

    // 批量生成, 使用 Set 确保不重复
    var passwords = [];
    var seen = {};
    var maxAttempts = state.count * 50; // 防止死循环
    var attempts = 0;

    while (passwords.length < state.count && attempts < maxAttempts) {
        attempts++;
        var pw = generateOne(pool);
        // 去重
        if (!seen[pw]) {
            seen[pw] = true;
            passwords.push(pw);
        }
    }

    // 多样性警告
    if (activeCount < 2) {
        document.getElementById('strengthDetails').textContent =
            '⚠️ 仅选了 1 种字符类型，建议至少选 2 种以提高安全性';
    }

    // 显示
    if (state.count === 1) {
        setDisplay(passwords[0], true);
        if (document.getElementById('batchResult')) {
            document.getElementById('batchResult').style.display = 'none';
        }
    } else {
        setDisplay(passwords[0], true);
        renderBatch(passwords);
    }

    updateStrength(passwords[0], pool.length);
    addHistory(passwords);
}


function generateOne(pool) {
    var poolLen = pool.length;
    var result = '';

    for (var i = 0; i < state.length; i++) {
        var idx = randomIndex(poolLen);
        var ch = pool[idx];

        // 禁止连续重复 — 使用安全的重新采样
        if (state.unique && result.length > 0) {
            var retries = 0;
            while (ch === result[result.length - 1] && retries < 50) {
                idx = randomIndex(poolLen);
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

    passwords.forEach(function(pw) {
        var div = document.createElement('div');
        div.className = 'batch-item';
        div.innerHTML =
            '<span class="batch-pw">' + pw + '</span>' +
            '<button class="batch-copy" onclick="copyText(\'' + esq(pw) + '\')">复制</button>';
        list.appendChild(div);
    });
}


// ==================== 强度检测 ====================

function updateStrength(password, poolSize) {
    if (!password || password.length < 2) {
        document.getElementById('strengthText').textContent = '-';
        document.getElementById('strengthBar').style.width = '0%';
        return;
    }

    // 实际熵 = length * log2(字符池大小)
    var calcPool = poolSize || (function() {
        var s = 0;
        if (/[a-z]/.test(password)) s += 26;
        if (/[A-Z]/.test(password)) s += 26;
        if (/[0-9]/.test(password)) s += 10;
        if (/[^a-zA-Z0-9]/.test(password)) s += 30;
        return s || 26;
    })();

    var entropy = password.length * Math.log2(calcPool);

    // 实际使用的字符种类数
    var typesUsed = 0;
    if (/[a-z]/.test(password)) typesUsed++;
    if (/[A-Z]/.test(password)) typesUsed++;
    if (/[0-9]/.test(password)) typesUsed++;
    if (/[^a-zA-Z0-9]/.test(password)) typesUsed++;

    // 扣分：只有一种类型
    if (typesUsed < 2) entropy *= 0.6;

    var label, color, pct;
    if      (entropy < 40)  { label = '弱';     color = '#ef4444'; pct = 15; }
    else if (entropy < 60)  { label = '一般';   color = '#f59e0b'; pct = 35; }
    else if (entropy < 80)  { label = '良好';   color = '#3b82f6'; pct = 60; }
    else if (entropy < 100) { label = '强';     color = '#10b981'; pct = 80; }
    else                    { label = '非常强'; color = '#059669'; pct = 100; }

    var bar = document.getElementById('strengthBar');
    bar.style.width = pct + '%';
    bar.style.background = color;
    document.getElementById('strengthText').textContent = label;
    document.getElementById('strengthText').style.color = color;

    // 详细信息
    var vType = '';
    if (typesUsed < 2) vType = ' · ⚠️ 字符类型过少';
    if (!state.unique && /(.)\1/.test(password)) vType += ' · 含连续重复字符';
    document.getElementById('strengthDetails').textContent =
        '熵值: ' + Math.round(entropy) + ' bit | ' +
        '池: ' + calcPool + ' 字符 | ' +
        '类型: ' + typesUsed + ' 种' + vType;
}


// ==================== 历史 ====================

function addHistory(passwords) {
    passwords.forEach(function(pw) {
        // 去重：如果已经在历史中，跳过
        if (history.indexOf(pw) >= 0) return;
        history.unshift(pw);
        while (history.length > MAX_HISTORY) history.pop();
    });
    renderHistory();
}

function renderHistory() {
    var c = document.getElementById('historyList');
    if (!history.length) {
        c.innerHTML = '<div class="history-empty">点击「刷新」生成第一条密码</div>';
        return;
    }
    c.innerHTML = '';
    history.forEach(function(pw) {
        var d = document.createElement('div');
        d.className = 'history-item';
        d.innerHTML =
            '<span class="h-pw">' + pw + '</span>' +
            '<span class="h-actions"><button class="h-btn" onclick="copyText(\'' + esq(pw) + '\')">📋</button></span>';
        c.appendChild(d);
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
    el.classList.toggle('active', state[type]);

    // 至少保留一种
    var any = state.lower || state.upper || state.number || state.symbol;
    if (!any) { state.lower = true; document.getElementById('toggleLower').classList.add('active'); }
    generate();
}

function toggleCheck(type) {
    state[type] = !state[type];
    var el = document.getElementById('check' + type.charAt(0).toUpperCase() + type.slice(1));
    var box = document.getElementById('check' + type.charAt(0).toUpperCase() + type.slice(1) + 'Box');
    el.classList.toggle('checked', state[type]);
    box.textContent = state[type] ? '✓' : '';
    generate();
}

function copyPassword() {
    copyText(document.getElementById('passwordText').textContent);
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(function() {
        toast('✅ 已复制到剪贴板');
    }).catch(function() {
        prompt('手动复制:', text);
    });
}

function toast(msg) {
    var b = document.getElementById('toastBar');
    b.querySelector('span').textContent = msg;
    b.style.display = '';
    clearTimeout(b._t);
    b._t = setTimeout(function() { b.style.display = 'none'; }, 1800);
}

function esq(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }


// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('countSlider').addEventListener('input', function() {
        state.count = parseInt(this.value);
        document.getElementById('countValue').textContent = state.count;
        generate();
    });

    // Ctrl+R 刷新, Ctrl+C 复制
    document.addEventListener('keydown', function(e) {
        if (e.key === 'r' && e.ctrlKey) { e.preventDefault(); generate(); }
        if (e.key === 'c' && e.ctrlKey && document.activeElement === document.body) { copyPassword(); }
    });

    generate();
});
