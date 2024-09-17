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

interface SuggestionReplyProps {
  employeeName: string;
  originalSuggestion: string;
  replyText: string;
  repliedBy: string;
}

export const SuggestionReply = ({
  employeeName,
  originalSuggestion,
  replyText,
  repliedBy,
}: SuggestionReplyProps) => (
  <Html>
    <Head />
    <Preview>Reply to Your Suggestion</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reply to Your Suggestion</Heading>
        <Text style={text}>Hello {employeeName},</Text>
        <Text style={text}>Your suggestion has received a reply:</Text>
        <Text style={text}>
          Your original suggestion:
          <br />
          {originalSuggestion}
        </Text>
        <Hr style={hr} />
        <Text style={text}>Reply from {repliedBy}:</Text>
        <Text style={text}>{replyText}</Text>
        <Hr style={hr} />
        <Text style={text}>
          Thank you for your valuable input. If you have any questions, please
          don't hesitate to reach out!
        </Text>
      </Container>
    </Body>
  </Html>
);

export default SuggestionReply;

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
