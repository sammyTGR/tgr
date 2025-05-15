import { Html, Head, Body, Container, Text, Button, Hr } from '@react-email/components';
import * as React from 'react';

interface AdminOvertimeAlertProps {
  employeeName: string;
  clockInTime: string;
  currentTime: string;
}

export default function AdminOvertimeAlert({
  employeeName,
  clockInTime,
  currentTime,
}: AdminOvertimeAlertProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Employee Timecard Alert</Text>
          <Text style={paragraph}>An employee has been clocked in for over 9 hours:</Text>
          <Text style={paragraph}>
            Employee: {employeeName}
            <br />
            Clock-in time: {clockInTime}
            <br />
            Current time: {currentTime}
          </Text>
          <Text style={paragraph}>
            Please check on this employee and ensure they clock out from their shift each day.
          </Text>
          <Hr style={hr} />
          {/* <Button href="https://tgr-dashboard.vercel.app/admin/timeoffreview" style={button}>
              Review Employee Hours
            </Button> */}
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
