import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ContactDetailsEmailProps {
  recipientName: string;
  recipientType: 'client' | 'nanny';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactCity: string;
  hourlyRate?: number;
  bio?: string;
}

export const ContactDetailsEmail = ({
  recipientName,
  recipientType,
  contactName,
  contactEmail,
  contactPhone,
  contactCity,
  hourlyRate,
  bio,
}: ContactDetailsEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Your interview setup has been approved - Contact details inside
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Interview Setup Approved! 🎉</Heading>
        
        <Text style={text}>
          Hi {recipientName},
        </Text>
        
        <Text style={text}>
          Great news! Your interview setup has been approved by our admin team. 
          You can now contact {contactName} directly to arrange your interview.
        </Text>

        <Section style={contactSection}>
          <Heading style={h2}>Contact Details:</Heading>
          <Text style={contactText}>
            <strong>Name:</strong> {contactName}
          </Text>
          <Text style={contactText}>
            <strong>Email:</strong> {contactEmail}
          </Text>
          <Text style={contactText}>
            <strong>Phone:</strong> {contactPhone}
          </Text>
          <Text style={contactText}>
            <strong>City:</strong> {contactCity}
          </Text>
          {hourlyRate && (
            <Text style={contactText}>
              <strong>Hourly Rate:</strong> R{hourlyRate}
            </Text>
          )}
        </Section>

        {bio && recipientType === 'client' && (
          <Section style={bioSection}>
            <Heading style={h2}>About the Nanny:</Heading>
            <Text style={text}>{bio}</Text>
          </Section>
        )}

        <Hr style={hr} />

        <Section style={safetySection}>
          <Heading style={h2}>Safety Reminders:</Heading>
          <Text style={safetyText}>
            • Always meet in a public place for the first interview
          </Text>
          <Text style={safetyText}>
            • Verify all credentials and references
          </Text>
          <Text style={safetyText}>
            • Trust your instincts - if something doesn't feel right, don't proceed
          </Text>
          <Text style={safetyText}>
            • Keep our platform informed of your interview outcome
          </Text>
        </Section>

        <Text style={footer}>
          Best of luck with your interview!<br />
          <strong>Nanny Placements SA Team</strong>
        </Text>

        <Text style={disclaimer}>
          If you have any concerns or need support, please contact us immediately.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ContactDetailsEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const contactSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '20px 40px',
  padding: '20px',
};

const contactText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const bioSection = {
  margin: '20px 40px',
  padding: '20px',
  borderLeft: '4px solid #0070f3',
  backgroundColor: '#f0f8ff',
};

const safetySection = {
  backgroundColor: '#fff3cd',
  borderRadius: '8px',
  margin: '20px 40px',
  padding: '20px',
};

const safetyText = {
  color: '#856404',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '4px 0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '40px 40px 0',
  textAlign: 'center' as const,
};

const disclaimer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '20px 40px',
  textAlign: 'center' as const,
};