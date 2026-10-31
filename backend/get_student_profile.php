<?php
require_once "config.php";
require_once "db.php";
if ($_SERVER["REQUEST_METHOD"] !== "GET") { http_response_code(405); echo json_encode(["success"=>false,"message"=>"Only GET requests are allowed."]); exit; }
if (empty($_SESSION["user_id"])) { http_response_code(401); echo json_encode(["success"=>false,"message"=>"Please log in first."]); exit; }
$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);
if (!$id || $id < 1) { http_response_code(400); echo json_encode(["success"=>false,"message"=>"Invalid student."]); exit; }
try {
  $stmt=$pdo->prepare("SELECT id, full_name, university, course, year_level, bio, profile_photo FROM users WHERE id=? LIMIT 1");
  $stmt->execute([$id]); $student=$stmt->fetch(PDO::FETCH_ASSOC);
  if (!$student) { http_response_code(404); echo json_encode(["success"=>false,"message"=>"Student not found."]); exit; }
  $stmt=$pdo->prepare("SELECT id, skill_name, description, skill_type, category FROM skills WHERE user_id=? ORDER BY created_at DESC");
  $stmt->execute([$id]); $student["skills"]=$stmt->fetchAll(PDO::FETCH_ASSOC);
  $me=(int)$_SESSION["user_id"];
  $stmt=$pdo->prepare("SELECT id,status,sender_id,receiver_id FROM friend_requests WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY id DESC LIMIT 1");
  $stmt->execute([$me,$id,$id,$me]); $friend=$stmt->fetch(PDO::FETCH_ASSOC);
  $student["friend_status"]=$friend ?: null;
  echo json_encode(["success"=>true,"student"=>$student]);
} catch(PDOException $e) { http_response_code(500); echo json_encode(["success"=>false,"message"=>"Unable to load this profile."]); }
