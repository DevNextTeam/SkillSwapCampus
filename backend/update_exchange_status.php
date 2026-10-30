
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

$exchangeId = filter_var(
    $data["exchange_id"] ?? null,
    FILTER_VALIDATE_INT
);

$status = $data["status"] ?? "";

if (!$exchangeId || $exchangeId < 1) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid exchange request."
    ]);
    exit;
}

if (!in_array($status, ["accepted", "rejected"], true)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid exchange status."
    ]);
    exit;
}

$userId = (int) $_SESSION["user_id"];

try {
    // Only the student receiving the request can respond.
    $stmt = $pdo->prepare(
        "SELECT id, status
         FROM sessions
         WHERE id = ? AND receiver_id = ?
         LIMIT 1"
    );

    $stmt->execute([$exchangeId, $userId]);

    $exchange = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$exchange) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Exchange request not found or you are not authorized to respond."
        ]);
        exit;
    }

    if ($exchange["status"] !== "pending") {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "This exchange request has already been answered."
        ]);
        exit;
    }

    $stmt = $pdo->prepare(
        "UPDATE sessions
         SET status = ?
         WHERE id = ? AND receiver_id = ? AND status = 'pending'"
    );

    $stmt->execute([
        $status,
        $exchangeId,
        $userId
    ]);

    if ($stmt->rowCount() === 0) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "This request has already been updated."
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => $status === "accepted"
            ? "Exchange request accepted!"
            : "Exchange request rejected!",
        "status" => $status
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to update the exchange request."
    ]);
}
