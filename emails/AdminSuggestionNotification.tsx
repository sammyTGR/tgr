import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface AdminSuggestionNotificationProps {
  employeeName: string;
  suggestion: string;
}

export const AdminSuggestionNotification = ({
  employeeName,
  suggestion,
}: AdminSuggestionNotificationProps) => (
  <Html>
    <Head />
    <Preview>New Suggestion Submitted</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Suggestion Submitted</Heading>
        <Text style={text}>A new suggestion has been submitted:</Text>
        <Text style={text}>
          Employee: {employeeName}
          <br />
          Suggestion: {suggestion}
        </Text>
        <Hr style={hr} />
        <Text style={text}>Please review this suggestion at your earliest convenience.</Text>
        <Button href="https://tgr-dashboard.vercel.app/admin/reports/dashboard" style={button}>
          Review Suggestions
        </Button>
      </Container>
    </Body>
  </Html>
);

export default AdminSuggestionNotification;

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
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
  paddingTop: '32px',
  paddingBottom: '32px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '14px 7px',
};
