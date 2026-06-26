/* 资源浏览器 — 使用 jsDelivr Data API */

var OWNER = 'ATX8T', REPO = 'ATX8T.github.io', BRANCH = 'main';
var API = 'https://data.jsdelivr.com/v1/package/gh/' + OWNER + '/' + REPO;
var allFiles = [], currentFilter = 'all', currentDir = '';

var FILTERS = {
    image:   ['png','jpg','jpeg','gif','webp','svg','bmp','ico'],
    video:   ['mp4','webm','mov','avi','mkv'],
    archive: ['exe','msi','apk','dmg','deb','rpm','zip','rar','7z','tar','gz'],
    doc:     ['pdf','doc','docx','ppt','pptx','xls','xlsx','txt','md','csv','json','xml','html','css','js','py','java','c','cpp'],
};
function getType(n) { var e=n.split('.').pop().toLowerCase(); for(var t in FILTERS){if(FILTERS[t].indexOf(e)>=0)return t;} return 'other'; }
function getIcon(n) { return {image:'🖼️',video:'🎬',archive:'📦',doc:'📄',other:'📁'}[getType(n)]||'📁'; }

function loadFiles() {
    var l=el('loadingBox'),t=el('fileTable'),e=el('emptyBox');
    l.classList.remove('d-none'); t.classList.add('d-none'); e.classList.add('d-none');
    fetch(API).then(function(r){if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(function(d){
        allFiles = (d.files||[]).filter(function(f){return f.type==='file'}).map(function(f){
            var p=f.name; return {name:p.split('/').pop(),path:p,size:f.size||0};
        }).sort(function(a,b){return a.path.localeCompare(b.path);});
        el('fileCount').textContent = allFiles.length; l.classList.add('d-none'); applyFilter();
    }).catch(function(err){l.classList.add('d-none');e.classList.remove('d-none');e.innerHTML='<p class="text-danger">加载失败: '+err.message+'</p><button class="btn btn-sm btn-outline-primary" onclick="loadFiles()">重试</button>';});
}

function navigateTo(dir) { currentDir = dir; applyFilter(); renderBreadcrumb(); }

function renderBreadcrumb() {
    var parts = currentDir.split('/').filter(Boolean), h = '<nav><ol class="breadcrumb small"><li class="breadcrumb-item"><a href="#" onclick="navigateTo(\'\')">📁 根目录</a></li>';
    parts.forEach(function(p,i){
        var sp = parts.slice(0,i+1).join('/');
        h += '<li class="breadcrumb-item'+(i===parts.length-1?' active':'')+'">'+(i<parts.length-1?'<a href="#" onclick="navigateTo(\''+sp+'\')">'+p+'</a>':p)+'</li>';
    });
    h += '</ol></nav>';
    var subs = getSubDirs(currentDir);
    if (subs.length) { h += '<div class="d-flex flex-wrap gap-1">'; subs.forEach(function(d){h+='<a href="#" class="badge bg-light text-dark text-decoration-none border" onclick="navigateTo(\''+d+'\')">📁 '+d.split('/').pop()+'</a>';}); h+='</div>'; }
    el('breadcrumb').innerHTML = h;
}
function getSubDirs(pp) { var dirs={}, prefix=pp?'/'+pp+'/':'/'; allFiles.forEach(function(f){if(f.path.indexOf(prefix)!==0)return;var rel=f.path.substring(prefix.length),i=rel.indexOf('/');if(i>0)dirs[(pp?pp+'/':'')+rel.substring(0,i)]=true;}); return Object.keys(dirs).sort(); }

function setFilter(f,b) { currentFilter=f; document.querySelectorAll('#filterBar .btn').forEach(function(x){x.classList.remove('active');}); if(b)b.classList.add('active'); applyFilter(); }

function applyFilter() {
    var files = allFiles;
    if(currentDir) files=files.filter(function(f){return f.path.indexOf('/'+currentDir+'/')===0;});
    if(currentFilter!=='all') files=files.filter(function(f){return getType(f.name)===currentFilter;});
    (!files.length)? (el('fileTable').classList.add('d-none'),el('emptyBox').classList.remove('d-none'),el('fileCount').textContent='0') : renderTable(files);
}

function renderTable(files) {
    el('fileTable').classList.remove('d-none'); el('emptyBox').classList.add('d-none');
    var b=el('fileBody'); b.innerHTML='';
    files.forEach(function(f,i){
        var raw=buildRaw(f.path),cdn=buildCdn(f.path);
        var tr=document.createElement('tr');
        tr.innerHTML='<td class="text-muted small">'+(i+1)+'</td><td><span class="file-icon">'+getIcon(f.name)+'</span><span class="file-name">'+esc(f.name)+'</span><br><span class="file-path">'+esc(f.path)+'</span></td><td class="text-muted small">'+fsize(f.size)+'</td><td><button class="btn btn-sm btn-outline-primary me-1" onclick="preview(\''+escAttr(f.name)+'\',\''+escAttr(raw)+'\')">👁️</button><button class="btn btn-sm btn-outline-success me-1" onclick="dl(\''+escAttr(cdn)+'\',\''+escAttr(f.name)+'\')">⬇️</button><button class="btn btn-sm btn-outline-secondary" onclick="cp(\''+escAttr(cdn)+'\')">🔗</button></td>';
        b.appendChild(tr);
    });
    el('fileCount').textContent = files.length;
}

function buildRaw(p){ return 'https://raw.githubusercontent.com/'+OWNER+'/'+REPO+'/'+BRANCH+p.split('/').map(function(s){return encodeURIComponent(s)}).join('/'); }
function buildCdn(p){ return 'https://cdn.jsdelivr.net/gh/'+OWNER+'/'+REPO+'@'+BRANCH+p.split('/').map(function(s){return encodeURIComponent(s)}).join('/'); }

function preview(name,raw) {
    el('previewTitle').textContent=name; el('currentRaw').value=raw; el('previewDl').href=raw; el('previewDl').download=name;
    var ext=name.split('.').pop().toLowerCase(),b=el('previewBody');
    if(['png','jpg','jpeg','gif','webp','svg','bmp','ico'].indexOf(ext)>=0) b.innerHTML='<img src="'+raw+'" class="preview-img" onerror="el(\'previewBody\').innerHTML=\'<p class=\\\'text-danger p-4\\\'>预览失败</p>\'">';
    else if(['mp4','webm','mov'].indexOf(ext)>=0) b.innerHTML='<video controls class="preview-video"><source src="'+raw+'"></video>';
    else b.innerHTML='<div class="p-5"><span style="font-size:3rem">'+getIcon(name)+'</span><p class="text-muted mt-2">不支持预览</p></div>';
    new bootstrap.Modal(el('previewModal')).show();
}
function copyRaw(){ navigator.clipboard.writeText(el('currentRaw').value).then(function(){toast('已复制')}); }
function dl(url,n){var a=document.createElement('a');a.href=url;a.download=n;a.click();}
function cp(t){ navigator.clipboard.writeText(t).then(function(){toast('已复制')}).catch(function(){prompt('',t)}); }

function fsize(b){if(!b)return'0 B';var u=['B','KB','MB','GB'],i=0,s=b;while(s>=1024&&i<u.length-1){s/=1024;i++;}return s.toFixed(i>0?1:0)+' '+u[i];}
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function escAttr(s){return s.replace(/\\/g,'\\\\').replace(/'/g,"\\'");}
function el(id){return document.getElementById(id);}
function toast(m){var t=el('toastBar');t.querySelector('span').textContent=m;t.style.display='';clearTimeout(t._t);t._t=setTimeout(function(){t.style.display='none';},1500);}

document.addEventListener('DOMContentLoaded',loadFiles);
document.querySelectorAll('#filterBar .btn').forEach(function(b){b.addEventListener('click',function(){setFilter(b.dataset.filter,b);});});
document.addEventListener('hidden.bs.modal',function(){var v=document.querySelector('#previewBody video');if(v)v.pause();});
