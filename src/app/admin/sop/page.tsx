"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import styled from "styled-components";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

const title = "Back Of The House SOP's";

const SlidesContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;

  h1 {
    margin-bottom: 20px;
  }

  iframe {
    border: none;
  }
`;

const SOPPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  return (
    <RoleBasedWrapper allowedRoles={["auditor", "admin", "super admin"]}>
      <div className="flex flex-col items-center justify-center text-center mt-12 ">
        <h1 className="flex justify-start ">
          <TextGenerateEffect words={title} />
        </h1>
        <SlidesContainer>
          <iframe
            src="https://docs.google.com/presentation/d/e/2PACX-1vRaNsIRIqzaO8V9GlJYW2y4fqC8pUO5ZzbdHVD6gtuTJa10iZw7Hx6nssJtkVwbRciSnF8Auo1__EQY/embed?start=false&loop=false&delayms=60000"
            width="1440"
            height="839"
            allowFullScreen
          ></iframe>
        </SlidesContainer>
      </div>
    </RoleBasedWrapper>
  );
};

export default SOPPage;
