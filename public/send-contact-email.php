<?php
// public/send-contact-email.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get and validate input
$data = json_decode(file_get_contents('php://input'), true);

// Check if this is a contact form submission
if (isset($data['name']) && isset($data['email'])) {
    // CONTACT FORM SUBMISSION
    $name = htmlspecialchars($data['name'] ?? '');
    $email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $subject = htmlspecialchars($data['subject'] ?? 'General Inquiry');
    $message = htmlspecialchars($data['message'] ?? '');
    
    if (!$name || !$email || !$message) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required contact form fields']);
        exit();
    }
    
    // Send to admin
    $to = "admin@nannyplacementssouthafrica.co.za";
    $emailSubject = "Contact Form: {$subject}";
    
    // Format the message
    $formattedMessage = "New Contact Form Submission\n\n";
    $formattedMessage .= "From: {$name}\n";
    $formattedMessage .= "Email: {$email}\n";
    $formattedMessage .= "Subject: {$subject}\n\n";
    $formattedMessage .= "Message:\n";
    $formattedMessage .= wordwrap($message, 70, "\r\n");
    $formattedMessage .= "\n\n---\nThis message was sent via the website contact form.";
    
} else {
    // REGULAR NOTIFICATION EMAIL (from AdminPanel, NannyDashboard, ClientDashboard)
    $to = filter_var($data['to'] ?? '', FILTER_VALIDATE_EMAIL);
    $subject = htmlspecialchars($data['subject'] ?? 'Notification from Nanny Placements SA');
    $message = $data['message'] ?? '';
    
    if (!$to || !$message) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or missing email address or message']);
        exit();
    }
    
    $emailSubject = $subject;
    $formattedMessage = wordwrap($message, 70, "\r\n");
}

// Prepare email
$fromEmail = "admin@nannyplacementssouthafrica.co.za";
$headers  = "From: Nanny Placements SA <{$fromEmail}>\r\n";
$headers .= "Reply-To: {$fromEmail}\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send email
$success = mail($to, $emailSubject, $formattedMessage, $headers);

if ($success) {
    echo json_encode([
        'success' => true, 
        'message' => 'Email sent successfully',
        'to' => $to,
        'subject' => $emailSubject
    ]);
} else {
    error_log("Failed to send email - To: $to, Subject: $emailSubject");
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Failed to send email',
        'note' => 'Check server mail configuration'
    ]);
}
?>