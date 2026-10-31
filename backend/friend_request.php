<?php
require_once "config.php"; require_once "db.php";
if ($_SERVER["REQUEST_METHOD"] !== "POST") { http_response_code(405); echo json_encode(["success"=>false,"message"=>"Only POST requests are allowed."]); exit; }
if (empty($_SESSION["user_id"])) { http_response_code(401); echo json_encode(["success"=>false,"message"=>"Please log in first."]); exit; }
$data=json_decode(file_get_contents("php://input"),true); $me=(int)$_SESSION["user_id"];
$target=filter_var($data["user_id"]??null,FILTER_VALIDATE_INT); $action=$data["action"]??"send";
if (!$target || $target<1 || $target===$me || !in_array($action,["send","accept","decline","cancel"],true)) { http_response_code(400); echo json_encode(["success"=>false,"message"=>"Invalid friend request."]); exit; }
try {
 if ($action==="send") {
  $q=$pdo->prepare("SELECT id,status FROM friend_requests WHERE sender_id=? AND receiver_id=? LIMIT 1"); $q->execute([$me,$target]); $existing=$q->fetch(PDO::FETCH_ASSOC);
  if ($existing && $existing["status"]==="pending") { echo json_encode(["success"=>true,"message"=>"Friend request already sent."]); exit; }
  if ($existing && $existing["status"]==="accepted") { echo json_encode(["success"=>true,"message"=>"You are already connected."]); exit; }
  if ($existing) { $q=$pdo->prepare("UPDATE friend_requests SET status='pending' WHERE id=?"); $q->execute([$existing["id"]]); }
  else { $q=$pdo->prepare("INSERT INTO friend_requests(sender_id,receiver_id) VALUES(?,?)"); $q->execute([$me,$target]); }
 } else {
  $q=$pdo->prepare("SELECT id FROM friend_requests WHERE ".($action==="accept"||$action==="decline"?"receiver_id=? AND sender_id=? AND status='pending'":"sender_id=? AND receiver_id=? AND status='pending'")." LIMIT 1"); $q->execute([$action==="accept"||$action==="decline"?$me:$me,$target]);
  $row=$q->fetch(PDO::FETCH_ASSOC); if (!$row) { http_response_code(404); echo json_encode(["success"=>false,"message"=>"Pending request not found."]); exit; }
  if ($action==="cancel") $q=$pdo->prepare("DELETE FROM friend_requests WHERE id=?");
  else $q=$pdo->prepare("UPDATE friend_requests SET status=? WHERE id=?");
  $action==="cancel" ? $q->execute([$row["id"]]) : $q->execute([$action==="accept"?"accepted":"declined",$row["id"]]);
 }
 echo json_encode(["success"=>true,"message"=>$action==="accept"?"Friend request accepted.":($action==="decline"?"Friend request declined.":($action==="cancel"?"Friend request cancelled.":"Friend request sent."))]);
} catch(PDOException $e) { http_response_code(500); echo json_encode(["success"=>false,"message"=>"Unable to update friend request."]); }
