<?php
// 用途映射
$usageMap = [
    'RegisterApi.html' => '注册页面',
    'LoginApi.html' => '登录页面',
    'ForgotPasswordApi.html' => '忘记密码页面',
    'CreateDatabaseTable.html' => '数据表管理页面',
    'RegisterApi.php' => '注册API接口',
    'LoginApi.php' => '登录API接口',
    'ForgotPasswordApi.php' => '忘记密码API接口',
    'CreateDatabaseTable.php' => '数据表管理API'
];
$files = [];
foreach (scandir(__DIR__) as $file) {
    if (
        preg_match('/\.(html|php)$/i', $file) &&
        strtolower($file) !== 'index.php'
    ) {
        $files[] = $file;
    }
}
sort($files);
?>

<!DOCTYPE html>
<html lang="zh-cn">
<head>
    <meta charset="UTF-8">
    <title>前端页面导航</title>
    <link href="../../../bootstrap537/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            min-height: 100vh;
            background: linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%);
        }
        .card { border-radius: 1rem; }
        .card-header { border-radius: 1rem 1rem 0 0; }
    </style>
</head>
<body>
<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-md-8 col-lg-7">
            <div class="card shadow">
                <div class="card-header bg-primary text-white text-center">
                    <h4 class="mb-0">前端页面导航</h4>
                </div>
                <div class="card-body">
                    <ul id="navList" class="list-group">
                        <?php
                        if (empty($files)) {
                            echo '<li class="list-group-item text-danger">未找到任何页面</li>';
                        } else {
                            foreach ($files as $file) {
                                $usage = isset($usageMap[$file]) ? $usageMap[$file] : '';
                                $label = $usage ? '<span class="badge bg-secondary ms-2">'.$usage.'</span>' : '';
                                echo '<li class="list-group-item d-flex justify-content-between align-items-center">';
                                echo '<a href="'.$file.'" class="text-decoration-none" target="_blank">'.$file.'</a>'.$label;
                                echo '</li>';
                            }
                        }
                        ?>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>