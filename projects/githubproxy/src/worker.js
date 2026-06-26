/**
 * GitHub 加速代理 Worker
 * 域名: proxyclass.dpdns.org
 *
 * 用法:
 *   1. 完整 URL:  https://proxyclass.dpdns.org/https://github.com/user/repo
 *   2. 简写 gh:   https://proxyclass.dpdns.org/gh/user/repo
 *   3. 简写 raw:  https://proxyclass.dpdns.org/raw/user/repo/main/file.txt
 *   4. git clone: git clone https://proxyclass.dpdns.org/https://github.com/user/repo.git
 *
 * 支持所有 HTTP 方法（GET/POST/PUT/DELETE/HEAD），支持流式大文件、Range 断点续传、
 * 自动跟随 GitHub 302 重定向（如 release → objects.githubusercontent.com）。
 */

const GITHUB_DOMAINS = new Set([
  'github.com',
  'raw.githubusercontent.com',
  'objects.githubusercontent.com',
  'codeload.github.com',
  'api.github.com',
  'github.githubassets.com',
  'cloud.githubusercontent.com',
  'user-images.githubusercontent.com',
  'avatars.githubusercontent.com',
  'avatars0.githubusercontent.com',
  'avatars1.githubusercontent.com',
  'avatars2.githubusercontent.com',
  'avatars3.githubusercontent.com',
  'camo.githubusercontent.com',
  'release-assets.githubusercontent.com',
  'media.githubusercontent.com',
]);

const FORWARDED_HEADERS = new Set([
  'host',
  'cf-connecting-ip',
  'cf-ipcountry',
  'cf-ray',
  'cf-visitor',
  'cf-worker',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-real-ip',
  'true-client-ip',
  'cdn-loop',
]);

// 部署时间戳（坑 #7：每次部署务必更新，用户据此判断 CDN 是否已刷新）
const DEPLOY_TS = '2026-06-26 18:53';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 是否为 GitHub 代理路径
    if (!isProxyPath(pathname)) {
      // 非代理路径 → 静态资源（首页 / _headers 等）
      if (env.ASSETS) {
        const res = await env.ASSETS.fetch(request);
        // 给静态资源也打上部署时间戳头（坑 #7：curl 可验证 + 首页可读取）
        const h = new Headers(res.headers);
        h.set('X-Proxy-Deploy', DEPLOY_TS);
        h.set('X-GitHub-Proxy', 'proxyclass.dpdns.org');
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
      }
      return new Response('Not Found', { status: 404 });
    }

    return handleProxy(request, url, env);
  },
};

function isProxyPath(pathname) {
  const p = pathname.replace(/^\/+/, '');
  if (p.startsWith('http://') || p.startsWith('https://')) return true;
  if (p.startsWith('gh/') || p.startsWith('raw/') || p.startsWith('api/')) return true;
  // 兼容直接以 user/repo 开头的写法
  if (/^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+/.test(p) && !p.startsWith('index') && !p.startsWith('_')) {
    return true;
  }
  return false;
}

async function handleProxy(request, url, env) {
  const pathname = url.pathname.replace(/^\/+/, '');
  const search = url.search;

  // 解析目标 URL
  let targetUrlStr;
  if (pathname.startsWith('http://') || pathname.startsWith('https://')) {
    targetUrlStr = pathname + search;
  } else if (pathname.startsWith('gh/')) {
    targetUrlStr = 'https://github.com/' + pathname.slice(3) + search;
  } else if (pathname.startsWith('raw/')) {
    targetUrlStr = 'https://raw.githubusercontent.com/' + pathname.slice(4) + search;
  } else if (pathname.startsWith('api/')) {
    targetUrlStr = 'https://api.github.com/' + pathname.slice(4) + search;
  } else {
    // 默认代理 github.com
    targetUrlStr = 'https://github.com/' + pathname + search;
  }

  let target;
  try {
    target = new URL(targetUrlStr);
  } catch {
    return json({ error: 'Invalid target URL', input: targetUrlStr }, 400);
  }

  // 域名白名单
  const isAllowed =
    GITHUB_DOMAINS.has(target.hostname) ||
    target.hostname.endsWith('.githubusercontent.com');

  if (!isAllowed) {
    return json({
      error: 'Domain not allowed',
      domain: target.hostname,
      allowed: [...GITHUB_DOMAINS],
      hint: 'Only GitHub domains are proxied for security.',
    }, 403);
  }

  // 清理请求头：去掉 CF / 代理相关头，避免暴露客户端信息给 GitHub
  const reqHeaders = new Headers(request.headers);
  for (const h of FORWARDED_HEADERS) reqHeaders.delete(h);

  // GitHub 强制要求 User-Agent
  if (!reqHeaders.has('User-Agent')) {
    reqHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  }
  // 替换 Referer，避免 GitHub 拒绝跨站
  reqHeaders.set('Referer', target.origin + '/');
  // 保留 Range / Accept / Authorization 等业务头

  // 发起请求（手动处理重定向以改写 Location）
  let upstream;
  try {
    upstream = await fetch(target.toString(), {
      method: request.method,
      headers: reqHeaders,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
    });
  } catch (e) {
    return json({ error: 'Upstream fetch failed', message: String(e && e.message || e) }, 502);
  }

  // 处理 3xx 重定向：把 GitHub 域名改写为本代理 URL
  if ([301, 302, 303, 307, 308].includes(upstream.status)) {
    const location = upstream.headers.get('Location');
    if (location) {
      try {
        const newLoc = new URL(location, target);
        const newHeaders = new Headers(upstream.headers);
        const isGhHost =
          GITHUB_DOMAINS.has(newLoc.hostname) ||
          newLoc.hostname.endsWith('.githubusercontent.com');
        if (isGhHost) {
          // 改写为本代理 URL，让浏览器再次请求本代理
          newHeaders.set('Location', `${url.origin}/${newLoc.toString()}`);
        } else {
          newHeaders.set('Location', newLoc.toString());
        }
        return new Response(null, {
          status: upstream.status,
          statusText: upstream.statusText,
          headers: newHeaders,
        });
      } catch {
        // URL 解析失败则保持原样
      }
    }
  }

  // 复制响应头
  const resHeaders = new Headers(upstream.headers);
  // 移除可能阻止浏览器预览/下载的头
  resHeaders.delete('Content-Security-Policy');
  resHeaders.delete('X-Frame-Options');
  resHeaders.delete('Strict-Transport-Security');
  resHeaders.delete('X-Content-Type-Options');
  // 标记代理来源（便于排查）
  resHeaders.set('X-GitHub-Proxy', 'proxyclass.dpdns.org');
  resHeaders.set('X-Proxy-Deploy', DEPLOY_TS);
  resHeaders.set('X-Target-Host', target.hostname);

  // 流式返回，不缓冲到内存（支持大文件 clone/release）
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
