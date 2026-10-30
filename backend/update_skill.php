
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

$id = filter_var($data["id"] ?? null, FILTER_VALIDATE_INT);
$skillName = trim($data["skill_name"] ?? "");
$category = trim($data["category"] ?? "");
$skillType = $data["skill_type"] ?? "";
$description = trim($data["description"] ?? "");

if (!$id || $skillName === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "A valid skill ID and skill name are required."
    ]);
    exit;
}

if (!in_array($skillType, ["offer", "learn"], true)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please choose a valid skill type."
    ]);
    exit;
}

if (
    strlen($skillName) > 100 ||
    strlen($category) > 100 ||
    strlen($description) > 5000
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "One or more fields are too long."
    ]);
    exit;
}

try {
    // Confirm that this skill belongs to the logged-in student.
    $check = $pdo->prepare(
        "SELECT id FROM skills WHERE id = ? AND user_id = ? LIMIT 1"
    );

    $check->execute([$id, $_SESSION["user_id"]]);

    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "You are not allowed to edit this skill."
        ]);
        exit;
    }

    $stmt = $pdo->prepare(
        "UPDATE skills
         SET skill_name = ?,
             category = ?,
             skill_type = ?,
             description = ?
         WHERE id = ? AND user_id = ?"
    );

    $stmt->execute([
        $skillName,
        $category,
        $skillType,
        $description,
        $id,
        $_SESSION["user_id"]
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Your skill has been updated successfully!"
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to update your skill."
    ]);
}
