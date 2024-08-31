import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface CustomStatusProps {
  name: string;
  date: string;
  status: string;
}

export default function CustomStatus({
  name,
  date,
  status,
}: CustomStatusProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Schedule Status Update</Text>
          <Text style={paragraph}>Aye {name},</Text>
          <Text style={paragraph}>
            This email confirms that your schedule status for {date} has been
            updated to: {status}.
          </Text>
          <Hr style={hr} />
          <Text style={paragraph}>
            If you have any questions or need to discuss this further, please
            contact your manager.
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
}

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
