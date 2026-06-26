/* 密码生成器 */
(function() { 'use strict';

var state = {
    length: 16, lower: true, upper: true, number: true, symbol: true,
    exclude: true, unique: false, count: 1
};

var CHARS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    number: '0123456789',
    symbol: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};
var AMB = { l:1, I:1, '1':1, '0':1, O:1, o:1 };
var pwList = [], MAX = 10;

// ====== 随机 ======
function pool() {
    var s = '';
    if (state.lower) s += CHARS.lower;
    if (state.upper) s += CHARS.upper;
    if (state.number) s += CHARS.number;
    if (state.symbol) s += CHARS.symbol;
    if (state.exclude) s = s.split('').filter(function(c){ return !AMB[c]; }).join('');
    return s;
}
function rndIdx(n) {
    var max = Math.floor(0x100000000 / n) * n, b = new Uint32Array(1);
    do { crypto.getRandomValues(b); } while (b[0] >= max);
    return b[0] % n;
}

// ====== 生成 ======
function gen() {
    var p = pool();
    if (!p) { show('请至少选一种类型', false); upStr('', 0); return; }

    var seen = {}, out = [], tries = 0, maxTry = state.count * 50;
    while (out.length < state.count && tries < maxTry) {
        tries++;
        var pw = make(p);
        if (!seen[pw]) { seen[pw] = true; out.push(pw); }
    }
    show(out[0], true);
    if (out.length > 1) batch(out); else Q('batchCard').style.display = 'none';
    upStr(out[0], p.length);
    add(out);
    setTimeout(function(){ Q('bottomArea').scrollTop = 0; }, 60);
}

function make(p) {
    var r = '', n = p.length;
    for (var i = 0; i < state.length; i++) {
        var idx = rndIdx(n), ch = p[idx];
        if (state.unique && r.length) {
            var t = 0;
            while (ch === r[r.length-1] && t < 50) { idx = rndIdx(n); ch = p[idx]; t++; }
        }
        r += ch;
    }
    return r;
}

// ====== 显示 ======
function show(t, ok) {
    var el = Q('passwordText');
    el.textContent = t;
    el.className = 'pw-display' + (ok ? '' : ' placeholder');
}
function batch(arr) {
    var card = Q('batchCard'), list = Q('batchList');
    card.style.display = ''; list.innerHTML = '';
    arr.forEach(function(v) {
        var d = document.createElement('div'); d.className = 'batch-item';
        d.innerHTML = '<span class="batch-pw">'+v+'</span><button class="batch-copy" onclick="copyText(\''+esq(v)+'\',this)">复制</button>';
        list.appendChild(d);
    });
}

// ====== 强度 ======
function upStr(pw, sz) {
    if (!pw || pw.length < 2) {
        Q('strengthText').textContent='-'; Q('strengthText').style.color='var(--text-3)';
        Q('strengthBar').style.width='0%'; Q('strengthDetails').textContent=''; return;
    }
    var cs = sz || (function(){var s=0;if(/[a-z]/.test(pw))s+=26;if(/[A-Z]/.test(pw))s+=26;if(/[0-9]/.test(pw))s+=10;if(/[^a-zA-Z0-9]/.test(pw))s+=30;return s||26;})();
    var e = pw.length * Math.log2(cs);
    var tu = 0; if(/[a-z]/.test(pw))tu++;if(/[A-Z]/.test(pw))tu++;if(/[0-9]/.test(pw))tu++;if(/[^a-zA-Z0-9]/.test(pw))tu++;
    if (tu < 2) e *= 0.6;
    var lb, cl, pct;
    if(e<40){lb='弱';cl='var(--red)';pct=15;}else if(e<60){lb='一般';cl='var(--orange)';pct=35;}else if(e<80){lb='良好';cl='var(--yellow)';pct=60;}else if(e<100){lb='强';cl='var(--green)';pct=80;}else{lb='非常强';cl='var(--green)';pct=100;}
    Q('strengthBar').style.width=pct+'%'; Q('strengthBar').style.background=cl;
    Q('strengthText').textContent=lb; Q('strengthText').style.color=cl;
    Q('strengthDetails').textContent = Math.round(e) + ' bit · ' + cs + '字符 · ' + tu + '类' + (tu<2?' · 类型过少':'');
}

// ====== 历史 ======
function add(arr) {
    arr.forEach(function(v) { if (pwList.indexOf(v) < 0) { pwList.unshift(v); while(pwList.length > MAX) pwList.pop(); } });
    renderH();
}
function renderH() {
    var c = Q('historyList');
    if (!pwList.length) { c.innerHTML = '<div class="empty">点击 🔄 生成</div>'; return; }
    c.innerHTML = '';
    pwList.forEach(function(v) {
        var d = document.createElement('div'); d.className = 'history-item';
        d.innerHTML = '<span class="h-pw">'+v+'</span><button class="h-copy" onclick="copyText(\''+esq(v)+'\',this)">复制</button>';
        c.appendChild(d);
    });
}

// ====== 交互 ======
function onLengthChange(v) { state.length = +v; Q('lengthValue').textContent = v; gen(); }
function toggleSeg(btn) {
    var t = btn.dataset.type; state[t] = !state[t]; btn.classList.toggle('active', state[t]);
    if (!state.lower && !state.upper && !state.number && !state.symbol) { state.lower = true; Q('[data-type=lower]').classList.add('active'); }
    gen();
}
function toggleSwitch(t) { state[t] = !state[t]; Q('toggle'+t[0].toUpperCase()+t.slice(1)).classList.toggle('on', state[t]); gen(); }
function changeCount(d) { state.count = Math.max(1, Math.min(10, state.count + d)); Q('stepperVal').textContent = state.count; gen(); }
function copyPassword() { copyText(Q('passwordText').textContent, Q('btnCopy')); }

// 暴露全局
window.generate = gen;
window.copyPassword = copyPassword;
window.onLengthChange = onLengthChange;
window.toggleSeg = toggleSeg;
window.toggleSwitch = toggleSwitch;
window.changeCount = changeCount;
window.copyText = function(t, btn) {
    navigator.clipboard.writeText(t).then(function() {
        if (btn) { btn.classList.add('copied'); setTimeout(function(){btn.classList.remove('copied')},1200); }
        toast('已复制');
    }).catch(function() {
        if (btn) { btn.classList.add('failed'); setTimeout(function(){btn.classList.remove('failed')},1200); }
        toast('复制失败');
    });
};

function toast(m) {
    var b = Q('toastBar'); b.querySelector('span').textContent = m; b.style.display = '';
    clearTimeout(b._t); b._t = setTimeout(function(){b.style.display='none';},1600);
}
function Q(id) { return document.getElementById(id); }
function esq(s) { return s.replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

// ====== 启动 ======
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'r' && e.ctrlKey) { e.preventDefault(); gen(); }
        if (e.key === 'c' && e.ctrlKey && document.activeElement === document.body) copyPassword();
    });
    gen();
});

})();
