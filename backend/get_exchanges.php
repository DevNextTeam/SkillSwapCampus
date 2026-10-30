
<?php

require_once "config.php";
require_once "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Only GET requests are allowed."
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

$userId = (int) $_SESSION["user_id"];

try {
    $stmt = $pdo->prepare(
        "SELECT
            s.id,
            s.requester_id,
            s.receiver_id,
            s.skill_id,
            s.scheduled_at,
            s.meeting_location,
            s.status,
            s.schedule_status,
            s.schedule_proposed_by,
            s.created_at,

            sk.skill_name,
            sk.category,
            sk.skill_type,

            requester.full_name AS requester_name,
            requester.university AS requester_university,

            receiver.full_name AS receiver_name,
            receiver.university AS receiver_university,

            CASE
                WHEN s.requester_id = ? THEN 'sent'
                ELSE 'received'
            END AS request_direction,

            CASE
                WHEN s.schedule_status = 'pending'
                     AND s.schedule_proposed_by = ? THEN 'waiting'
                WHEN s.schedule_status = 'pending'
                     AND s.schedule_proposed_by <> ? THEN 'respond'
                ELSE 'none'
            END AS schedule_action

         FROM sessions s

         INNER JOIN skills sk
            ON s.skill_id = sk.id

         INNER JOIN users requester
            ON s.requester_id = requester.id

         INNER JOIN users receiver
            ON s.receiver_id = receiver.id

         WHERE s.requester_id = ?
            OR s.receiver_id = ?

         ORDER BY s.created_at DESC"
    );

    $stmt->execute([
        $userId,
        $userId,
        $userId,
        $userId,
        $userId
    ]);

    $exchanges = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "exchanges" => $exchanges
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve exchange requests."
    ]);
}
