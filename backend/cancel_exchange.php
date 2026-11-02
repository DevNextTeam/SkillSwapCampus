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
$requestId = is_array($data) && isset($data["request_id"])
    ? filter_var($data["request_id"], FILTER_VALIDATE_INT)
    : false;
if (!$requestId || $requestId < 1) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid exchange request."]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "UPDATE sessions
         SET status = 'cancelled'
         WHERE id = ?
           AND requester_id = ?
           AND status = 'pending'"
    );
    $stmt->execute([$requestId, (int) $_SESSION["user_id"]]);

    if ($stmt->rowCount() !== 1) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "This request can no longer be cancelled. It may already have been answered."
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Your exchange request has been cancelled.",
        "request_id" => (int) $requestId,
        "status" => "cancelled"
    ]);
} catch (PDOException $e) {
    error_log("Exchange request cancellation failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to cancel this request. Please try again."]);
}
