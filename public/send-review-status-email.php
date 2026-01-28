<?php
// send-review-status-email.php
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

// Extract fields
$to = trim($data['to'] ?? '');
$recipientName = trim($data['client_name'] ?? $data['nanny_name'] ?? 'Recipient');
$subject = trim($data['subject'] ?? 'Update on Your Feedback - Nanny Placements SA');
$type = trim($data['type'] ?? 'review'); // 'review' or 'complaint'
$status = trim($data['status'] ?? 'resolved'); // 'resolved', 'dismissed', 'pending'
$adminMessage = trim($data['admin_message'] ?? '');
$nannyName = trim($data['nanny_name'] ?? 'the nanny/cleaner');
$clientName = trim($data['client_name'] ?? 'the client');
$rating = isset($data['rating']) ? intval($data['rating']) : null;

// Validate required fields
if (empty($to)) {
    echo json_encode(['success' => false, 'error' => 'Recipient email (to) is required']);
    exit();
}
if (empty($recipientName)) {
    echo json_encode(['success' => false, 'error' => 'Recipient name is required']);
    exit();
}

// Determine if recipient is client or nanny
$isClient = isset($data['client_name']) && $recipientName === $data['client_name'];

// Build subject if not provided
if (!isset($data['subject'])) {
    if ($isClient) {
        $subject = "Update on Your {$type} - Nanny Placements SA";
    } else {
        $subject = "Update on Client {$type} - Nanny Placements SA";
    }
}

// Build appropriate salutation
$salutation = "Dear {$recipientName},\n\n";

// Build status-specific message
$statusMessages = [
    'resolved' => "We have reviewed and resolved the {$type} you submitted.",
    'dismissed' => "We have reviewed the {$type} you submitted and determined it does not require further action.",
    'pending' => "We have received your {$type} and it is currently under review.",
    'archived' => "The {$type} you submitted has been archived for record-keeping purposes."
];

$statusMessage = $statusMessages[$status] ?? "We have updated the status of your {$type}.";

// Build email content
$message = "{$salutation}";
$message .= "{$statusMessage}\n\n";

if ($isClient) {
    $message .= "Your {$type} regarding {$nannyName} has been marked as: **" . strtoupper($status) . "**\n\n";
    
    if ($rating !== null) {
        $stars = str_repeat('★', $rating) . str_repeat('☆', 5 - $rating);
        $message .= "Your Rating: {$stars} ({$rating}/5)\n\n";
    }
} else {
    $message .= "A client {$type} from {$clientName} has been marked as: **" . strtoupper($status) . "**\n\n";
    
    if ($rating !== null) {
        $stars = str_repeat('★', $rating) . str_repeat('☆', 5 - $rating);
        $message .= "Client's Rating: {$stars} ({$rating}/5)\n\n";
    }
}

// Add admin message if provided
if (!empty($adminMessage)) {
    $message .= "Admin Response:\n";
    $message .= "----------------------------------------\n";
    $message .= $adminMessage . "\n";
    $message .= "----------------------------------------\n\n";
}

// Add closing
$message .= "This is an automated notification from Nanny Placements SA.\n\n";

if ($isClient) {
    $message .= "Thank you for your feedback. It helps us maintain our quality standards.\n\n";
} else {
    $message .= "Please review this information for your professional development.\n\n";
}

$message .= "If you have any questions, please contact our support team.\n\n";
$message .= "Best regards,\n";
$message .= "Nanny Placements SA Admin Team\n";
$message .= "admin@nannyplacementssouthafrica.co.za\n";
$message .= "https://nannyplacementssouthafrica.co.za";

// Email headers
$headers = "From: Nanny Placements SA <admin@nannyplacementssouthafrica.co.za>\r\n";
$headers .= "Reply-To: admin@nannyplacementssouthafrica.co.za\r\n";
$headers .= "Return-Path: admin@nannyplacementssouthafrica.co.za\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$additional_params = "-f admin@nannyplacementssouthafrica.co.za";

// Send the email
$success = mail($to, $subject, $message, $headers, $additional_params);

if ($success) {
    error_log("Review status email sent to {$to} for {$type} (Status: {$status})");
    echo json_encode([
        'success' => true,
        'message' => 'Email sent successfully'
    ]);
} else {
    error_log("Failed to send review status email to {$to}");
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send email'
    ]);
}
?>