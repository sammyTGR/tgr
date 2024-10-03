import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
  } from "@react-email/components";
  import * as React from "react";
  
  interface LateStartProps {
    name: string;
    date: string;
    startTime: string;
  }
  
  export const LateStart = ({ name, date, startTime }: LateStartProps) => (
    <Html>
      <Head />
      <Preview>Late Start Notification</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Late Start Notification</Heading>
          <Text style={text}>
            Dear {name},
          </Text>
          <Text style={text}>
            This is to confirm that your shift on {date} has been updated to reflect a late start at {startTime}.
          </Text>
          <Text style={text}>
            If you have any questions or concerns, please contact your supervisor.
          </Text>
          <Text style={text}>
            Thank you for your understanding.
          </Text>
        </Container>
      </Body>
    </Html>
  );
  
  export default LateStart;
  
  const main = {
    backgroundColor: "#ffffff",
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  };
  
  const container = {
    margin: "0 auto",
    padding: "20px 0 48px",
    width: "560px",
  };
  
  const h1 = {
    color: "#333",
    fontSize: "24px",
    fontWeight: "bold",
    padding: "17px 0 0",
    margin: "0",
  };
  
  const text = {
    color: "#333",
    fontSize: "14px",
    lineHeight: "24px",
  };