
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

if (!isset($data["email"], $data["password"]) ||
    !is_string($data["email"]) || !is_string($data["password"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please enter a valid email and password."]);
    exit;
}

$email = trim($data["email"]);
$password = $data["password"];

if (strlen($email) > 150 || strlen($password) > 72) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email or password is too long."]);
    exit;
}

if ($email === "" || $password === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Email and password are required."
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "SELECT id, full_name, email, password_hash,
                university, course, year_level, bio, profile_photo
         FROM users
         WHERE email = ?
         LIMIT 1"
    );

    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user["password_hash"])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Invalid email or password."
        ]);
        exit;
    }

    // Upgrade older password hashes transparently after a successful login.
    if (password_needs_rehash($user["password_hash"], PASSWORD_DEFAULT)) {
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $rehash = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $rehash->execute([$newHash, $user["id"]]);
    }

    session_regenerate_id(true);

    $_SESSION["user_id"] = $user["id"];

    unset($user["password_hash"]);

    echo json_encode([
        "success" => true,
        "message" => "Login successful!",
        "user" => $user
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to log in. Please try again."
    ]);
}
