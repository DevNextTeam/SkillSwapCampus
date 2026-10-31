<?php
require_once "config.php"; require_once "db.php";
if ($_SERVER["REQUEST_METHOD"] !== "POST") { http_response_code(405); echo json_encode(["success"=>false,"message"=>"Only POST requests are allowed."]); exit; }
if (empty($_SESSION["user_id"])) { http_response_code(401); echo json_encode(["success"=>false,"message"=>"Please log in first."]); exit; }
if (!isset($_FILES["photo"]) || $_FILES["photo"]["error"] !== UPLOAD_ERR_OK) { http_response_code(400); echo json_encode(["success"=>false,"message"=>"Choose a photo to upload."]); exit; }
$file=$_FILES["photo"];
if ($file["size"] > 3*1024*1024) { http_response_code(400); echo json_encode(["success"=>false,"message"=>"Photo must be 3 MB or smaller."]); exit; }
$finfo=new finfo(FILEINFO_MIME_TYPE); $mime=$finfo->file($file["tmp_name"]);
$extensions=["image/jpeg"=>"jpg","image/png"=>"png","image/webp"=>"webp"];
if (!isset($extensions[$mime]) || @getimagesize($file["tmp_name"])===false) { http_response_code(400); echo json_encode(["success"=>false,"message"=>"Use a valid JPG, PNG, or WebP image."]); exit; }
$directory=__DIR__."/uploads/profiles";
if (!is_dir($directory) && !mkdir($directory,0755,true)) { http_response_code(500); echo json_encode(["success"=>false,"message"=>"Photo storage is unavailable."]); exit; }
$filename=bin2hex(random_bytes(16)).".".$extensions[$mime]; $destination=$directory."/".$filename;
if (!move_uploaded_file($file["tmp_name"],$destination)) { http_response_code(500); echo json_encode(["success"=>false,"message"=>"Unable to save your photo."]); exit; }
try {
 $q=$pdo->prepare("SELECT profile_photo FROM users WHERE id=?"); $q->execute([$_SESSION["user_id"]]); $old=$q->fetchColumn();
 $photo="uploads/profiles/".$filename; $q=$pdo->prepare("UPDATE users SET profile_photo=? WHERE id=?"); $q->execute([$photo,$_SESSION["user_id"]]);
 if ($old && strpos($old,"uploads/profiles/")===0) { $oldPath=__DIR__."/".$old; if (is_file($oldPath)) @unlink($oldPath); }
 $q=$pdo->prepare("SELECT id,full_name,email,university,course,year_level,bio,profile_photo FROM users WHERE id=?"); $q->execute([$_SESSION["user_id"]]);
 echo json_encode(["success"=>true,"message"=>"Profile photo updated.","user"=>$q->fetch(PDO::FETCH_ASSOC)]);
} catch(PDOException $e) { @unlink($destination); http_response_code(500); echo json_encode(["success"=>false,"message"=>"Unable to update your profile photo."]); }
