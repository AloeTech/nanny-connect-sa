<?php
// send-payment-success.php
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
$clientName = trim($data['client_name'] ?? '');
$nannyName = trim($data['nanny_name'] ?? '');
$nannyPhone = trim($data['nanny_phone'] ?? 'Not provided');
$nannyEmail = trim($data['nanny_email'] ?? 'Not provided');
$transactionId = trim($data['transaction_id'] ?? 'N/A');
$amount = trim($data['amount'] ?? '200.00');

// Validate required fields
if (empty($to) || empty($clientName) || empty($nannyName)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields (to, client_name, nanny_name)']);
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

// Email to CLIENT (payment success)
$clientSubject = "Payment Successful - Nanny Contact Details Unlocked";
$clientMessage = "🎉 Congratulations {$clientName}!\n\n";
$clientMessage .= "Your payment of R{$amount} has been processed successfully.\n";
$clientMessage .= "Transaction ID: {$transactionId}\n\n";
$clientMessage .= "✅ **Nanny Contact Details Unlocked:**\n\n";
$clientMessage .= "Nanny: {$nannyName}\n";
$clientMessage .= "Phone: {$nannyPhone}\n";
$clientMessage .= "Email: {$nannyEmail}\n\n";
$clientMessage .= "**Next Steps:**\n";
$clientMessage .= "1. Contact the nanny to introduce yourself\n";
$clientMessage .= "2. Schedule an interview at a convenient time\n";
$clientMessage .= "3. Discuss your family's needs and expectations\n";
$clientMessage .= "4. Verify references and certifications\n\n";
$clientMessage .= "**Tips for a Successful Interview:**\n";
$clientMessage .= "- Be clear about hours, duties, and salary\n";
$clientMessage .= "- Ask about experience with children of similar ages\n";
$clientMessage .= "- Discuss house rules and parenting philosophies\n";
$clientMessage .= "- Ask for references and follow up on them\n\n";
$clientMessage .= "Once you've found the right match, you can proceed with employment contracts.\n\n";
$clientMessage .= "Best regards,\nNanny Placements SA Team\n\n";
$clientMessage .= "---\n";
$clientMessage .= "Need assistance? Contact us: admin@nannyplacementssouthafrica.co.za\n";
$clientMessage .= "Website: https://nannyplacementssouthafrica.co.za";

$successToClient = mail($to, $clientSubject, $clientMessage, $headers, $additional_params);

// Email to ADMIN (notification)
$adminSubject = "💰 Payment Received - Contact Details Unlocked";
$adminMessage = "Payment received successfully:\n\n";
$adminMessage .= "Client: {$clientName}\n";
$adminMessage .= "Nanny: {$nannyName}\n";
$adminMessage .= "Amount: R{$amount}\n";
$adminMessage .= "Transaction ID: {$transactionId}\n";
$adminMessage .= "Date: " . date('Y-m-d H:i:s') . "\n\n";
$adminMessage .= "Nanny contact details have been shared with the client.";

$successToAdmin = mail($adminEmail, $adminSubject, $adminMessage, $headers, $additional_params);

// Also send to nanny if nanny_email is provided and valid
$successToNanny = false;
if (!empty($nannyEmail) && filter_var($nannyEmail, FILTER_VALIDATE_EMAIL) && $nannyEmail !== 'Not provided') {
    $nannySubject = "🎉 Client Payment Received - Contact Details Shared";
    $nannyMessage = "Hello {$nannyName},\n\n";
    $nannyMessage .= "Great news! A client has paid to unlock your contact details.\n\n";
    $nannyMessage .= "Client: {$clientName}\n";
    $nannyMessage .= "Date: " . date('Y-m-d H:i:s') . "\n\n";
    $nannyMessage .= "Your contact details have been shared with the client. \n";
    $nannyMessage .= "They should be contacting you soon to arrange an interview.\n\n";
    $nannyMessage .= "Best regards,\nNanny Placements SA Team";
    
    $successToNanny = mail($nannyEmail, $nannySubject, $nannyMessage, $headers, $additional_params);
}

if ($successToClient) {
    error_log("Payment success email sent to {$to} for client {$clientName}");
    
    echo json_encode([
        'success' => true, 
        'message' => 'Payment success emails sent',
        'client_email_sent' => $successToClient,
        'admin_email_sent' => $successToAdmin,
        'nanny_email_sent' => $successToNanny,
        'nanny_contact_shared' => [
            'phone' => $nannyPhone,
            'email' => $nannyEmail
        ]
    ]);
} else {
    error_log("Failed to send payment success email to {$to}");
    echo json_encode(['success' => false, 'error' => 'Failed to send payment success email']);
}