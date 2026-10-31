
<?php

// Allow the React app on your laptop and mobile phone
$allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://10.0.9.203:5173"
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
}

header("Vary: Origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle browser preflight requests
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// Start the PHP login session
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        "lifetime" => 0,
        "path" => "/",
        "secure" => false,
        "httponly" => true,
        "samesite" => "Lax"
    ]);

    session_start();
}
