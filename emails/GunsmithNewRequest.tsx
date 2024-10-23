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
} from "@react-email/components";
import * as React from "react";

interface GunsmithNewRequestProps {
  firearmId: number;
  firearmName: string;
  requestedBy: string;
  requestMessage: string;
}

export const GunsmithNewRequest = ({
  firearmId,
  firearmName,
  requestedBy,
  requestMessage,
}: GunsmithNewRequestProps) => (
  <Html>
    <Head />
    <Preview>New Gunsmith Request</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Gunsmith Request</Heading>
        <Text style={text}>Hello,</Text>
        <Text style={text}>
          A new request has been submitted for the following firearm:
        </Text>
        <Text style={text}>
          Firearm Name: {firearmName}
          <br />
          Requested By: {requestedBy}
        </Text>
        <Text style={text}>Request Message:</Text>
        <Text style={text}>{requestMessage}</Text>
        <Hr style={hr} />
        <Text style={text}>
          Please review this request and take appropriate action.
        </Text>
        <Button
          href="https://tgr-dashboard.vercel.app/TGR/gunsmithing"
          style={button}
        >
          Go to Gunsmithing Dashboard
        </Button>
      </Container>
    </Body>
  </Html>
);

export default GunsmithNewRequest;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  paddingTop: "32px",
  paddingBottom: "32px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
};

const button = {
  backgroundColor: "#5469d4",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "200px",
  padding: "14px 7px",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
};
