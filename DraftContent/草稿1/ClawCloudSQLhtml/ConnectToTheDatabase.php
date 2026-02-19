<?php


/*
    * 连接到数据库并获取数据表结构信息
    * 将数据库连接封装成了 connectDatabase() 方法，这样其他脚本只需 include 或 require 这个文件，
    * 然后直接调用 connectDatabase() 即可获取 PDO 实例。
    *
    * // 在其他 PHP 文件中
        require_once 'ConnectToTheDatabase.php';
        $pdo = connectDatabase();
        // 现在可以用 $pdo 进行数据库操作


    * @return PDO
    */

function connectDatabase() {
    $host = 'dbprovider.ap-southeast-1.clawcloudrun.com:45879'; // 数据库主机
    $dbname = 'indexwebsql'; // 数据库名
    $username = 'root'; // 数据库用户名
    $password = '6wn574r2'; // 数据库密码

    try {
        // 创建PDO实例并设置错误模式为异常
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        // 捕获连接错误并记录日志
        save_log("数据库连接失败: " . $e->getMessage(), 'ConnectDatabase');
        die("数据库连接失败: " . $e->getMessage());
    }
}

// 调试输出内容
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    try {
        $pdo = connectDatabase();
        echo "数据库连接成功";
    } catch (Exception $e) {
        echo $e->getMessage();
    }
}

?>