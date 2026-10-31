<?php

require_once "config.php";
require_once "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON data."
    ]);
    exit;
}

$fields = ["full_name", "email", "password", "university", "course", "year_level"];
foreach ($fields as $field) {
    if (isset($data[$field]) && !is_string($data[$field])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Please check the registration details and try again."
        ]);
        exit;
    }
}

$full_name = trim($data["full_name"] ?? "");
$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";
$university = trim($data["university"] ?? "");
$course = trim($data["course"] ?? "");
$year_level = trim($data["year_level"] ?? "");

if ($full_name === "" || $email === "" || $password === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Name, email, and password are required."
    ]);
    exit;
}

$length = function ($value) {
    return function_exists("mb_strlen") ? mb_strlen($value, "UTF-8") : strlen($value);
};

if ($length($full_name) > 100 || $length($email) > 150 ||
    $length($university) > 150 || $length($course) > 100 ||
    $length($year_level) > 30) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "One or more fields exceed the allowed length."
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email address."
    ]);
    exit;
}

if (strlen($password) < 8 || strlen($password) > 72) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Password must be between 8 and 72 characters."
    ]);
    exit;
}

$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $sql = "INSERT INTO users
        (full_name, email, password_hash, university, course, year_level)
        VALUES (?, ?, ?, ?, ?, ?)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $full_name,
        $email,
        $password_hash,
        $university ?: null,
        $course ?: null,
        $year_level ?: null
    ]);

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Student account created successfully!",
        "user_id" => $pdo->lastInsertId()
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === "23000") {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "This email address is already registered."
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to create account. Please try again."
        ]);
    }
}
