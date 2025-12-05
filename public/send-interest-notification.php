<?php
// send-interest-notification.php
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

// Extract fields - flexible for different notification types
$to = trim($data['to'] ?? '');
$subject = trim($data['subject'] ?? 'New Interest Notification');
$nannyName = trim($data['nanny_name'] ?? '');
$clientName = trim($data['client_name'] ?? '');
$clientMessage = trim($data['client_message'] ?? '');
$customMessage = trim($data['message'] ?? '');

// Validate required fields
if (empty($to) || empty($nannyName) || empty($clientName)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields (to, nanny_name, client_name)']);
    exit();
}

// Recipient emails - also send to admin
$adminEmail = "admin@nannyplacementssouthafrica.co.za";

// Build email messages
if (!empty($customMessage)) {
    // Use custom message if provided
    $emailMessage = $customMessage;
} else {
    // Default interest notification message
    $emailMessage = "Hello {$nannyName},\n\n";
    $emailMessage .= "You have received a new interest request from a client.\n\n";
    $emailMessage .= "Client: {$clientName}\n";
    if (!empty($clientMessage)) {
        $emailMessage .= "Client Message: \"{$clientMessage}\"\n\n";
    }
    $emailMessage .= "Please log in to your nanny dashboard to approve or decline this request.\n\n";
    $emailMessage .= "Best regards,\nNanny Placements SA Team";
}

// Email to nanny
$from = "admin@nannyplacementssouthafrica.co.za";
$headers  = "From: Nanny Placements SA <{$from}>\r\n";
$headers .= "Reply-To: {$from}\r\n";
$headers .= "Return-Path: {$from}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$additional_params = "-f {$from}";

// Send to nanny
$successToNanny = mail($to, $subject, $emailMessage, $headers, $additional_params);

// Also send notification to admin
$adminSubject = "New Interest: {$clientName} interested in {$nannyName}";
$adminMessage = "New interest notification sent:\n\n";
$adminMessage .= "Nanny: {$nannyName}\n";
$adminMessage .= "Client: {$clientName}\n";
$adminMessage .= "Client Message: {$clientMessage}\n";
$adminMessage .= "Time: " . date('Y-m-d H:i:s');

$successToAdmin = mail($adminEmail, $adminSubject, $adminMessage, $headers, $additional_params);

if ($successToNanny) {
    error_log("Interest notification sent to {$to} for nanny {$nannyName}");
    
    // Also send confirmation to client if client_email is provided
    if (!empty($data['client_email'])) {
        $clientEmail = trim($data['client_email']);
        $clientSubject = "Interest Submitted - Nanny Placements SA";
        $clientMessage = "Hello {$clientName},\n\n";
        $clientMessage .= "You have successfully expressed interest in {$nannyName}.\n\n";
        $clientMessage .= "Your message: \"{$clientMessage}\"\n\n";
        $clientMessage .= "The nanny will review your interest and respond soon.\n\n";
        $clientMessage .= "Best regards,\nNanny Placements SA Team";
        
        mail($clientEmail, $clientSubject, $clientMessage, $headers, $additional_params);
    }
    
    echo json_encode([
        'success' => true, 
        'message' => 'Interest notification sent successfully',
        'nanny_email_sent' => $successToNanny,
        'admin_email_sent' => $successToAdmin
    ]);
} else {
    error_log("Failed to send interest notification to {$to}");
    echo json_encode(['success' => false, 'error' => 'Failed to send interest notification email']);
}