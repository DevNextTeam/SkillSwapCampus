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

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$me = (int) $_SESSION["user_id"];
$target = filter_var($data["user_id"] ?? null, FILTER_VALIDATE_INT);
$action = $data["action"] ?? "send";

if (!$target || $target < 1 || $target === $me || !in_array($action, ["send", "accept", "decline", "cancel"], true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid friend request."]);
    exit;
}

try {
    $check = $pdo->prepare("SELECT id FROM users WHERE id = ? LIMIT 1");
    $check->execute([$target]);
    if (!$check->fetchColumn()) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Student not found."]);
        exit;
    }

    if ($action === "send") {
        // An incoming pending request should be accepted, not duplicated in reverse.
        $incoming = $pdo->prepare("SELECT id FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending' LIMIT 1");
        $incoming->execute([$target, $me]);
        if ($incoming->fetchColumn()) {
            http_response_code(409);
            echo json_encode(["success" => false, "message" => "This student already sent you a request. Accept or decline their request instead."]);
            exit;
        }

        $existing = $pdo->prepare("SELECT id, status FROM friend_requests WHERE sender_id = ? AND receiver_id = ? LIMIT 1");
        $existing->execute([$me, $target]);
        $row = $existing->fetch(PDO::FETCH_ASSOC);

        if ($row && $row["status"] === "accepted") {
            echo json_encode(["success" => true, "message" => "You are already friends."]);
            exit;
        }
        if ($row && $row["status"] === "pending") {
            echo json_encode(["success" => true, "message" => "Friend request already sent."]);
            exit;
        }
        if ($row) {
            $update = $pdo->prepare("UPDATE friend_requests SET status = 'pending' WHERE id = ?");
            $update->execute([$row["id"]]);
        } else {
            $insert = $pdo->prepare("INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, 'pending')");
            $insert->execute([$me, $target]);
        }
        echo json_encode(["success" => true, "message" => "Friend request sent."]);
        exit;
    }

    $incomingAction = in_array($action, ["accept", "decline"], true);
    $sql = $incomingAction
        ? "SELECT id FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending' LIMIT 1"
        : "SELECT id FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending' LIMIT 1";
    $lookup = $pdo->prepare($sql);
    $lookup->execute($incomingAction ? [$target, $me] : [$me, $target]);
    $requestId = $lookup->fetchColumn();

    if (!$requestId) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Pending request not found."]);
        exit;
    }

    if ($action === "cancel") {
        $change = $pdo->prepare("DELETE FROM friend_requests WHERE id = ?");
        $change->execute([$requestId]);
        $message = "Friend request cancelled.";
    } else {
        $change = $pdo->prepare("UPDATE friend_requests SET status = ? WHERE id = ?");
        $change->execute([$action === "accept" ? "accepted" : "declined", $requestId]);
        $message = $action === "accept" ? "Friend request accepted." : "Friend request declined.";
    }
    echo json_encode(["success" => true, "message" => $message]);
} catch (PDOException $error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to update friend request."]);
}
