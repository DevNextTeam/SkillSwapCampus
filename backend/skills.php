
<?php

require_once "config.php";
require_once "db.php";

// Only logged-in students can access skills.
if (empty($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Please log in first."
    ]);
    exit;
}

$method = $_SERVER["REQUEST_METHOD"];

try {

    // GET: Retrieve skill posts from the database.
    if ($method === "GET") {

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
                users.course
            FROM skills
            INNER JOIN users ON skills.user_id = users.id
            ORDER BY skills.id DESC"
        );

        $stmt->execute();
        $skills = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "skills" => $skills
        ]);
        exit;
    }

    // POST: Add a new skill post.
    if ($method === "POST") {

        $data = json_decode(file_get_contents("php://input"), true);

        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Invalid JSON data."
            ]);
            exit;
        }

        $skillName = trim($data["skill_name"] ?? "");
        $description = trim($data["description"] ?? "");
        $skillType = trim($data["skill_type"] ?? "");
        $category = trim($data["category"] ?? "");

        if ($skillName === "" || $description === "" || $skillType === "") {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Skill name, description, and skill type are required."
            ]);
            exit;
        }

        if (!in_array($skillType, ["offer", "learn"], true)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Skill type must be offer or learn."
            ]);
            exit;
        }

        $stmt = $pdo->prepare(
            "INSERT INTO skills
                (user_id, skill_name, description, skill_type, category)
             VALUES (?, ?, ?, ?, ?)"
        );

        $stmt->execute([
            $_SESSION["user_id"],
            $skillName,
            $description,
            $skillType,
            $category !== "" ? $category : null
        ]);

        http_response_code(201);

        echo json_encode([
            "success" => true,
            "message" => "Your skill post was added successfully!",
            "skill_id" => $pdo->lastInsertId()
        ]);
        exit;
    }

    // Reject unsupported request methods.
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to process your skill request."
    ]);
}
