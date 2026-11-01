<?php

$appEnv = getenv("APP_ENV") ?: "development";
$isProduction = $appEnv === "production";

$host = getenv("DB_HOST") ?: ($isProduction ? "" : "localhost");
$dbname = getenv("DB_NAME") ?: ($isProduction ? "" : "skillswap_campus");
$username = getenv("DB_USER") ?: ($isProduction ? "" : "root");
$password = getenv("DB_PASSWORD");

if ($password === false) {
    $password = $isProduction ? "" : "";
}

if ($host === "" || $dbname === "" || $username === "" ||
    ($isProduction && (getenv("DB_HOST") === false ||
        getenv("DB_NAME") === false ||
        getenv("DB_USER") === false ||
        getenv("DB_PASSWORD") === false))) {
    http_response_code(500);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "success" => false,
        "message" => "The server database configuration is incomplete."
    ]);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 5
        ]
    );
} catch (PDOException $e) {
    error_log("SkillSwap database connection failed: " . $e->getMessage());
    http_response_code(500);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed. Please try again later."
    ]);
    exit;
}
