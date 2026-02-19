<?php


// 递归获取所有脚本文件
function getAllScripts($dir, $base = '') {
    $result = [];
    $allowedExt = ['php', 'sh', 'html', 'md'];
    foreach (scandir($dir) as $item) {
        if ($item === '.' || $item === '..') continue;
        $fullPath = $dir . '/' . $item;
        $relPath = ltrim($base . '/' . $item, '/');
        if (is_dir($fullPath)) {
            $result = array_merge($result, getAllScripts($fullPath, $relPath));
        } else {
            $ext = strtolower(pathinfo($item, PATHINFO_EXTENSION));
            if (in_array($ext, $allowedExt)) {
                $result[] = $relPath;
            }
        }
    }
    return $result;
}

$scripts = getAllScripts(__DIR__);

// 生成导航（两列）
echo '<nav><table border="1" cellpadding="6" style="border-collapse:collapse;"><tr><th>新窗口打开</th><th>结果显示在下方</th></tr>';
foreach ($scripts as $file) {
    $name = htmlspecialchars($file);
    echo "<tr>";
    // 第一列：新窗口打开
    echo "<td><a href=\"$name\" target=\"_blank\">$name</a></td>";
    // 第二列：结果显示在下方
    echo "<td><a href=\"#\" onclick=\"showInBox('$name');return false;\">$name</a></td>";
    echo "</tr>";
}
echo '</table></nav>';

// 结果显示框
echo '<div id="resultBox" style="margin-top:20px;padding:10px;border:1px solid #ccc;min-height:200px;background:#f9f9f9;">点击右侧链接，内容将在此显示</div>';

// 简单的AJAX脚本
// 生成导航
// https://110.40.213.69/TestTheWebpage/WebAPI/index.php
?>
<script>
function showInBox(filename) {
    var box = document.getElementById('resultBox');
    box.innerHTML = '加载中...';
    fetch(filename)
        .then(response => {
            if (!response.ok) throw new Error('加载失败');
            // 判断是否为文本文件
            return response.text();
        })
        .then(text => {
            // 简单处理：如果是html/md，直接显示；php/sh 以<pre>包裹
            let ext = filename.split('.').pop().toLowerCase();
            if (ext === 'html' || ext === 'md') {
                box.innerHTML = text;
            } else {
                box.innerHTML = '<pre>' + text.replace(/[<>&]/g, c => ({
                    '<':'&lt;','>':'&gt;','&':'&amp;'
                }[c])) + '</pre>';
            }
        })
        .catch(err => {
            box.innerHTML = '加载失败：' + err;
        });
}
</script>