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
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid request data."]);
    exit;
}

$exchangeId = filter_var($data["exchange_id"] ?? null, FILTER_VALIDATE_INT);
$status = $data["status"] ?? "";
if (!$exchangeId || $exchangeId < 1 || !in_array($status, ["accepted", "rejected", "completed"], true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid exchange update."]);
    exit;
}

$userId = (int) $_SESSION["user_id"];

try {
    if ($status === "completed") {
        // Either participant may mark an accepted exchange complete.
        $stmt = $pdo->prepare(
            "UPDATE sessions
             SET status = 'completed'
             WHERE id = ?
               AND (requester_id = ? OR receiver_id = ?)
               AND status = 'accepted'"
        );
        $stmt->execute([$exchangeId, $userId, $userId]);
    } else {
        // Only the receiving student may accept or reject a pending request.
        $stmt = $pdo->prepare(
            "UPDATE sessions
             SET status = ?
             WHERE id = ? AND receiver_id = ? AND status = 'pending'"
        );
        $stmt->execute([$status, $exchangeId, $userId]);
    }

    if ($stmt->rowCount() === 0) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => $status === "completed"
                ? "This exchange is no longer active or has already been completed."
                : "This request has already been answered or you are not authorized to respond."
        ]);
        exit;
    }

    $messages = [
        "accepted" => "Exchange request accepted!",
        "rejected" => "Exchange request rejected.",
        "completed" => "Exchange marked as completed. Great work learning together!"
    ];

    echo json_encode(["success" => true, "message" => $messages[$status], "status" => $status]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to update the exchange. Please try again."]);
}
