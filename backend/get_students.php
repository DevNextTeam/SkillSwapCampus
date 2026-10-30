
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
        "message" => "Please log in to discover students."
    ]);
    exit;
}

$currentUserId = (int) $_SESSION["user_id"];

try {
    $sql = "
        SELECT
            u.id,
            u.full_name,
            u.university,
            u.course,
            u.year_level,
            u.bio,

            GROUP_CONCAT(
                DISTINCT CASE
                    WHEN s.skill_type = 'offer' THEN s.skill_name
                END
                ORDER BY s.skill_name
                SEPARATOR '|||'
            ) AS skills_offered,

            GROUP_CONCAT(
                DISTINCT CASE
                    WHEN s.skill_type = 'learn' THEN s.skill_name
                END
                ORDER BY s.skill_name
                SEPARATOR '|||'
            ) AS skills_wanted

        FROM users u

        LEFT JOIN skills s ON s.user_id = u.id

        WHERE u.id <> :current_user_id

        GROUP BY
            u.id,
            u.full_name,
            u.university,
            u.course,
            u.year_level,
            u.bio

        ORDER BY u.full_name ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        "current_user_id" => $currentUserId
    ]);

    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($students as &$student) {
        $student["skills_offered"] = $student["skills_offered"]
            ? explode("|||", $student["skills_offered"])
            : [];

        $student["skills_wanted"] = $student["skills_wanted"]
            ? explode("|||", $student["skills_wanted"])
            : [];
    }

    unset($student);

    echo json_encode([
        "success" => true,
        "students" => $students
    ]);

} catch (PDOException $error) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to load students right now."
    ]);
}
