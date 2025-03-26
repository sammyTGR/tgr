"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import styled from "styled-components";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useSidebar } from "@/components/ui/sidebar";

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
  const { state } = useSidebar();
  const router = useRouter();
  const [user, setUser] = useState(null);

  return (
    <RoleBasedWrapper
      allowedRoles={[
        "gunsmith",
        "user",
        "auditor",
        "admin",
        "super admin",
        "dev",
      ]}
    >
      <div
        className={`flex flex-col items-center space-y-4 p-4 ${state === "collapsed" ? "w-[calc(100vw-30rem)] mt-12 ml-24 mx-auto" : "w-[calc(100vw-30rem)] mt-12 ml-24 mx-auto"} transition-all duration-300`}
      >
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
