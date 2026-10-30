
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

$skillName = trim($data["skill_name"] ?? "");
$description = trim($data["description"] ?? "");
$skillType = trim($data["skill_type"] ?? "");
$category = trim($data["category"] ?? "");

if ($skillName === "" || !in_array($skillType, ["offer", "learn"], true)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Skill name and a valid skill type are required."
    ]);
    exit;
}

if (strlen($skillName) > 100 || strlen($category) > 100 || strlen($description) > 5000) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "One or more fields are too long."
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "INSERT INTO skills
         (user_id, skill_name, description, skill_type, category)
         VALUES (?, ?, ?, ?, ?)"
    );

    $stmt->execute([
        $_SESSION["user_id"],
        $skillName,
        $description,
        $skillType,
        $category
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Your skill has been added successfully!",
        "skill_id" => $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to save your skill. Please try again."
    ]);
}
