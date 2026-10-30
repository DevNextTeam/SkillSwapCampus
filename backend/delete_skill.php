
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

if (!$id) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "A valid skill ID is required."
    ]);
    exit;
}

try {
    // Only delete a skill owned by the logged-in student.
    $stmt = $pdo->prepare(
        "DELETE FROM skills WHERE id = ? AND user_id = ?"
    );

    $stmt->execute([
        $id,
        $_SESSION["user_id"]
    ]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Skill not found or you are not allowed to delete it."
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Your skill has been deleted successfully!"
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to delete your skill."
    ]);
}
