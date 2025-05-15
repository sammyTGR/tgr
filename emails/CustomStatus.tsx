import { Html, Head, Body, Container, Text, Button, Hr, Link } from '@react-email/components';
import * as React from 'react';

interface CustomStatusProps {
  name: string;
  startDate: string;
  endDate: string;
  customMessage: string;
  message?: string;
}

export default function CustomStatus({
  name,
  startDate,
  endDate,
  customMessage,
  message,
}: CustomStatusProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Schedule Status Update</Text>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            This email confirms that your schedule status for the period of {startDate} to {endDate}{' '}
            has been updated.
          </Text>
          <Text style={text}>Status: {customMessage}</Text>
          {message && <Text style={text}>{message}</Text>}
          <Hr style={hr} />
          <Text style={text}>
            If you have any questions or need to discuss this further, please contact your manager.
          </Text>
          <Button href="https://tgr-dashboard.vercel.app/TGR/crew/calendar" style={button}>
            View Your Schedule
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

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

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
};

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
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
