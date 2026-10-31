<?php
require_once "config.php"; require_once "db.php";
if (empty($_SESSION["user_id"])) { http_response_code(401); echo json_encode(["success"=>false,"message"=>"Please log in first."]); exit; }
$me=(int)$_SESSION["user_id"];
if ($_SERVER["REQUEST_METHOD"]==="GET") {
 $other=filter_input(INPUT_GET,"user_id",FILTER_VALIDATE_INT);
 if (!$other || $other===$me) { http_response_code(400); echo json_encode(["success"=>false,"message"=>"Invalid conversation."]); exit; }
 try {
  $q=$pdo->prepare("SELECT id FROM friend_requests WHERE status='accepted' AND ((sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)) LIMIT 1"); $q->execute([$me,$other,$other,$me]);
  if (!$q->fetch()) { http_response_code(403); echo json_encode(["success"=>false,"message"=>"You can message students after becoming friends."]); exit; }
  $q=$pdo->prepare("SELECT id,sender_id,receiver_id,body,created_at,read_at FROM messages WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY id DESC LIMIT 100");
  $q->execute([$me,$other,$other,$me]); $messages=array_reverse($q->fetchAll(PDO::FETCH_ASSOC));
  $q=$pdo->prepare("UPDATE messages SET read_at=NOW() WHERE sender_id=? AND receiver_id=? AND read_at IS NULL"); $q->execute([$other,$me]);
  echo json_encode(["success"=>true,"messages"=>$messages]);
 } catch(PDOException $e) { http_response_code(500); echo json_encode(["success"=>false,"message"=>"Unable to load messages."]); }
 exit;
}
if ($_SERVER["REQUEST_METHOD"]!=="POST") { http_response_code(405); echo json_encode(["success"=>false,"message"=>"Method not allowed."]); exit; }
$data=json_decode(file_get_contents("php://input"),true) ?: []; $other=filter_var($data["user_id"]??null,FILTER_VALIDATE_INT); $rawBody=$data["body"]??""; $body=is_string($rawBody)?trim($rawBody):"";
if (!$other || $other===$me || $body==="" || (function_exists("mb_strlen") ? mb_strlen($body) : strlen($body))>4000) { http_response_code(400); echo json_encode(["success"=>false,"message"=>"Enter a message of up to 4,000 characters."]); exit; }
try {
 $q=$pdo->prepare("SELECT id FROM friend_requests WHERE status='accepted' AND ((sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)) LIMIT 1"); $q->execute([$me,$other,$other,$me]);
 if (!$q->fetch()) { http_response_code(403); echo json_encode(["success"=>false,"message"=>"You can message students after becoming friends."]); exit; }
 $q=$pdo->prepare("INSERT INTO messages(sender_id,receiver_id,body) VALUES(?,?,?)"); $q->execute([$me,$other,$body]);
 echo json_encode(["success"=>true,"message"=>"Message sent.","id"=>$pdo->lastInsertId()]);
} catch(PDOException $e) { http_response_code(500); echo json_encode(["success"=>false,"message"=>"Unable to send message."]); }
