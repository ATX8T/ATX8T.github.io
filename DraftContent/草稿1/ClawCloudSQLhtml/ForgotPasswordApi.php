
<?php

require_once 'ConnectToTheDatabase.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['code' => 405, 'msg' => '只支持POST请求']);
    exit;
}

// 获取参数
$UserName = isset($_POST['UserName']) ? trim($_POST['UserName']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$newPassword = isset($_POST['newPassword']) ? trim($_POST['newPassword']) : '';

if ($UserName === '' || $email === '' || $newPassword === '') {
    echo json_encode(['code' => 400, 'msg' => '用户名、邮箱和新密码不能为空']);
    exit;
}

try {
    $pdo = connectDatabase();

    // 检查用户和邮箱是否匹配
    $stmt = $pdo->prepare("SELECT * FROM WebAPI WHERE UserName = ? AND email = ? LIMIT 1");
    $stmt->execute([$UserName, $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['code' => 404, 'msg' => '用户名与邮箱不匹配']);
        exit;
    }

    // 检查新密码是否与原密码相同
    if ($user['Password'] === $newPassword) {
        echo json_encode(['code' => 409, 'msg' => '新密码不能和原来的密码一样']);
        exit;
    }

    // 更新密码
    $stmt = $pdo->prepare("UPDATE WebAPI SET Password = ? WHERE UserName = ? AND email = ?");
    $stmt->execute([$newPassword, $UserName, $email]);

    echo json_encode(['code' => 200, 'msg' => '密码重置成功']);
} catch (Exception $e) {
    echo json_encode(['code' => 500, 'msg' => '密码重置失败', 'error' => $e->getMessage()]);
}
?>