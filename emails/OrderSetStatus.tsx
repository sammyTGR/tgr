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

interface OrderSetStatusProps {
  id: number;
  customerName: string;
  newStatus: string;
  updatedBy: string;
  item: string;
}

export const OrderSetStatus = ({
  id,
  customerName,
  newStatus,
  updatedBy,
  item,
}: OrderSetStatusProps) => (
  <Html>
    <Head />
    <Preview>Order Status Updated for {customerName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Order Status Updated</Heading>
        <Text style={text}>Hello,</Text>
        <Text style={text}>The status for {customerName}'s special order has been updated.</Text>
        <Text style={text}>
          Order ID: {id}
          <br />
          Customer Name: {customerName}
          <br />
          Item: {item}
          <br />
          New Status: {newStatus}
          <br />
          Updated By: {updatedBy}
        </Text>
        <Hr style={hr} />
        <Text style={text}>You can always view all special orders and their status below:</Text>
        <Button href="https://tgr-dashboard.vercel.app/sales/orderreview/crew" style={button}>
          View Order Details
        </Button>
      </Container>
    </Body>
  </Html>
);

export default OrderSetStatus;

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
