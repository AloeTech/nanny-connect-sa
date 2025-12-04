<?php
// public/send-contact-email.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
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

// Get input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit();
}

// Extract data
$to = filter_var($data['to'] ?? '', FILTER_VALIDATE_EMAIL);
$subject = htmlspecialchars($data['subject'] ?? 'Notification from Nanny Placements SA');
$message = $data['message'] ?? '';

// Validate
if (!$to || !$message) {
    echo json_encode([
        'success' => false, 
        'error' => 'Missing required fields',
        'received' => $data
    ]);
    exit();
}

// Prepare email
$from = "admin@nannyplacementssouthafrica.co.za";
$headers = "From: Nanny Placements SA <$from>\r\n";
$headers .= "Reply-To: $from\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Try to send
try {
    $success = mail($to, $subject, $message, $headers);
    
    if ($success) {
        // Log success
        error_log("Email sent to: $to, Subject: $subject");
        
        echo json_encode([
            'success' => true,
            'message' => 'Email sent successfully'
        ]);
    } else {
        // Log failure
        error_log("Failed to send email to: $to, Subject: $subject");
        
        echo json_encode([
            'success' => false,
            'error' => 'Server mail function failed',
            'note' => 'Check server mail logs'
        ]);
    }
} catch (Exception $e) {
    error_log("Email exception: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'error' => 'Exception: ' . $e->getMessage()
    ]);
}
?>