import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, AlertTriangle } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <FileText className="w-12 h-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">Terms of Service</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using Nanny Placements SA services
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Last updated: January 26, 2025</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Acceptance of Terms */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Nanny Placements SA ("the Platform"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">2. Service Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Nanny Placements SA is a platform that connects families with qualified nannies. Our services include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Nanny profile verification and background checks</li>
                <li>Foundational training through our Nanny Academy</li>
                <li>Matching services between families and nannies</li>
                <li>Payment processing for placement fees</li>
                <li>Ongoing support and mediation services</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">3. User Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold text-foreground mb-3">For Families (Clients)</h4>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide accurate information about your household and requirements</li>
                  <li>Treat nannies with respect and professionalism</li>
                  <li>Comply with all applicable employment laws and regulations</li>
                  <li>Pay agreed-upon wages and benefits promptly</li>
                  <li>Provide a safe working environment</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">For Nannies</h4>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide accurate personal and professional information</li>
                  <li>Complete all required background checks and training</li>
                  <li>Maintain professional conduct at all times</li>
                  <li>Honor agreements made with families</li>
                  <li>Keep children's safety as the top priority</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">4. Payment Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-lg">
                <Badge variant="secondary" className="mb-3 bg-primary text-primary-foreground">
                  Placement Fee
                </Badge>
                <p className="text-muted-foreground">
                  Our placement fee is a maximum of R200.00, paid once upon successful matching between a family and nanny.
                </p>
              </div>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Payment is due upon acceptance of a nanny placement</li>
                <li>Fees are non-refundable except in cases of platform error</li>
                <li>All payments are processed securely through our payment partners</li>
                <li>Additional services may incur separate charges</li>
              </ul>
            </CardContent>
          </Card>

          {/* Privacy and Data Protection */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">5. Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We are committed to protecting your privacy and personal information in accordance with the 
                Protection of Personal Information Act (POPIA) and other applicable privacy laws.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Personal information is collected only for legitimate business purposes</li>
                <li>Data is stored securely and not shared with unauthorized parties</li>
                <li>Users have the right to access, correct, or delete their personal information</li>
                <li>Background check information is handled with strict confidentiality</li>
              </ul>
            </CardContent>
          </Card>

          {/* Liability Limitations */}
          <Card className="border-amber-200 bg-amber-50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                6. Liability Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-100 p-4 rounded-lg border border-amber-200">
                <p className="text-amber-800 font-medium mb-2">Important Notice:</p>
                <p className="text-amber-700 text-sm">
                  Nanny Placements SA is a placement service only. We are not liable for the actions, 
                  conduct, or performance of nannies or families using our platform.
                </p>
              </div>
              <ul className="list-disc pl-6 text-amber-700 space-y-2 text-sm">
                <li>Users are responsible for conducting their own due diligence</li>
                <li>We recommend independent verification of all information</li>
                <li>Employment contracts are between families and nannies directly</li>
                <li>Platform liability is limited to the placement fee paid</li>
                
              </ul>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">7. Account Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Either party may terminate their account at any time. We reserve the right to suspend or 
                terminate accounts for violations of these terms.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>30-day notice period for voluntary termination</li>
                <li>Immediate termination for serious violations</li>
                <li>Data retention according to legal requirements</li>
                <li>No refunds for services already rendered</li>
              </ul>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">8. Governing Law</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                These Terms of Service are governed by the laws of South Africa. Any disputes will be 
                resolved through the courts of South Africa or through alternative dispute resolution 
                as mutually agreed upon.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">9. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms of Service at any time. Users will be notified 
                of significant changes via email or platform notification. Continued use of the platform 
                constitutes acceptance of updated terms.
              </p>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          {/* Contact Information */}
          <Card className="border-primary/20 shadow-lg bg-gradient-to-r from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Email:</strong> admin@nannyplacementssouthafrica.co.za</p>
                
                <p><strong>Address:</strong> Johannesburg, South Africa</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
