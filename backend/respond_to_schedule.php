
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

$action = $data["action"] ?? "";

if (!$exchangeId || $exchangeId < 1) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid exchange ID."
    ]);
    exit;
}

if (!in_array($action, ["confirm", "decline"], true)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid schedule response."
    ]);
    exit;
}

$userId = (int) $_SESSION["user_id"];

try {
    // Find a pending proposal for an accepted exchange.
    // Only the student who did NOT submit the latest proposal
    // is allowed to confirm or decline it.
    $stmt = $pdo->prepare(
        "SELECT id, schedule_proposed_by, scheduled_at
         FROM sessions
         WHERE id = ?
         AND (requester_id = ? OR receiver_id = ?)
         AND status = 'accepted'
         AND schedule_status = 'pending'
         AND schedule_proposed_by <> ?
         LIMIT 1"
    );

    $stmt->execute([
        $exchangeId,
        $userId,
        $userId,
        $userId
    ]);

    $exchange = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$exchange) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "No schedule proposal is waiting for your response, or you cannot respond to your own proposal."
        ]);
        exit;
    }

    // A proposal must still be in the future when confirmed.
    if ($action === "confirm") {
        $timezone = new DateTimeZone("Asia/Manila");
        $now = new DateTime("now", $timezone);

        $proposedDate = new DateTime(
            $exchange["scheduled_at"],
            $timezone
        );

        if ($proposedDate <= $now) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "This proposed meeting time has already passed. Please suggest a new schedule."
            ]);
            exit;
        }

        $newStatus = "confirmed";
        $message = "Schedule confirmed! Both students can now view the agreed meeting details.";
    } else {
        $newStatus = "declined";
        $message = "Schedule proposal declined. Either student can submit a new proposal.";
    }

    // Update only if the same student is still responding
    // to a pending proposal.
    $stmt = $pdo->prepare(
        "UPDATE sessions
         SET schedule_status = ?
         WHERE id = ?
         AND (requester_id = ? OR receiver_id = ?)
         AND status = 'accepted'
         AND schedule_status = 'pending'
         AND schedule_proposed_by <> ?"
    );

    $stmt->execute([
        $newStatus,
        $exchangeId,
        $userId,
        $userId,
        $userId
    ]);

    if ($stmt->rowCount() === 0) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "This proposal has already been answered. Please refresh your schedule."
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => $message,
        "schedule_status" => $newStatus
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to process the schedule response. Please try again."
    ]);
}
