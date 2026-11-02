<?php

require_once "config.php";
require_once "db.php";

date_default_timezone_set("Asia/Manila");

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
if (!is_array($data) ||
    !isset($data["exchange_id"], $data["scheduled_at"], $data["meeting_location"]) ||
    !is_scalar($data["exchange_id"]) ||
    !is_string($data["scheduled_at"]) ||
    !is_string($data["meeting_location"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please provide a valid date, time, and meeting location."]);
    exit;
}

$exchangeId = filter_var($data["exchange_id"], FILTER_VALIDATE_INT);
$scheduledAt = trim($data["scheduled_at"]);
$meetingLocation = trim($data["meeting_location"]);

if (!$exchangeId || $exchangeId < 1) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid exchange ID."]);
    exit;
}

$timezone = new DateTimeZone("Asia/Manila");
$date = DateTime::createFromFormat("!Y-m-d\\TH:i", $scheduledAt, $timezone);
$now = new DateTime("now", $timezone);

if (!$date || $date->format("Y-m-d\\TH:i") !== $scheduledAt || $date <= $now) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please choose a valid future date and time."]);
    exit;
}

if ($meetingLocation === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please select or enter a meeting location."]);
    exit;
}

if (strlen($meetingLocation) > 255) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Meeting location must not exceed 255 characters."]);
    exit;
}

$userId = (int) $_SESSION["user_id"];

try {
    $pdo->beginTransaction();

    // Lock the exact exchange so two students cannot overwrite each other's
    // proposals while either request is being processed.
    $stmt = $pdo->prepare(
        "SELECT id, requester_id, receiver_id, status
         FROM sessions
         WHERE id = ?
         LIMIT 1
         FOR UPDATE"
    );
    $stmt->execute([$exchangeId]);
    $exchange = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$exchange ||
        (int) $exchange["requester_id"] !== $userId &&
        (int) $exchange["receiver_id"] !== $userId) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Accepted exchange not found."]);
        exit;
    }

    if ($exchange["status"] !== "accepted") {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Only accepted exchanges can be scheduled. Refresh your exchanges and try again."]);
        exit;
    }

    $stmt = $pdo->prepare(
        "UPDATE sessions
         SET scheduled_at = ?,
             meeting_location = ?,
             schedule_status = 'pending',
             schedule_proposed_by = ?
         WHERE id = ?
           AND status = 'accepted'"
    );
    $stmt->execute([
        $date->format("Y-m-d H:i:s"),
        $meetingLocation,
        $userId,
        $exchangeId
    ]);

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Schedule proposal sent! The other student must confirm the updated details.",
        "exchange_id" => $exchangeId,
        "schedule_status" => "pending",
        "schedule_proposed_by" => $userId,
        "scheduled_at" => $date->format("Y-m-d H:i:s"),
        "meeting_location" => $meetingLocation
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Schedule proposal failed for exchange {$exchangeId}: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to submit the schedule proposal. Please try again."]);
}
