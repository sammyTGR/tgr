import { Html, Head, Body, Container, Text, Button, Hr } from '@react-email/components';
import * as React from 'react';

interface TimeOffApprovedProps {
  name: string;
  startDate: string;
  endDate: string;
}

export default function TimeOffApproved({ name, startDate, endDate }: TimeOffApprovedProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Time Off Request Approved</Text>
          <Text style={paragraph}>Yo {name},</Text>
          <Text style={paragraph}>
            Your time off request for {startDate} to {endDate} has been approved!
          </Text>
          <Hr style={hr} />
          <Text style={paragraph}>
            If you have any questions or need to make changes, please contact your manager.
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
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
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

const paragraph = {
  fontSize: '18px',
  lineHeight: '1.4',
  color: '#484848',
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