<?php
// send-review-notification.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Read JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit();
}

// Extract fields (all optional except to and client info)
$to               = 'admin@nannyplacementssouthafrica.co.za'; // Fixed admin email
$from             = 'admin@nannyplacementssouthafrica.co.za';
$clientName       = trim($data['client_name'] ?? 'Unknown Client');
$clientEmail      = trim($data['client_email'] ?? 'unknown@email.com');
$cleanerName      = trim($data['cleaner_name'] ?? 'Unknown Cleaner');
$rating           = intval($data['rating'] ?? 0);
$complaint        = trim($data['complaint'] ?? '');

// Validate required fields
if ($rating < 1 || $rating > 5) {
    echo json_encode(['success' => false, 'error' => 'Invalid rating (must be 1–5)']);
    exit();
}
if (empty($clientName) || empty($clientEmail) || empty($cleanerName)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields (client_name, client_email, cleaner_name)']);
    exit();
}

// Build email subject
$subject = "New Review/Complaint - Rating {$rating}/5 for {$cleanerName}";

// Build email message (plain text for reliability)
$message = "New Review/Complaint Received\n";
$message .= "----------------------------------------\n";
$message .= "Date: " . date('Y-m-d H:i:s') . "\n";
$message .= "From Client: {$clientName} ({$clientEmail})\n";
$message .= "Cleaner: {$cleanerName}\n";
$message .= "Rating: {$rating} out of 5 stars\n\n";

if (!empty($complaint)) {
    $message .= "Complaint / Feedback:\n";
    $message .= $complaint . "\n\n";
} else {
    $message .= "No additional comments provided.\n\n";
}

$message .= "This is an automated notification from Nanny Placements SA.\n";
$message .= "Please review in the admin dashboard.\n\n";
$message .= "Best regards,\nNanny Placements SA System";

// Email headers
$headers  = "From: Nanny Placements SA <{$from}>\r\n";
$headers .= "Reply-To: {$clientEmail}\r\n";
$headers .= "Return-Path: {$from}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$additional_params = "-f {$from}";

// Send the email
$success = mail($to, $subject, $message, $headers, $additional_params);

if ($success) {
    error_log("Review notification email sent to admin for client {$clientName} → cleaner {$cleanerName} (Rating: {$rating})");
    echo json_encode([
        'success' => true,
        'message' => 'Review/complaint notification sent to admin successfully'
    ]);
} else {
    error_log("Failed to send review notification email to admin for client {$clientName}");
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send review notification email'
    ]);
}