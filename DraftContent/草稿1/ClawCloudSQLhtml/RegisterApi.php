<?php


require_once 'ConnectToTheDatabase.php';

function write_log($msg) {
    $logDir = __DIR__ . '/Log';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0777, true);
    }
    $logFile = $logDir . '/register_api.log';
    $time = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$time] $msg\n", FILE_APPEND);
}

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    write_log("错误: 非POST请求");
    echo json_encode(['code' => 405, 'msg' => '只支持POST请求']);
    exit;
}

// 获取参数
$UserName = isset($_POST['UserName']) ? trim($_POST['UserName']) : '';
$Password = isset($_POST['Password']) ? trim($_POST['Password']) : '';
$Phone = isset($_POST['Phone']) ? trim($_POST['Phone']) : '';
$age = isset($_POST['age']) ? trim($_POST['age']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$Device = isset($_POST['Device']) ? trim($_POST['Device']) : '';
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$DateTime = date('Y-m-d H:i:s');

write_log("请求参数: " . json_encode($_POST) . " | IP: $ip | UA: " . ($_SERVER['HTTP_USER_AGENT'] ?? ''));

// 简单校验
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
?>