<?php
require_once "config.php";
require_once "db.php";
if (empty($_SESSION["user_id"])) { http_response_code(401); echo json_encode(["success"=>false,"message"=>"Please log in first."]); exit; }
$me=(int)$_SESSION["user_id"];
session_write_close();
function failAttachment($code,$message){http_response_code($code);echo json_encode(["success"=>false,"message"=>$message]);exit;}
function ensureFriends($pdo,$me,$other){
 $q=$pdo->prepare("SELECT id FROM friend_requests WHERE status='accepted' AND ((sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)) LIMIT 1");
 $q->execute([$me,$other,$other,$me]); return (bool)$q->fetchColumn();
}
if($_SERVER["REQUEST_METHOD"]==="GET"){
 $id=filter_input(INPUT_GET,"id",FILTER_VALIDATE_INT);
 if(!$id)failAttachment(400,"Invalid attachment.");
 try{
  $q=$pdo->prepare("SELECT sender_id,receiver_id,attachment_path,attachment_name,attachment_mime FROM messages WHERE id=? AND (sender_id=? OR receiver_id=?) AND attachment_path IS NOT NULL LIMIT 1");
  $q->execute([$id,$me,$me]);$row=$q->fetch(PDO::FETCH_ASSOC);
  if(!$row)failAttachment(404,"Attachment not found.");
  $path=__DIR__."/uploads/messages/".$row["attachment_path"];
  if(!is_file($path))failAttachment(404,"This attachment is no longer available.");
  $mime=$row["attachment_mime"] ?: "application/octet-stream";
  $name=str_replace(["\r","\n",'"'],["","",""],$row["attachment_name"] ?: "attachment");
  header_remove("Content-Type");header("Content-Type: ".$mime);header("Content-Length: ".filesize($path));
  header("Content-Disposition: ".(strpos($mime,"image/")===0?"inline":"attachment")."; filename*=UTF-8''".rawurlencode($name));
  header("X-Content-Type-Options: nosniff");readfile($path);exit;
 }catch(PDOException $e){failAttachment(500,"Unable to load attachment.");}
}
if($_SERVER["REQUEST_METHOD"]!=="POST")failAttachment(405,"Method not allowed.");
$other=filter_var($_POST["user_id"]??null,FILTER_VALIDATE_INT);
if(!$other||$other===$me)failAttachment(400,"Invalid conversation.");
if(!ensureFriends($pdo,$me,$other))failAttachment(403,"You can share attachments after becoming friends.");
if(empty($_FILES["file"])||!is_uploaded_file($_FILES["file"]["tmp_name"]))failAttachment(400,"Choose a file to send.");
$file=$_FILES["file"];
if($file["error"]!==UPLOAD_ERR_OK)failAttachment(400,"The upload did not complete. Please try again.");
$max=10*1024*1024;
if($file["size"]<1||$file["size"]>$max)failAttachment(413,"Files must be 10 MB or smaller.");
$finfo=new finfo(FILEINFO_MIME_TYPE);$mime=$finfo->file($file["tmp_name"]);
$allowed=[
 "image/jpeg"=>"jpg","image/png"=>"png","image/webp"=>"webp","image/gif"=>"gif",
 "application/pdf"=>"pdf","text/plain"=>"txt",
 "application/msword"=>"doc",
 "application/vnd.openxmlformats-officedocument.wordprocessingml.document"=>"docx",
 "application/vnd.ms-excel"=>"xls",
 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"=>"xlsx",
 "application/vnd.ms-powerpoint"=>"ppt",
 "application/vnd.openxmlformats-officedocument.presentationml.presentation"=>"pptx"
];
if(!isset($allowed[$mime]))failAttachment(415,"Supported files: photos, PDF, Word, Excel, PowerPoint, and text files.");
if(strpos($mime,"image/")===0&&@getimagesize($file["tmp_name"])===false)failAttachment(415,"That image file is not valid.");
$original=basename($file["name"]);$original=preg_replace('/[^\pL\pN ._()-]/u','_', $original);$original=substr($original,0,180);
$stored=bin2hex(random_bytes(20)).".".$allowed[$mime];$dir=__DIR__."/uploads/messages";
if(!is_dir($dir)&&!mkdir($dir,0750,true)&&!is_dir($dir))failAttachment(500,"Unable to prepare secure file storage.");
if(!move_uploaded_file($file["tmp_name"],$dir."/".$stored))failAttachment(500,"Unable to save the attachment.");
try{
 $q=$pdo->prepare("INSERT INTO messages(sender_id,receiver_id,body,attachment_path,attachment_name,attachment_mime,attachment_size) VALUES(?,?, '',?,?,?,?)");
 $q->execute([$me,$other,$stored,$original,$mime,(int)$file["size"]]);
 echo json_encode(["success"=>true,"message"=>"Attachment sent.","id"=>(int)$pdo->lastInsertId()]);
}catch(PDOException $e){@unlink($dir."/".$stored);error_log("Message attachment insert failed: ".$e->getMessage());failAttachment(500,"Unable to send the attachment.");}
