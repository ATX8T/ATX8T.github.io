/* GitHub 直链转换 — 通用版 */

function parseGitHubUrl(str) {
    str = str.trim(); if (!str) return null;
    var u; try { u = new URL(str); } catch(e) { return null; }
    var h = u.hostname.toLowerCase();
    var parts = u.pathname.replace(/\/$/, '').split('/').filter(Boolean);

    if (h === 'github.com' && parts.length >= 4 && parts[2] === 'blob')
        return { owner: parts[0], repo: parts[1], branch: parts[3], filepath: parts.slice(4).join('/'), filename: parts[parts.length - 1] };
    if (h === 'raw.githubusercontent.com' && parts.length >= 3)
        return { owner: parts[0], repo: parts[1], branch: parts[2], filepath: parts.slice(3).join('/'), filename: parts[parts.length - 1] };
    if (h === 'cdn.jsdelivr.net' && parts.length >= 2 && parts[0] === 'gh') {
        var rb = parts[1].split('@'); if (rb.length < 3) return null;
        return { owner: rb[0], repo: rb[1], branch: rb[2], filepath: parts.slice(2).join('/'), filename: parts[parts.length - 1] };
    }
    if (h === 'cdn.staticaly.com' && parts.length >= 4 && parts[0] === 'gh')
        return { owner: parts[1], repo: parts[2], branch: parts[3], filepath: parts.slice(4).join('/'), filename: parts[parts.length - 1] };
    return null;
}

function enc(p) { return p.split('/').map(function(s){try{return encodeURIComponent(decodeURIComponent(s))}catch(e){return encodeURIComponent(s)}}).join('/'); }
function rawUrl(o,r,b,p) { return 'https://raw.githubusercontent.com/'+o+'/'+r+'/'+b+'/'+enc(p); }
function cdnUrl(o,r,b,p) { return 'https://cdn.jsdelivr.net/gh/'+o+'/'+r+'@'+b+'/'+enc(p); }
function statUrl(o,r,b,p) { return 'https://cdn.staticaly.com/gh/'+o+'/'+r+'/'+b+'/'+enc(p); }

function convertUrl() {
    var input = document.getElementById('inputUrl').value.trim();
    if (!input) { toast('请输入链接','error'); return; }
    var p = parseGitHubUrl(input);
    if (!p) { document.getElementById('resultArea').classList.add('d-none'); toast('无法识别','error'); return; }

    var r = rawUrl(p.owner,p.repo,p.branch,p.filepath);
    var c = cdnUrl(p.owner,p.repo,p.branch,p.filepath);
    var s = statUrl(p.owner,p.repo,p.branch,p.filepath);

    document.getElementById('repoInfo').textContent = p.owner+'/'+p.repo+' @'+p.branch;
    document.getElementById('urlResults').innerHTML =
        row('raw','Raw',r) + row('cdn','jsDelivr',c) + row('alt','Staticaly',s);

    document.getElementById('btnDownload').href = r; document.getElementById('btnDownload').download = p.filename; document.getElementById('btnDownload').style.display = '';
    document.getElementById('btnOpen').href = r; document.getElementById('btnOpen').style.display = '';
    document.getElementById('resultArea').classList.remove('d-none');

    var ext = p.filepath.split('.').pop().toLowerCase();
    var IMG = ['png','jpg','jpeg','gif','webp','svg','bmp','ico'];
    var VID = ['mp4','webm','mov'];

    document.getElementById('htmlImg').childNodes[0].nodeValue = '<img src="'+c+'" alt="'+p.filename+'" />';
    document.getElementById('mdImg').childNodes[0].nodeValue = '!['+p.filename+']('+c+')';
    document.getElementById('htmlLink').childNodes[0].nodeValue = '<a href="'+c+'" download>'+p.filename+'</a>';

    document.getElementById('previewImg').style.display='none'; document.getElementById('previewVideo').style.display='none';
    document.getElementById('previewMsg').style.display=''; document.getElementById('previewMsg').textContent='加载中...';
    document.getElementById('previewImg').removeAttribute('src');
    document.getElementById('previewVideo').innerHTML = '';

    if (IMG.indexOf(ext) >= 0) {
        document.getElementById('embedArea').style.display='';
        document.getElementById('previewMsg').style.display='none';
        document.getElementById('previewImg').style.display=''; document.getElementById('previewImg').src=r;
    } else if (VID.indexOf(ext) >= 0) {
        document.getElementById('embedArea').style.display='none';
        document.getElementById('previewMsg').style.display='none';
        var v = document.getElementById('previewVideo'); v.style.display=''; v.innerHTML='<source src="'+r+'">'; v.load();
    } else {
        document.getElementById('embedArea').style.display='none';
        document.getElementById('previewMsg').textContent = ext.toUpperCase()+' 文件 — 点击下方按钮下载';
    }
    document.getElementById('resultArea').scrollIntoView({behavior:'smooth',block:'start'});
}

function row(klass, label, url) {
    return '<div class="result-row"><span class="badge bg-'+klass+' tag">'+label+'</span><span class="url-text">'+url+'</span><button class="btn btn-sm btn-outline-secondary copy-btn" onclick="copyText(\''+url.replace(/'/g,"\\'")+'\')">📋</button></div>';
}

function previewFail() {
    document.getElementById('previewImg').style.display='none'; document.getElementById('previewVideo').style.display='none';
    document.getElementById('previewMsg').style.display=''; document.getElementById('previewMsg').textContent='预览失败 — 请点击下载按钮';
}

function manualBuild() {
    var o=Q('owner'),r=Q('repo'),b=Q('branch'),p=Q('filepath');
    if(!o||!r||!b||!p){toast('请填写所有字段','error');return;}
    document.getElementById('manualResult').innerHTML =
        '<div class="result-row"><span class="badge bg-primary-subtle text-primary tag">Raw</span><span class="url-text">'+rawUrl(o,r,b,p)+'</span></div>'+
        '<div class="result-row"><span class="badge bg-success-subtle text-success tag">jsDelivr</span><span class="url-text">'+cdnUrl(o,r,b,p)+'</span></div>';
    document.getElementById('manualResult').classList.remove('d-none');
}

function copyText(t) { navigator.clipboard.writeText(t).then(function(){toast('已复制')}).catch(function(){prompt('手动复制:',t)}); }
function copyBlock(id) { copyText(document.getElementById(id).textContent.replace(/^\s+|\s+$/g,'')); }
function Q(id){return document.getElementById(id).value.trim();}
function toast(m,t){var b=document.getElementById('toastBar'),s=b.querySelector('span');s.textContent=m;s.style.background=t==='error'?'#dc3545':'#198754';b.style.display='';clearTimeout(b._t);b._t=setTimeout(function(){b.style.display='none'},2000);}

document.addEventListener('DOMContentLoaded',function(){
    var inp=document.getElementById('inputUrl');
    inp.addEventListener('keydown',function(e){if(e.key==='Enter')convertUrl();});
    inp.addEventListener('paste',function(){setTimeout(function(){if(inp.value.trim()&&parseGitHubUrl(inp.value))convertUrl();},150);});
    ['owner','repo','branch','filepath'].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('keydown',function(e){if(e.key==='Enter')manualBuild();});});
});
