/* 密码生成器 — Apple Design Edition */

var state = {
    length: 16, lower: true, upper: true, number: true, symbol: true,
    exclude: true, unique: false, count: 1
};
var history = [], MAX_HISTORY = 10;

var CHARS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    number: '0123456789',
    symbol: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};
var AMBIGUOUS = { l:1, I:1, '1':1, '0':1, O:1, o:1 };

// ====== 随机 ======

function buildPool() {
    var p = '';
    if (state.lower) p += CHARS.lower;
    if (state.upper) p += CHARS.upper;
    if (state.number) p += CHARS.number;
    if (state.symbol) p += CHARS.symbol;
    if (state.exclude) p = p.split('').filter(function(c){return!AMBIGUOUS[c]}).join('');
    return p;
}

function randomIdx(poolLen) {
    var max = Math.floor(0x100000000 / poolLen) * poolLen, b = new Uint32Array(1);
    do { crypto.getRandomValues(b); } while (b[0] >= max);
    return b[0] % poolLen;
}

// ====== 生成 ======

function generate() {
    var pool = buildPool();
    if (!pool) { setDisplay('请至少选一种类型', false); updateStrength('', 0); return; }

    var seen = {}, pws = [], maxTries = state.count * 50, tries = 0;
    while (pws.length < state.count && tries < maxTries) {
        tries++;
        var pw = makeOne(pool);
        if (!seen[pw]) { seen[pw] = true; pws.push(pw); }
    }

    setDisplay(pws[0], true);
    if (pws.length > 1) renderBatch(pws);
    else { var bc = document.getElementById('batchCard'); if (bc) bc.style.display = 'none'; }

    updateStrength(pws[0], pool.length);
    addHistory(pws);
}

function makeOne(pool) {
    var r = '', pl = pool.length;
    for (var i = 0; i < state.length; i++) {
        var idx = randomIdx(pl), ch = pool[idx];
        if (state.unique && r.length) {
            var rt = 0;
            while (ch === r[r.length-1] && rt < 50) { idx = randomIdx(pl); ch = pool[idx]; rt++; }
        }
        r += ch;
    }
    return r;
}

// ====== 显示 ======

function setDisplay(t, gen) {
    var el = document.getElementById('passwordText');
    el.textContent = t;
    el.className = 'password-text' + (gen ? '' : ' placeholder');
}

function renderBatch(pws) {
    var area = document.getElementById('batchCard'), list = document.getElementById('batchList');
    area.style.display = ''; list.innerHTML = '';
    pws.forEach(function(p) {
        var d = document.createElement('div'); d.className = 'batch-item';
        d.innerHTML = '<span class="batch-pw">'+p+'</span><button class="batch-copy" onclick="copyText(\''+esq(p)+'\')">复制</button>';
        list.appendChild(d);
    });
}

// ====== 强度 ======

function updateStrength(pw, poolSize) {
    if (!pw || pw.length < 2) {
        el('strengthText').textContent = '-'; el('strengthText').style.color = 'var(--text-3)';
        el('strengthBar').style.width = '0%'; el('strengthDetails').innerHTML = ''; return;
    }
    var cs = poolSize || (function(){var s=0;if(/[a-z]/.test(pw))s+=26;if(/[A-Z]/.test(pw))s+=26;if(/[0-9]/.test(pw))s+=10;if(/[^a-zA-Z0-9]/.test(pw))s+=30;return s||26;})();
    var e = pw.length * Math.log2(cs);
    var tu = 0; if(/[a-z]/.test(pw))tu++;if(/[A-Z]/.test(pw))tu++;if(/[0-9]/.test(pw))tu++;if(/[^a-zA-Z0-9]/.test(pw))tu++;
    if (tu < 2) e *= 0.6;

    var label, color, pct;
    if (e < 40) { label='弱'; color='var(--red)'; pct=15; }
    else if (e < 60) { label='一般'; color='var(--orange)'; pct=35; }
    else if (e < 80) { label='良好'; color='var(--yellow)'; pct=60; }
    else if (e < 100) { label='强'; color='var(--green)'; pct=80; }
    else { label='非常强'; color='var(--green)'; pct=100; }

    el('strengthBar').style.width = pct + '%';
    el('strengthBar').style.background = color;
    el('strengthText').textContent = label;
    el('strengthText').style.color = color;

    var info = '' + Math.round(e) + ' bit 熵';
    if (tu < 2) info += ' · 类型过少';
    if (!state.unique && /(.)\1/.test(pw)) info += ' · 有连续重复';
    info += ' · ' + cs + ' 字符 · ' + tu + ' 类';
    el('strengthDetails').textContent = info;
}

// ====== 历史 ======

function addHistory(pws) {
    pws.forEach(function(p) { if (history.indexOf(p) < 0) { history.unshift(p); while (history.length > MAX_HISTORY) history.pop(); } });
    renderHistory();
}
function renderHistory() {
    var c = el('historyList');
    if (!history.length) { c.innerHTML = '<div class="history-empty">点击 🔄 生成第一条密码</div>'; return; }
    c.innerHTML = '';
    history.forEach(function(p) {
        var d = document.createElement('div'); d.className = 'history-item';
        d.innerHTML = '<span class="h-pw">'+p+'</span><button class="h-copy" onclick="copyText(\''+esq(p)+'\')">复制</button>';
        c.appendChild(d);
    });
}

// ====== 交互 ======

function onLengthChange(v) {
    state.length = parseInt(v);
    el('lengthValue').textContent = v;
    generate();
}

function toggleSeg(btn) {
    var type = btn.dataset.type;
    state[type] = !state[type];
    btn.classList.toggle('active', state[type]);
    var any = state.lower || state.upper || state.number || state.symbol;
    if (!any) { state.lower = true; document.querySelector('[data-type=lower]').classList.add('active'); }
    generate();
}

function toggleSwitch(type) {
    state[type] = !state[type];
    var sw = document.getElementById('toggle' + type.charAt(0).toUpperCase() + type.slice(1));
    sw.classList.toggle('on', state[type]);
    generate();
}

function changeCount(d) {
    state.count = Math.max(1, Math.min(10, state.count + d));
    el('stepperVal').textContent = state.count;
    generate();
}

function copyPassword() { copyText(el('passwordText').textContent); }

function copyText(t) {
    navigator.clipboard.writeText(t).then(function(){toast('已复制')}).catch(function(){prompt('',t)});
}

function toast(m) {
    var b = el('toastBar'); b.querySelector('span').textContent = m; b.style.display = '';
    clearTimeout(b._t); b._t = setTimeout(function(){b.style.display='none';}, 1600);
}

function el(id) { return document.getElementById(id); }
function esq(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

// ====== 初始化 ======

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'r' && e.ctrlKey) { e.preventDefault(); generate(); }
        if (e.key === 'c' && e.ctrlKey && document.activeElement === document.body) copyPassword();
    });
    generate();
});
