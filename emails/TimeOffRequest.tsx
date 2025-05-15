import { Html, Head, Body, Container, Text, Button, Hr } from '@react-email/components';
import * as React from 'react';

interface TimeOffRequestNotificationProps {
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  other_reason: string;
}

export default function TimeOffRequestNotification({
  employeeName,
  startDate,
  endDate,
  reason,
  other_reason,
}: TimeOffRequestNotificationProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>New Time Off Request Submitted</Text>
          <Text style={paragraph}>A new time off request has been submitted:</Text>
          <Text style={paragraph}>
            <strong>Employee:</strong> {employeeName}
          </Text>
          <Text style={paragraph}>
            <strong>Start Date:</strong> {startDate}
          </Text>
          <Text style={paragraph}>
            <strong>End Date:</strong> {endDate}
          </Text>
          <Text style={paragraph}>
            <strong>Reason:</strong> {reason}
          </Text>
          <Text style={paragraph}>
            <strong>Details & Who is Covering:</strong> {other_reason}
          </Text>
          <Hr style={hr} />
          <Button href="https://tgr-dashboard.vercel.app/admin/timeoffreview" style={button}>
            Review Time Off Requests
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
