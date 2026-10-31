<?php
require_once "config.php";
require_once "db.php";
if ($_SERVER["REQUEST_METHOD"] !== "GET") { http_response_code(405); echo json_encode(["success"=>false,"message"=>"Only GET requests are allowed."]); exit; }
if (empty($_SESSION["user_id"])) { http_response_code(401); echo json_encode(["success"=>false,"message"=>"Please log in first."]); exit; }
$me=(int)$_SESSION["user_id"];
try {
 $q=$pdo->prepare("SELECT fr.id AS request_id, fr.sender_id AS user_id, u.full_name, u.university, u.profile_photo, fr.created_at FROM friend_requests fr JOIN users u ON u.id=fr.sender_id WHERE fr.receiver_id=? AND fr.status='pending' ORDER BY fr.created_at DESC");
 $q->execute([$me]); $incoming=$q->fetchAll(PDO::FETCH_ASSOC);
 $q=$pdo->prepare("SELECT fr.id AS friendship_id, CASE WHEN fr.sender_id=? THEN fr.receiver_id ELSE fr.sender_id END AS user_id, u.full_name, u.university, u.profile_photo FROM friend_requests fr JOIN users u ON u.id=CASE WHEN fr.sender_id=? THEN fr.receiver_id ELSE fr.sender_id END WHERE (fr.sender_id=? OR fr.receiver_id=?) AND fr.status='accepted' ORDER BY u.full_name");
 $q->execute([$me,$me,$me,$me]); $friends=$q->fetchAll(PDO::FETCH_ASSOC);
 foreach ($friends as &$friend) {
   $last=$pdo->prepare("SELECT id,sender_id,body,created_at,read_at FROM messages WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY id DESC LIMIT 1");
   $last->execute([$me,$friend["user_id"],$friend["user_id"],$me]); $friend["last_message"]=$last->fetch(PDO::FETCH_ASSOC) ?: null;
 }
 unset($friend);
 echo json_encode(["success"=>true,"incoming_requests"=>$incoming,"friends"=>$friends]);
} catch(PDOException $e) { http_response_code(500); echo json_encode(["success"=>false,"message"=>"Unable to load your campus connections."]); }
