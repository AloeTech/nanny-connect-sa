<?php
// send-nanny-interest-response.php
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
$subject = trim($data['subject'] ?? 'Nanny Interest Response - Nanny Placements SA');
$clientName = trim($data['client_name'] ?? '');
$nannyName = trim($data['nanny_name'] ?? '');
$response = trim($data['response'] ?? ''); // 'approved' or 'declined'
$nannyResponseMessage = trim($data['nanny_response_message'] ?? '');
$date = trim($data['date'] ?? date('Y-m-d'));

// Validate required fields
if (empty($to) || empty($clientName) || empty($nannyName) || empty($response)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields (to, client_name, nanny_name, response)']);
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

// Determine response status text
$responseText = $response === 'approved' ? 'APPROVED' : 'DECLINED';
$actionText = $response === 'approved' ? 'approved' : 'declined';

// Email to CLIENT
$clientSubject = "Interest Request {$responseText} - Nanny Placements SA";
$clientMessage = "Hi {$clientName},\n\n";

if ($response === 'approved') {
    $clientMessage .= "🎉 Great news! Your interest request for {$nannyName} has been {$actionText}!\n\n";
    $clientMessage .= "{$nannyName} has reviewed your request and is interested in connecting with you.\n\n";
    $clientMessage .= "**Next Steps:**\n";
    $clientMessage .= "1. Log in to your dashboard\n";
    $clientMessage .= "2. Complete the payment to unlock {$nannyName}'s contact details\n";
    $clientMessage .= "3. Once payment is complete, you'll receive {$nannyName}'s phone number and email\n";
    $clientMessage .= "4. Contact {$nannyName} directly to schedule an interview\n\n";
    
    if (!empty($nannyResponseMessage)) {
        $clientMessage .= "**Message from {$nannyName}:**\n";
        $clientMessage .= "\"{$nannyResponseMessage}\"\n\n";
    }
    
    $clientMessage .= "We're excited to help you find the perfect match for your family!\n\n";
} else {
    $clientMessage .= "We regret to inform you that your interest request for {$nannyName} has been {$actionText}.\n\n";
    
    if (!empty($nannyResponseMessage)) {
        $clientMessage .= "**Message from {$nannyName}:**\n";
        $clientMessage .= "\"{$nannyResponseMessage}\"\n\n";
    }
    
    $clientMessage .= "Don't be discouraged! There are many other qualified nannies available.\n";
    $clientMessage .= "Feel free to browse our platform and express interest in other nannies that match your needs.\n\n";
    
    $clientMessage .= "**Tips for Success:**\n";
    $clientMessage .= "- Personalize your interest message\n";
    $clientMessage .= "- Be clear about your requirements\n";
    $clientMessage .= "- Consider adjusting your filters for more options\n\n";
}

$clientMessage .= "Best regards,\nNanny Placements SA Team\n\n";
$clientMessage .= "---\n";
$clientMessage .= "Need assistance? Contact us: admin@nannyplacementssouthafrica.co.za";

$successToClient = mail($to, $clientSubject, $clientMessage, $headers, $additional_params);

// Email to ADMIN (notification)
$adminSubject = "👤 Nanny Interest Response - {$responseText}";
$adminMessage = "Nanny interest response processed:\n\n";
$adminMessage .= "Date: {$date}\n";
$adminMessage .= "Nanny: {$nannyName}\n";
$adminMessage .= "Client: {$clientName}\n";
$adminMessage .= "Response: {$responseText}\n";
$adminMessage .= "Client Email: {$to}\n\n";

if (!empty($nannyResponseMessage)) {
    $adminMessage .= "Nanny's Message: \"{$nannyResponseMessage}\"\n\n";
}

$adminMessage .= "This response has been automatically sent to the client.";

$successToAdmin = mail($adminEmail, $adminSubject, $adminMessage, $headers, $additional_params);

if ($successToClient) {
    error_log("Nanny interest response email sent to {$to} - Response: {$responseText}");
    
    echo json_encode([
        'success' => true, 
        'message' => 'Interest response email sent successfully',
        'response' => $responseText,
        'client_email_sent' => $successToClient,
        'admin_email_sent' => $successToAdmin
    ]);
} else {
    error_log("Failed to send nanny interest response email to {$to}");
    echo json_encode(['success' => false, 'error' => 'Failed to send interest response email']);
}