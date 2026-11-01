<?php
require_once "config.php";
require_once "db.php";

if (empty($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Please log in to use the campus map."]);
    exit;
}
$me = (int) $_SESSION["user_id"];
$method = $_SERVER["REQUEST_METHOD"] ?? "GET";
session_write_close();

try {
    if ($method === "POST") {
        $input = json_decode(file_get_contents("php://input"), true);
        if (!is_array($input)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid location data."]);
            exit;
        }
        if (!empty($input["stop"])) {
            $stmt = $pdo->prepare("DELETE FROM live_locations WHERE user_id = ?");
            $stmt->execute([$me]);
            echo json_encode(["success" => true, "sharing" => false]);
            exit;
        }
        $lat = filter_var($input["latitude"] ?? null, FILTER_VALIDATE_FLOAT);
        $lng = filter_var($input["longitude"] ?? null, FILTER_VALIDATE_FLOAT);
        $accuracy = filter_var($input["accuracy"] ?? null, FILTER_VALIDATE_FLOAT);
        if ($lat === false || $lng === false || $lat < -90 || $lat > 90 || $lng < -180 || $lng > 180 ||
            ($accuracy !== false && $accuracy !== null && ($accuracy < 0 || $accuracy > 100000))) {
            http_response_code(422);
            echo json_encode(["success" => false, "message" => "The location coordinates are not valid."]);
            exit;
        }
        $stmt = $pdo->prepare("INSERT INTO live_locations (user_id, latitude, longitude, accuracy_meters, updated_at) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude), accuracy_meters = VALUES(accuracy_meters), updated_at = NOW()");
        $stmt->execute([$me, $lat, $lng, $accuracy === false ? null : $accuracy]);
        echo json_encode(["success" => true, "sharing" => true]);
        exit;
    }

    if ($method !== "GET") {
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Only GET and POST are allowed."]);
        exit;
    }

    // Expire old records as part of reads so disconnected browsers disappear automatically.
    $pdo->exec("DELETE FROM live_locations WHERE updated_at < (NOW() - INTERVAL 2 MINUTE)");
    $stmt = $pdo->prepare("SELECT l.user_id, l.latitude, l.longitude, l.accuracy_meters, l.updated_at, u.full_name, u.university, u.course, u.profile_photo FROM live_locations l JOIN users u ON u.id = l.user_id WHERE l.updated_at >= (NOW() - INTERVAL 2 MINUTE) ORDER BY l.updated_at DESC LIMIT 500");
    $stmt->execute();
    echo json_encode(["success" => true, "locations" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (PDOException $error) {
    error_log("SkillSwap live locations error: " . $error->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "The campus map is temporarily unavailable."]);
}
