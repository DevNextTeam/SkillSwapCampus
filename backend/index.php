
<?php

header("Content-Type: application/json; charset=UTF-8");

require_once "db.php";

echo json_encode([
    "success" => true,
    "message" => "SkillSwap Campus API connected to MySQL!",
    "database" => "skillswap_campus"
]);
