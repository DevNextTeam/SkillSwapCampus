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
if (!is_array($data) || !isset($data["exchange_id"]) || !is_scalar($data["exchange_id"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid exchange selection."]);
    exit;
}

$exchangeId = filter_var($data["exchange_id"], FILTER_VALIDATE_INT);
$status = $data["status"] ?? "";
if (!$exchangeId || $exchangeId < 1 || !in_array($status, ["accepted", "rejected", "completed"], true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid exchange update."]);
    exit;
}

$userId = (int) $_SESSION["user_id"];

try {
    // Serialize decisions for this exact request and verify its current state.
    $pdo->beginTransaction();

    $lock = $pdo->prepare(
        "SELECT id, requester_id, receiver_id, status
         FROM sessions
         WHERE id = ?
         LIMIT 1
         FOR UPDATE"
    );
    $lock->execute([$exchangeId]);
    $exchange = $lock->fetch(PDO::FETCH_ASSOC);

    if (!$exchange) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "This exchange request could not be found."]);
        exit;
    }

    $requesterId = (int) $exchange["requester_id"];
    $receiverId = (int) $exchange["receiver_id"];
    $currentStatus = $exchange["status"];

    if ($status === "completed") {
        $authorized = ($requesterId === $userId || $receiverId === $userId)
            && $currentStatus === "accepted";
    } else {
        $authorized = $receiverId === $userId && $currentStatus === "pending";
    }

    if (!$authorized) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "This specific request is no longer pending, or you are not allowed to change it.",
            "exchange_id" => (int) $exchangeId,
            "current_status" => $currentStatus
        ]);
        exit;
    }

    // The primary-key predicate ensures no other exchange can be changed.
    $update = $pdo->prepare(
        "UPDATE sessions
         SET status = ?
         WHERE id = ?
           AND status = ?"
    );
    $update->execute([$status, $exchangeId, $currentStatus]);

    if ($update->rowCount() !== 1) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "The request changed before your update could be saved. Please refresh."]);
        exit;
    }

    $pdo->commit();

    $messages = [
        "accepted" => "This exchange request was accepted.",
        "rejected" => "This exchange request was rejected.",
        "completed" => "This exchange was marked as completed."
    ];

    echo json_encode([
        "success" => true,
        "message" => $messages[$status],
        "exchange_id" => (int) $exchangeId,
        "status" => $status
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Exchange status update failed for exchange {$exchangeId}: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to update this exchange. Please try again."]);
}
