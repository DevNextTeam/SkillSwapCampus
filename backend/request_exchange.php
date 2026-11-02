<?php

require_once "config.php";
require_once "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Only POST requests are allowed."]);
    exit;
}

if (empty($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Please log in first."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data) || !isset($data["skill_id"]) || !is_scalar($data["skill_id"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid skill selected."]);
    exit;
}

$skillId = filter_var($data["skill_id"], FILTER_VALIDATE_INT);
if (!$skillId || $skillId < 1) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid skill selected."]);
    exit;
}

$requesterId = (int) $_SESSION["user_id"];

try {
    $pdo->beginTransaction();

    // Lock the offered skill while checking and creating a request. Requests
    // for the same post are serialized, preventing double-click/race duplicates.
    $stmt = $pdo->prepare(
        "SELECT id, user_id, skill_name, skill_type
         FROM skills
         WHERE id = ?
         LIMIT 1
         FOR UPDATE"
    );
    $stmt->execute([$skillId]);
    $skill = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$skill) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "This skill post no longer exists."]);
        exit;
    }

    $receiverId = (int) $skill["user_id"];

    if ($receiverId === $requesterId) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "You cannot request an exchange with your own post."]);
        exit;
    }

    if ($skill["skill_type"] !== "offer") {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "You can only request an exchange from a student offering to teach."]);
        exit;
    }

    // A rejected request may be retried later, but only one active request
    // (pending or accepted) is allowed for this student and skill post.
    $stmt = $pdo->prepare(
        "SELECT id, status
         FROM sessions
         WHERE requester_id = ?
           AND receiver_id = ?
           AND skill_id = ?
           AND status IN ('pending', 'accepted')
         LIMIT 1"
    );
    $stmt->execute([$requesterId, $receiverId, $skillId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $pdo->rollBack();
        http_response_code(409);
        $message = $existing["status"] === "accepted"
            ? "You already have an accepted exchange for this skill."
            : "You already have a pending request for this skill.";
        echo json_encode([
            "success" => false,
            "message" => $message,
            "request_id" => (int) $existing["id"],
            "status" => $existing["status"]
        ]);
        exit;
    }

    $stmt = $pdo->prepare(
        "INSERT INTO sessions
            (requester_id, receiver_id, skill_id, scheduled_at, status)
         VALUES (?, ?, ?, NULL, 'pending')"
    );
    $stmt->execute([$requesterId, $receiverId, $skillId]);
    $requestId = (int) $pdo->lastInsertId();

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Exchange request sent successfully!",
        "request_id" => $requestId,
        "status" => "pending"
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Exchange request creation failed for skill {$skillId}: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to send exchange request. Please try again."]);
}
