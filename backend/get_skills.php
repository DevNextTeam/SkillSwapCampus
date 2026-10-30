
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

try {
    $currentUserId = $_SESSION["user_id"];

    $stmt = $pdo->prepare(
        "SELECT
            skills.id,
            skills.user_id,
            skills.skill_name,
            skills.description,
            skills.skill_type,
            skills.category,
            users.full_name,
            users.university,
            users.course,

            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM sessions
                    WHERE sessions.skill_id = skills.id
                    AND sessions.requester_id = :current_user_id
                    AND sessions.status IN (
                        'pending',
                        'accepted',
                        'completed'
                    )
                )
                THEN 1
                ELSE 0
            END AS has_requested

         FROM skills

         INNER JOIN users
            ON skills.user_id = users.id

         ORDER BY skills.id DESC"
    );

    $stmt->execute([
        "current_user_id" => $currentUserId
    ]);

    $skills = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "skills" => $skills
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve skills."
    ]);
}
