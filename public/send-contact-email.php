<?php
// send-contact-email.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit();
}

// Extract fields
$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$userSubject = trim($data['subject'] ?? '');
$userMessage = trim($data['message'] ?? '');

// Validate
if (empty($name) || empty($email) || empty($userMessage)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit();
}

// Recipient
$to = "admin@nannyplacementssouthafrica.co.za";

// Build email message
$message = "New Contact Form Submission:\n\n";
$message .= "Name: {$name}\n";
$message .= "Email: {$email}\n";
$message .= "Subject: {$userSubject}\n\n";
$message .= "Message:\n{$userMessage}\n";

// Email subject
$subject = !empty($userSubject) ? htmlspecialchars($userSubject) : "Website Contact Form";

// Headers
$from = "admin@nannyplacementssouthafrica.co.za";
$headers  = "From: Nanny Placements SA <{$from}>\r\n";
$headers .= "Reply-To: {$email}\r\n"; // reply goes to user
$headers .= "Return-Path: {$from}\r\n"; // Afrihost requires
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Envelope sender
$additional_params = "-f {$from}";

// Send mail
$success = mail($to, $subject, $message, $headers, $additional_params);

if ($success) {
    error_log("Email sent to $to from $email");
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
} else {
    error_log("Email sending failed to $to from $email");
    echo json_encode(['success' => false, 'error' => 'Mail function failed. Check Track Delivery']);
}
