<?php


require_once 'ConnectToTheDatabase.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['code' => 405, 'msg' => '只支持POST请求']);
    exit;
}

// 获取参数
$UserName = isset($_POST['UserName']) ? trim($_POST['UserName']) : '';
$Password = isset($_POST['Password']) ? trim($_POST['Password']) : '';

if ($UserName === '' || $Password === '') {
    echo json_encode(['code' => 400, 'msg' => '用户名和密码不能为空']);
    exit;
}

try {
    $pdo = connectDatabase();

    // 查询用户
    $stmt = $pdo->prepare("SELECT * FROM WebAPI WHERE UserName = ? LIMIT 1");
    $stmt->execute([$UserName]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['code' => 404, 'msg' => '用户不存在']);
        exit;
    }

    // 密码校验（明文，实际项目建议加密）
    if ($user['Password'] !== $Password) {
        echo json_encode(['code' => 401, 'msg' => '密码错误']);
        exit;
    }

    // 登录成功，返回部分用户信息
    unset($user['Password']);
    echo json_encode(['code' => 200, 'msg' => '登录成功', 'user' => $user]);
} catch (Exception $e) {
    echo json_encode(['code' => 500, 'msg' => '登录失败', 'error' => $e->getMessage()]);
}