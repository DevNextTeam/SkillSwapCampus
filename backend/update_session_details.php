
<?php

require_once "config.php";
require_once "db.php";

date_default_timezone_set("Asia/Manila");

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

$scheduledAt = trim($data["scheduled_at"] ?? "");
$meetingLocation = trim($data["meeting_location"] ?? "");

if (!$exchangeId || $exchangeId < 1) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid exchange ID."
    ]);
    exit;
}

// Validate the proposed date and time using Philippine time.
$timezone = new DateTimeZone("Asia/Manila");

$date = DateTime::createFromFormat(
    "!Y-m-d\TH:i",
    $scheduledAt,
    $timezone
);

$now = new DateTime("now", $timezone);

if (
    !$date ||
    $date->format("Y-m-d\TH:i") !== $scheduledAt ||
    $date <= $now
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please choose a valid future date and time."
    ]);
    exit;
}

if ($meetingLocation === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please select or enter a meeting location."
    ]);
    exit;
}

if (strlen($meetingLocation) > 255) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Meeting location must not exceed 255 characters."
    ]);
    exit;
}

$userId = (int) $_SESSION["user_id"];

try {
    // Verify that the exchange exists, is accepted,
    // and belongs to the logged-in student.
    $stmt = $pdo->prepare(
        "SELECT id, schedule_status
         FROM sessions
         WHERE id = ?
         AND (requester_id = ? OR receiver_id = ?)
         AND status = 'accepted'
         LIMIT 1"
    );

    $stmt->execute([
        $exchangeId,
        $userId,
        $userId
    ]);

    $exchange = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$exchange) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Accepted exchange not found."
        ]);
        exit;
    }

    // Either student may submit a new proposal or revise
    // an existing pending or confirmed schedule.
    // Every new proposal requires the other student's approval.
    $stmt = $pdo->prepare(
        "UPDATE sessions
         SET scheduled_at = ?,
             meeting_location = ?,
             schedule_status = 'pending',
             schedule_proposed_by = ?
         WHERE id = ?
         AND (requester_id = ? OR receiver_id = ?)
         AND status = 'accepted'"
    );

    $stmt->execute([
        $date->format("Y-m-d H:i:s"),
        $meetingLocation,
        $userId,
        $exchangeId,
        $userId,
        $userId
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Schedule proposal sent! The other student must confirm the updated details.",
        "schedule_status" => "pending",
        "schedule_proposed_by" => $userId,
        "scheduled_at" => $date->format("Y-m-d H:i:s"),
        "meeting_location" => $meetingLocation
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to submit the schedule proposal."
    ]);
}
