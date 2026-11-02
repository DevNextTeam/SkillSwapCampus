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
    !isset($data["exchange_id"], $data["action"]) ||
    !is_scalar($data["exchange_id"]) ||
    !is_string($data["action"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid schedule response."]);
    exit;
}

$exchangeId = filter_var($data["exchange_id"], FILTER_VALIDATE_INT);
$action = $data["action"];

if (!$exchangeId || $exchangeId < 1 || !in_array($action, ["confirm", "decline"], true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid schedule response."]);
    exit;
}

$userId = (int) $_SESSION["user_id"];
$timezone = new DateTimeZone("Asia/Manila");

try {
    $pdo->beginTransaction();

    // Lock the exchange before checking who proposed the current schedule.
    // This prevents two simultaneous responses from both being accepted.
    $stmt = $pdo->prepare(
        "SELECT id, requester_id, receiver_id, status,
                schedule_status, schedule_proposed_by, scheduled_at
         FROM sessions
         WHERE id = ?
         LIMIT 1
         FOR UPDATE"
    );
    $stmt->execute([$exchangeId]);
    $exchange = $stmt->fetch(PDO::FETCH_ASSOC);

    $isParticipant = $exchange &&
        ((int) $exchange["requester_id"] === $userId ||
         (int) $exchange["receiver_id"] === $userId);

    if (!$isParticipant ||
        $exchange["status"] !== "accepted" ||
        $exchange["schedule_status"] !== "pending" ||
        (int) $exchange["schedule_proposed_by"] === $userId) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "There is no schedule proposal waiting for your response. It may have already been answered or replaced."
        ]);
        exit;
    }

    if ($action === "confirm") {
        $proposedDate = DateTime::createFromFormat(
            "!Y-m-d H:i:s",
            (string) $exchange["scheduled_at"],
            $timezone
        );
        $now = new DateTime("now", $timezone);

        if (!$proposedDate || $proposedDate <= $now) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "This proposed meeting time has passed or is invalid. Please suggest a new schedule."
            ]);
            exit;
        }

        $newStatus = "confirmed";
        $message = "Schedule confirmed! Both students can now view the agreed meeting details.";
    } else {
        $newStatus = "declined";
        $message = "Schedule proposal declined. Either student can submit a new proposal.";
    }

    $stmt = $pdo->prepare(
        "UPDATE sessions
         SET schedule_status = ?
         WHERE id = ?
           AND status = 'accepted'
           AND schedule_status = 'pending'
           AND schedule_proposed_by <> ?"
    );
    $stmt->execute([$newStatus, $exchangeId, $userId]);

    if ($stmt->rowCount() !== 1) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "This proposal has already been answered. Refresh your schedule."
        ]);
        exit;
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => $message,
        "exchange_id" => $exchangeId,
        "schedule_status" => $newStatus
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Schedule response failed for exchange {$exchangeId}: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to process the schedule response. Please try again."]);
}
