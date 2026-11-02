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
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid friend request data."]);
    exit;
}

$me = (int) $_SESSION["user_id"];
$target = filter_var($data["user_id"] ?? null, FILTER_VALIDATE_INT);
$action = $data["action"] ?? "send";

if (!$target || $target < 1 || $target === $me ||
    !in_array($action, ["send", "accept", "decline", "cancel"], true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid friend request."]);
    exit;
}

try {
    $pdo->beginTransaction();

    // Lock both student rows in a consistent order. This serializes actions
    // for the same pair and prevents simultaneous clicks from creating
    // duplicate friend-request records (including requests sent both ways).
    $lockUsers = $pdo->prepare(
        "SELECT id
         FROM users
         WHERE id IN (?, ?)
         ORDER BY id
         FOR UPDATE"
    );
    $lockUsers->execute([$me, $target]);
    $lockedUsers = $lockUsers->fetchAll(PDO::FETCH_COLUMN);

    if (count($lockedUsers) !== 2) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Student not found."]);
        exit;
    }

    if ($action === "send") {
        $accepted = $pdo->prepare(
            "SELECT id
             FROM friend_requests
             WHERE status = 'accepted'
               AND ((sender_id = ? AND receiver_id = ?)
                 OR (sender_id = ? AND receiver_id = ?))
             LIMIT 1"
        );
        $accepted->execute([$me, $target, $target, $me]);
        if ($accepted->fetchColumn()) {
            $pdo->rollBack();
            echo json_encode(["success" => true, "message" => "You are already friends."]);
            exit;
        }

        // If the other student already requested you, accept that request
        // rather than creating a second record in the opposite direction.
        $incoming = $pdo->prepare(
            "SELECT id
             FROM friend_requests
             WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
             LIMIT 1
             FOR UPDATE"
        );
        $incoming->execute([$target, $me]);
        if ($incoming->fetchColumn()) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode([
                "success" => false,
                "message" => "This student already sent you a request. Accept or decline their request instead."
            ]);
            exit;
        }

        $existing = $pdo->prepare(
            "SELECT id, status
             FROM friend_requests
             WHERE sender_id = ? AND receiver_id = ?
             LIMIT 1
             FOR UPDATE"
        );
        $existing->execute([$me, $target]);
        $row = $existing->fetch(PDO::FETCH_ASSOC);

        if ($row && $row["status"] === "accepted") {
            $pdo->rollBack();
            echo json_encode(["success" => true, "message" => "You are already friends."]);
            exit;
        }
        if ($row && $row["status"] === "pending") {
            $pdo->rollBack();
            echo json_encode(["success" => true, "message" => "Friend request already sent."]);
            exit;
        }

        if ($row) {
            $update = $pdo->prepare(
                "UPDATE friend_requests
                 SET status = 'pending'
                 WHERE id = ? AND status = 'declined'"
            );
            $update->execute([$row["id"]]);
        } else {
            $insert = $pdo->prepare(
                "INSERT INTO friend_requests (sender_id, receiver_id, status)
                 VALUES (?, ?, 'pending')"
            );
            $insert->execute([$me, $target]);
        }

        $pdo->commit();
        echo json_encode(["success" => true, "message" => "Friend request sent."]);
        exit;
    }

    $incomingAction = in_array($action, ["accept", "decline"], true);
    $lookup = $pdo->prepare(
        "SELECT id
         FROM friend_requests
         WHERE sender_id = ?
           AND receiver_id = ?
           AND status = 'pending'
         LIMIT 1
         FOR UPDATE"
    );
    $lookup->execute($incomingAction ? [$target, $me] : [$me, $target]);
    $requestId = $lookup->fetchColumn();

    if (!$requestId) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Pending request not found."]);
        exit;
    }

    if ($action === "cancel") {
        $change = $pdo->prepare(
            "DELETE FROM friend_requests
             WHERE id = ? AND sender_id = ? AND receiver_id = ? AND status = 'pending'"
        );
        $change->execute([$requestId, $me, $target]);
        $message = "Friend request cancelled.";
    } else {
        $newStatus = $action === "accept" ? "accepted" : "declined";
        $change = $pdo->prepare(
            "UPDATE friend_requests
             SET status = ?
             WHERE id = ? AND receiver_id = ? AND status = 'pending'"
        );
        $change->execute([$newStatus, $requestId, $me]);
        $message = $action === "accept"
            ? "Friend request accepted."
            : "Friend request declined.";
    }

    if ($change->rowCount() !== 1) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "This friend request has already changed. Refresh and try again."]);
        exit;
    }

    $pdo->commit();
    echo json_encode(["success" => true, "message" => $message]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Friend request action failed for users {$me} and {$target}: " . $error->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to update friend request. Please try again."]);
}
