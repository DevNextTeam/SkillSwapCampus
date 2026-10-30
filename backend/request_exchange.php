
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

$skillId = filter_var(
    $data["skill_id"] ?? null,
    FILTER_VALIDATE_INT
);

if (!$skillId || $skillId < 1) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid skill selected."
    ]);
    exit;
}

$requesterId = (int) $_SESSION["user_id"];

try {
    // Find the skill and its owner.
    $stmt = $pdo->prepare(
        "SELECT id, user_id, skill_name, skill_type
         FROM skills
         WHERE id = ?
         LIMIT 1"
    );

    $stmt->execute([$skillId]);
    $skill = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$skill) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "This skill post no longer exists."
        ]);
        exit;
    }

    $receiverId = (int) $skill["user_id"];

    // Prevent requesting your own skill.
    if ($receiverId === $requesterId) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "You cannot request an exchange with your own post."
        ]);
        exit;
    }

    // Only allow requests for skills being offered.
    if ($skill["skill_type"] !== "offer") {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "You can only request an exchange from a student offering to teach."
        ]);
        exit;
    }

    // Prevent duplicate pending requests.
    $stmt = $pdo->prepare(
        "SELECT id
         FROM sessions
         WHERE requester_id = ?
           AND receiver_id = ?
           AND skill_id = ?
           AND status = 'pending'
         LIMIT 1"
    );

    $stmt->execute([
        $requesterId,
        $receiverId,
        $skillId
    ]);

    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "You already have a pending request for this skill."
        ]);
        exit;
    }

    // Create the exchange request without a scheduled date.
    // Students will arrange the date and location after acceptance.
    $stmt = $pdo->prepare(
        "INSERT INTO sessions
            (requester_id, receiver_id, skill_id, scheduled_at, status)
         VALUES (?, ?, ?, NULL, 'pending')"
    );

    $stmt->execute([
        $requesterId,
        $receiverId,
        $skillId
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Exchange request sent successfully!",
        "request_id" => $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to send exchange request. Please try again."
    ]);
}
