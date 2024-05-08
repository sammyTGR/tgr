import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import LandingPage from "@/components/LandingPage";

const words = 'Get started by editing src/app/page'
const wordsLink = 'Audit Review'
const wordsAudit = 'Supa Audit'
export default function Home() {
  return (
    <div>
      <LandingPage />
    </div>
  );
}
