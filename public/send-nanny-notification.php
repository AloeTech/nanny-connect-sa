<?php
// send-nanny-notification.php
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
$subject = trim($data['subject'] ?? 'Notification - Nanny Placements SA');
$nannyName = trim($data['nanny_name'] ?? '');
$notificationType = trim($data['notification_type'] ?? '');
$message = trim($data['message'] ?? '');
$documentType = trim($data['document_type'] ?? '');
$badgeType = trim($data['badge_type'] ?? '');

// Validate required fields
if (empty($to) || empty($nannyName)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields (to, nanny_name)']);
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

// Create email message based on notification type
$emailMessage = "Hi {$nannyName},\n\n";

if ($notificationType === 'document_approved') {
    $emailMessage .= "✅ Great news! Your {$documentType} has been reviewed and approved by the admin.\n\n";
    $emailMessage .= "This document is now marked as approved in your profile.\n";
} else if ($notificationType === 'profile_approved') {
    $emailMessage .= "🎉 Congratulations! Your profile has been approved and is now visible to clients.\n\n";
    $emailMessage .= "Clients can now view your profile and express interest in your services.\n";
} else if ($notificationType === 'badge_updated') {
    $emailMessage .= "🎖️ Your {$badgeType} training badge has been updated by the admin.\n\n";
    $emailMessage .= "This badge is now visible on your profile.\n";
} else if ($notificationType === 'profile_updated') {
    $emailMessage .= "Your profile status has been updated by the admin.\n\n";
}

// Add custom message if provided
if (!empty($message)) {
    $emailMessage .= "\n{$message}\n\n";
}

$emailMessage .= "You can log in to your dashboard to view your updated profile status.\n\n";
$emailMessage .= "Best regards,\nNanny Placements SA Team\n\n";
$emailMessage .= "---\n";
$emailMessage .= "Need assistance? Contact us: admin@nannyplacementssouthafrica.co.za";

// Send email to nanny
$successToNanny = mail($to, $subject, $emailMessage, $headers, $additional_params);

// Send notification to admin
$adminSubject = "📋 Admin Action: {$notificationType} - {$nannyName}";
$adminMessage = "Admin notification action completed:\n\n";
$adminMessage .= "Nanny: {$nannyName}\n";
$adminMessage .= "Email: {$to}\n";
$adminMessage .= "Action Type: {$notificationType}\n";
$adminMessage .= "Date: " . date('Y-m-d H:i:s') . "\n\n";
if (!empty($documentType)) $adminMessage .= "Document: {$documentType}\n";
if (!empty($badgeType)) $adminMessage .= "Badge: {$badgeType}\n";

$successToAdmin = mail($adminEmail, $adminSubject, $adminMessage, $headers, $additional_params);

if ($successToNanny) {
    error_log("Nanny notification email sent to {$to} - Type: {$notificationType}");
    
    echo json_encode([
        'success' => true, 
        'message' => 'Nanny notification email sent successfully',
        'notification_type' => $notificationType,
        'emails_sent' => [
            'nanny' => $successToNanny,
            'admin' => $successToAdmin
        ]
    ]);
} else {
    error_log("Failed to send nanny notification email to {$to}");
    echo json_encode(['success' => false, 'error' => 'Failed to send nanny notification email']);
}