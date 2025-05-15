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

interface GunsmithInspectionProps {
  firearmId: number;
  firearmName: string;
  requestedBy: string;
  notes: string;
}

export const GunsmithInspection = ({
  firearmId,
  firearmName,
  requestedBy,
  notes,
}: GunsmithInspectionProps) => (
  <Html>
    <Head />
    <Preview>Firearm Inspection Requested</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Firearm Inspection Requested</Heading>
        <Text style={text}>Hello,</Text>
        <Text style={text}>An inspection has been requested for the following firearm:</Text>
        <Text style={text}>
          {/* Firearm ID: {firearmId}
          <br /> */}
          Firearm Name: {firearmName}
          <br />
          Requested By: {requestedBy}
        </Text>
        <Text style={text}>Inspection Notes:</Text>
        <Text style={text}>{notes}</Text>
        <Hr style={hr} />
        <Text style={text}>
          Please review this request and schedule the inspection as soon as possible.
        </Text>
        <Button href="https://tgr-dashboard.vercel.app/TGR/gunsmithing" style={button}>
          Go to Gunsmithing Dashboard
        </Button>
      </Container>
    </Body>
  </Html>
);

export default GunsmithInspection;

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
