<?php
// filepath: /www/wwwroot/IndexWeb/TestTheWebpage/WebAPI/RegisterApi02.php
// 在线api测试
// https://www.sojson.com/http/test.html


//Log 目录没有写入权限，PHP 无法创建或写入 RegisterApi02.log 文件。  运行之前要在宝塔面板中设置好权限



require_once dirname(__DIR__) . '/ConnectToTheDatabase.php';

function write_log($msg) {
    $logDir = dirname(__DIR__) . '/Log';
    if (!is_dir($logDir)) {
        if (!mkdir($logDir, 0777, true)) {
            // 目录创建失败，直接返回
            error_log("日志目录创建失败: $logDir");
            return;
        }
    }
    $logFile = $logDir . '/RegisterApi02.log';
    $time = date('Y-m-d H:i:s');
    // 如果文件不存在会自动创建
    file_put_contents($logFile, "[$time] $msg\n", FILE_APPEND);
}







header('Content-Type: application/json; charset=utf-8');

// 只允许POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    write_log("错误: 非POST请求");
    echo json_encode(['code' => 405, 'msg' => '只支持POST请求']);
    exit;
}

// 读取原始json数据
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    write_log("错误: 非法JSON数据: $raw");
    echo json_encode(['code' => 400, 'msg' => '请求体必须为JSON格式']);
    exit;
}

// 获取参数
$UserName = isset($data['UserName']) ? trim($data['UserName']) : '';
$Password = isset($data['Password']) ? trim($data['Password']) : '';
$Phone = isset($data['Phone']) ? trim($data['Phone']) : '';
$age = isset($data['age']) ? trim($data['age']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$Device = isset($data['Device']) ? trim($data['Device']) : '';
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$DateTime = date('Y-m-d H:i:s');

write_log("请求参数: " . json_encode($data) . " | IP: $ip | UA: " . ($_SERVER['HTTP_USER_AGENT'] ?? ''));

// 校验
if ($UserName === '' || $Password === '') {
    write_log("错误: 用户名和密码不能为空");
    echo json_encode(['code' => 400, 'msg' => '用户名和密码不能为空']);
    exit;
}

try {
    $pdo = connectDatabase();

    // 限制：同一设备类型、IP，1分钟内最多注册5次
    $limitStmt = $pdo->prepare(
        "SELECT COUNT(*) FROM WebAPI WHERE Device = ? AND ip = ? AND DateTime >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)"
    );
    $limitStmt->execute([$Device, $ip]);
    $registerCount = $limitStmt->fetchColumn();
    if ($registerCount >= 5) {
        write_log("限制: 1分钟内同设备($Device)和IP($ip)注册次数超限");
        echo json_encode(['code' => 429, 'msg' => '同一设备和IP 1分钟内最多注册5次，请稍后再试']);
        exit;
    }

    // 检查用户名是否已存在
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM WebAPI WHERE UserName = ?");
    $stmt->execute([$UserName]);
    if ($stmt->fetchColumn() > 0) {
        write_log("错误: 用户名已存在 - $UserName");
        echo json_encode(['code' => 409, 'msg' => '用户名已存在']);
        exit;
    }

    // 插入新用户
    $stmt = $pdo->prepare("INSERT INTO WebAPI (UserName, Password, Phone, age, email, DateTime, Device, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$UserName, $Password, $Phone, $age, $email, $DateTime, $Device, $ip]);

    write_log("注册成功: $UserName | $ip | $Device");
    echo json_encode(['code' => 200, 'msg' => '注册成功']);
} catch (Exception $e) {
    write_log("异常: " . $e->getMessage());
    echo json_encode(['code' => 500, 'msg' => '注册失败', 'error' => $e->getMessage()]);
}

/*
POST /WebAPI/RegisterApi02.php
Content-Type: application/json

{
    "UserName": "testuser",
    "Password": "123456",
    "Phone": "13800138000",
    "age": 25,
    "email": "test@example.com",
    "Device": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}
*/
?>