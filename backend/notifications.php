<?php
require_once "config.php";
require_once "db.php";

header("Content-Type: application/json; charset=utf-8");
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Only GET requests are allowed."]);
    exit;
}
if (empty($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Please log in first."]);
    exit;
}

$me = (int) $_SESSION["user_id"];
$items = [];
try {
    $stmt = $pdo->prepare("SELECT fr.id, u.full_name, fr.created_at FROM friend_requests fr JOIN users u ON u.id = fr.sender_id WHERE fr.receiver_id = ? AND fr.status = 'pending' ORDER BY fr.created_at DESC LIMIT 20");
    $stmt->execute([$me]);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $items[] = ["id" => "friend-" . $row["id"], "type" => "friend_request", "title" => "New friend request", "message" => $row["full_name"] . " wants to connect with you.", "created_at" => $row["created_at"]];
    }

    $stmt = $pdo->prepare("SELECT m.id, m.sender_id, u.full_name, m.body, m.created_at FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.receiver_id = ? AND m.read_at IS NULL ORDER BY m.created_at DESC LIMIT 30");
    $stmt->execute([$me]);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $preview = mb_substr($row["body"], 0, 90);
        $items[] = ["id" => "message-" . $row["id"], "type" => "message", "title" => "New message from " . $row["full_name"], "message" => $preview, "created_at" => $row["created_at"]];
    }

    $stmt = $pdo->prepare("SELECT s.id, s.status, s.created_at, u.full_name, sk.skill_name FROM sessions s JOIN users u ON u.id = s.requester_id JOIN skills sk ON sk.id = s.skill_id WHERE s.receiver_id = ? AND s.status = 'pending' ORDER BY s.created_at DESC LIMIT 20");
    $stmt->execute([$me]);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $items[] = ["id" => "exchange-" . $row["id"], "type" => "exchange", "title" => "New skill exchange request", "message" => $row["full_name"] . " requested " . $row["skill_name"] . ".", "created_at" => $row["created_at"]];
    }

    usort($items, static function ($a, $b) { return strtotime($b["created_at"]) <=> strtotime($a["created_at"]); });
    echo json_encode(["success" => true, "notifications" => array_slice($items, 0, 40)]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to load notifications."]);
}
