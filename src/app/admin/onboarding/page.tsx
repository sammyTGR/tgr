import OnboardingWizard from "./OnboardingWizard";

export default function Page() {
  return (
    <div className="container mx-auto py-10 flex flex-col items-center justify-center w-full">
      <h1 className="text-3xl font-bold mb-6 my-10 text-center">
        Let&apos;s Grow The Team!
      </h1>
      <OnboardingWizard />
    </div>
  );
}
