import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
  Button,
  Link,
} from "@react-email/components";
import * as React from "react";

interface ShiftUpdatedProps {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
}

export const ShiftUpdated = ({
  name,
  date,
  startTime,
  endTime,
}: ShiftUpdatedProps) => (
  <Html>
    <Head />
    <Preview>Your shift has been updated</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Shift Update</Heading>
        <Text style={text}>Hello {name},</Text>
        <Text style={text}>Your shift has been updated:</Text>
        <Text style={text}>
          Date: {date}
          <br />
          New Time: {startTime} - {endTime}
        </Text>
        <Text style={text}>
          If you have any questions or concerns about this change, please
          contact your supervisor.
        </Text>
        <Text style={text}>
          Thank you for your flexibility and understanding!
        </Text>
        <Button
          href="https://tgr-dashboard.vercel.app/TGR/crew/calendar"
          style={button}
        >
          View Your Schedule
        </Button>
      </Container>
    </Body>
  </Html>
);

export default ShiftUpdated;

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

const heading = {
  fontSize: "32px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#484848",
};

const paragraph = {
  fontSize: "18px",
  lineHeight: "1.4",
  color: "#484848",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
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
