<?php

// Environment configuration keeps local XAMPP easy to run while requiring
// explicit settings when the application is deployed.
$appEnv = getenv("APP_ENV") ?: "development";
$isProduction = $appEnv === "production";

$defaultDevelopmentOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://10.0.9.203:5173"
];
$configuredOrigins = getenv("APP_ALLOWED_ORIGINS");
$allowedOrigins = $configuredOrigins !== false && trim($configuredOrigins) !== ""
    ? array_values(array_filter(array_map("trim", explode(",", $configuredOrigins))))
    : ($isProduction ? [] : $defaultDevelopmentOrigins);

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";
if ($origin !== "" && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, private, max-age=0");
header("Pragma: no-cache");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("Referrer-Policy: strict-origin-when-cross-origin");
header("Permissions-Policy: camera=(), microphone=(), geolocation=()");

// Preflight requests must be answered before session startup.
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    if ($origin !== "" && !in_array($origin, $allowedOrigins, true)) {
        http_response_code(403);
        exit;
    }
    http_response_code(204);
    exit;
}

// Reject browser-originated state changes from origins not explicitly trusted.
// The custom header forces cross-origin browser requests to pass CORS preflight;
// ordinary HTML forms cannot attach it.
$requestMethod = $_SERVER["REQUEST_METHOD"] ?? "GET";
if (in_array($requestMethod, ["POST", "PUT", "PATCH", "DELETE"], true)) {
    if ($origin !== "" && !in_array($origin, $allowedOrigins, true)) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Request origin is not allowed."]);
        exit;
    }
    if (($_SERVER["HTTP_X_REQUESTED_WITH"] ?? "") !== "XMLHttpRequest") {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Invalid request. Please refresh and try again."]);
        exit;
    }
}

// Harden PHP's session handling before starting the session.
ini_set("session.use_strict_mode", "1");
ini_set("session.use_only_cookies", "1");
ini_set("session.use_trans_sid", "0");

if (session_status() === PHP_SESSION_NONE) {
    $isHttps = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off")
        || (($_SERVER["HTTP_X_FORWARDED_PROTO"] ?? "") === "https");

    session_set_cookie_params([
        "lifetime" => 0,
        "path" => "/",
        "secure" => $isHttps,
        "httponly" => true,
        "samesite" => "Lax"
    ]);

    session_start();
}
