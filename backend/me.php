
<?php

require_once "config.php";
require_once "db.php";

if (empty($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "You are not logged in."
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "SELECT id, full_name, email, university, course, year_level, bio, profile_photo
         FROM users
         WHERE id = ?
         LIMIT 1"
    );

    $stmt->execute([$_SESSION["user_id"]]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        session_unset();
        session_destroy();

        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Student account not found."
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "user" => $user
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve student profile."
    ]);
}
