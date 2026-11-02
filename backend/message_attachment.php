<?php
require_once "config.php";
require_once "db.php";
if (empty($_SESSION["user_id"])) { http_response_code(401); echo json_encode(["success"=>false,"message"=>"Please log in first."]); exit; }
$me=(int)$_SESSION["user_id"];
session_write_close();
function failAttachment($code,$message){http_response_code($code);echo json_encode(["success"=>false,"message"=>$message]);exit;}
function iniBytes($value){$value=trim((string)$value);if($value==="")return 0;$unit=strtolower(substr($value,-1));$number=(float)$value;switch($unit){case "g":$number*=1024;case "m":$number*=1024;case "k":$number*=1024;}return (int)$number;}
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
$contentLength=(int)($_SERVER["CONTENT_LENGTH"]??0);$postLimit=iniBytes(ini_get("post_max_size"));
if($postLimit>0&&$contentLength>$postLimit)failAttachment(413,"This file exceeds the server upload limit. Increase PHP post_max_size and upload_max_filesize, then restart Apache.");
$other=filter_var($_POST["user_id"]??null,FILTER_VALIDATE_INT);
if(!$other||$other===$me)failAttachment(400,"Invalid conversation.");
if(!ensureFriends($pdo,$me,$other))failAttachment(403,"You can share attachments after becoming friends.");
$rawBody=$_POST["body"]??"";$body=is_string($rawBody)?trim($rawBody):"";
if((function_exists("mb_strlen")?mb_strlen($body,"UTF-8"):strlen($body))>4000)failAttachment(400,"Message text must be 4,000 characters or fewer.");
if(empty($_FILES["file"])||!is_array($_FILES["file"]))failAttachment(400,"No file was received. Check that the file is within the server upload limit and try again.");
$file=$_FILES["file"];
if($file["error"]!==UPLOAD_ERR_OK){$uploadErrors=[UPLOAD_ERR_INI_SIZE=>"The file is larger than PHP upload_max_filesize. Increase it and restart Apache.",UPLOAD_ERR_FORM_SIZE=>"The file is larger than the form upload limit.",UPLOAD_ERR_PARTIAL=>"The file upload was interrupted. Please try again.",UPLOAD_ERR_NO_FILE=>"Choose a file to send.",UPLOAD_ERR_NO_TMP_DIR=>"The server upload temporary folder is missing.",UPLOAD_ERR_CANT_WRITE=>"The server could not save the uploaded file.",UPLOAD_ERR_EXTENSION=>"A PHP extension stopped the upload."];failAttachment(in_array($file["error"],[UPLOAD_ERR_INI_SIZE,UPLOAD_ERR_FORM_SIZE],true)?413:400,$uploadErrors[$file["error"]]??"The upload did not complete. Please try again.");}
if(!is_uploaded_file($file["tmp_name"]))failAttachment(400,"The uploaded file could not be verified.");
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
 $q=$pdo->prepare("INSERT INTO messages(sender_id,receiver_id,body,attachment_path,attachment_name,attachment_mime,attachment_size) VALUES(?,?,?,?,?,?,?)");
 $q->execute([$me,$other,$body,$stored,$original,$mime,(int)$file["size"]]);
 echo json_encode(["success"=>true,"message"=>"Attachment sent.","id"=>(int)$pdo->lastInsertId()]);
}catch(PDOException $e){@unlink($dir."/".$stored);error_log("Message attachment insert failed: ".$e->getMessage());failAttachment(500,"Unable to send the attachment.");}
