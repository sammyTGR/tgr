"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import styled from "styled-components";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

const title = "TGR SOP's";

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

const SlidesPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  return (
    <RoleBasedWrapper allowedRoles={["user", "admin", "super admin"]}>
      <div className="flex flex-col items-center justify-center text-center mt-12 ">
        <h1 className="flex justify-start ">
          <TextGenerateEffect words={title} />
        </h1>
        <SlidesContainer>
          <iframe
            src="https://docs.google.com/presentation/d/e/2PACX-1vSwa4gAuEU_2OfQLA2dljMSUuu9pGy9XDMwvms6GQyHgtrEHokADZ7_1vm1tTv4m1mi1hzXPAhuhVy-/embed?start=false&loop=false&delayms=60000"
            width="1440"
            height="839"
            allowFullScreen
          ></iframe>
        </SlidesContainer>
      </div>
    </RoleBasedWrapper>
  );
};

export default SlidesPage;
