
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

if (empty($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Please log in first."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid request data."
    ]);
    exit;
}

$fullName = trim($data["full_name"] ?? "");
$university = trim($data["university"] ?? "");
$course = trim($data["course"] ?? "");
$yearLevel = trim($data["year_level"] ?? "");
$bio = trim($data["bio"] ?? "");

if ($fullName === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Full name is required."
    ]);
    exit;
}

if (
    strlen($fullName) > 100 ||
    strlen($university) > 150 ||
    strlen($course) > 100 ||
    strlen($yearLevel) > 30 ||
    strlen($bio) > 8000
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "One or more fields are too long."
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "UPDATE users
         SET full_name = ?,
             university = ?,
             course = ?,
             year_level = ?,
             bio = ?
         WHERE id = ?"
    );

    $stmt->execute([
        $fullName,
        $university,
        $course,
        $yearLevel,
        $bio,
        $_SESSION["user_id"]
    ]);

    $stmt = $pdo->prepare(
        "SELECT id, full_name, email, university, course,
                year_level, bio, profile_photo
         FROM users
         WHERE id = ?
         LIMIT 1"
    );

    $stmt->execute([$_SESSION["user_id"]]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully!",
        "user" => $user
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to update your profile."
    ]);
}
