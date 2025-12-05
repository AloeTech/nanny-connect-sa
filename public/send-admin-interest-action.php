<?php
// send-admin-interest-action.php
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
$to = trim($data['to'] ?? '');
$subject = trim($data['subject'] ?? 'Admin Action - Nanny Placements SA');
$action = trim($data['action'] ?? ''); // 'approve' or 'decline'
$recipientType = trim($data['recipient_type'] ?? ''); // 'client' or 'nanny'
$clientName = trim($data['client_name'] ?? '');
$nannyName = trim($data['nanny_name'] ?? '');
$adminMessage = trim($data['admin_message'] ?? '');

// Validate required fields
if (empty($to) || empty($action) || empty($recipientType)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields (to, action, recipient_type)']);
    exit();
}

// Recipients
$adminEmail = "admin@nannyplacementssouthafrica.co.za";
$from = "admin@nannyplacementssouthafrica.co.za";

// Headers
$headers  = "From: Nanny Placements SA <{$from}>\r\n";
$headers .= "Reply-To: {$from}\r\n";
$headers .= "Return-Path: {$from}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$additional_params = "-f {$from}";

// Determine response status
$actionText = $action === 'approve' ? 'APPROVED' : 'DECLINED';
$actionVerb = $action === 'approve' ? 'approved' : 'declined';

// Create email message based on recipient type
$message = '';
if ($recipientType === 'client') {
    $message = "Hi {$clientName},\n\n";
    $message .= "Your interest request for {$nannyName} has been {$actionVerb} by the admin.\n\n";
    
    if (!empty($adminMessage)) {
        $message .= "Admin's message: \"{$adminMessage}\"\n\n";
    }
    
    if ($action === 'approve') {
        $message .= "Next Steps:\n";
        $message .= "1. The nanny has been notified of your interest\n";
        $message .= "2. Wait for the nanny to respond to your request\n";
        $message .= "3. If the nanny approves, you can proceed with payment\n\n";
    } else {
        $message .= "Don't be discouraged! There are many other qualified nannies available.\n";
        $message .= "Feel free to browse our platform and express interest in other nannies.\n\n";
    }
} else if ($recipientType === 'nanny') {
    $message = "Hi {$nannyName},\n\n";
    $message .= "The interest request from {$clientName} has been {$actionVerb} by the admin on your behalf.\n\n";
    
    if (!empty($adminMessage)) {
        $message .= "Admin's message: \"{$adminMessage}\"\n\n";
    }
    
    if ($action === 'approve') {
        $message .= "The client has been notified and will be waiting for your response.\n";
        $message .= "Please log in to your dashboard to review and respond to this interest request.\n\n";
    } else {
        $message .= "The client has been notified of this decision.\n";
        $message .= "You can focus on other client interest requests.\n\n";
    }
}

$message .= "Best regards,\nNanny Placements SA Team\n\n";
$message .= "---\n";
$message .= "Need assistance? Contact us: admin@nannyplacementssouthafrica.co.za";

// Send email
$success = mail($to, $subject, $message, $headers, $additional_params);

if ($success) {
    error_log("Admin interest action email sent to {$to} - Action: {$actionText}, Recipient: {$recipientType}");
    
    echo json_encode([
        'success' => true, 
        'message' => 'Admin interest action email sent successfully',
        'action' => $actionText,
        'recipient' => $recipientType
    ]);
} else {
    error_log("Failed to send admin interest action email to {$to}");
    echo json_encode(['success' => false, 'error' => 'Failed to send admin interest action email']);
}