<?php


require_once 'ConnectToTheDatabase.php';

// 显示所有数据表
if (isset($_GET['listTables'])) {
    try {
        $pdo = connectDatabase();
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        header('Content-Type: application/json');
        echo json_encode($tables);
    } catch (Exception $e) {
        header('Content-Type: application/json');
        echo json_encode([]);
    }
    exit;
}

// 删除数据表
if (isset($_POST['deleteTable'])) {
    $table = preg_replace('/[^a-zA-Z0-9_]/', '', $_POST['deleteTable']);
    try {
        $pdo = connectDatabase();
        $pdo->exec("DROP TABLE IF EXISTS `$table`");
        echo "数据表 `$table` 已删除。";
    } catch (Exception $e) {
        echo "删除数据表失败：" . htmlspecialchars($e->getMessage());
    }
    exit;
}

// ...后面是创建表的逻辑...
// 获取POST参数
$tableName = isset($_POST['tableName']) && $_POST['tableName'] ? trim($_POST['tableName']) : 'WebAPI';
$fieldsJson = isset($_POST['fields']) ? $_POST['fields'] : '';

if ($fieldsJson) {
    $fieldsArr = json_decode($fieldsJson, true);
} else {
    // 默认字段
    $fieldsArr = [
        ['name' => 'id', 'type' => 'INT(11)', 'extra' => 'NOT NULL AUTO_INCREMENT PRIMARY KEY'],
        ['name' => 'UserName', 'type' => 'VARCHAR(100)', 'extra' => 'NOT NULL'],
        ['name' => 'Password', 'type' => 'VARCHAR(255)', 'extra' => 'NOT NULL'],
        ['name' => 'Phone', 'type' => 'VARCHAR(30)', 'extra' => 'DEFAULT NULL'],
        ['name' => 'age', 'type' => 'INT(3)', 'extra' => 'DEFAULT NULL'],
        ['name' => 'email', 'type' => 'VARCHAR(100)', 'extra' => 'DEFAULT NULL'],
        ['name' => 'DateTime', 'type' => 'DATETIME', 'extra' => 'DEFAULT CURRENT_TIMESTAMP'],
        ['name' => 'Device', 'type' => 'VARCHAR(300)', 'extra' => 'DEFAULT NULL'],
        ['name' => 'ip', 'type' => 'VARCHAR(100)', 'extra' => 'DEFAULT NULL'],
    ];
}

try {
    $pdo = connectDatabase();
    // 检查表是否已存在
    $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
    $stmt->execute([$tableName]);
    if ($stmt->fetch()) {
        echo "数据表 `$tableName` 已存在，无需重复创建。";
        exit;
    }

    // 构建字段SQL
    $fieldSqlArr = [];
    foreach ($fieldsArr as $field) {
        $name = preg_replace('/[^a-zA-Z0-9_]/', '', $field['name']);
        $type = $field['type'];
        $extra = isset($field['extra']) ? $field['extra'] : '';
        $fieldSqlArr[] = "`$name` $type $extra";
    }
    $sql = "CREATE TABLE `$tableName` (\n" . implode(",\n", $fieldSqlArr) . "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

    $pdo->exec($sql);
    echo "数据表 `$tableName` 创建成功。<br><pre>$sql</pre>";
} catch (Exception $e) {
    echo "创建数据表失败：" . htmlspecialchars($e->getMessage());
}

?>