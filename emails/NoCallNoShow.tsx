import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Hr,
  Link,
} from "@react-email/components";
import * as React from "react";

interface NoCallNoShowProps {
  name: string;
  date: string;
}

export default function NoCallNoShow({ name, date }: NoCallNoShowProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>No Call No Show Alert</Text>
          <Text style={text}>Attention,</Text>
          <Text style={text}>
            This email confirms that {name} has been marked as No Call No Show
            for their shift on {date}.
          </Text>
          <Hr style={hr} />
          <Text style={text}>
            If this is an error or you need to discuss this further, please
            contact your manager immediately.
          </Text>
          <Button
            href="https://tgr-dashboard.vercel.app/TGR/crew/calendar"
            style={button}
          >
            View Schedule
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

const text = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "24px",
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
