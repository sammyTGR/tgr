import OnboardingWizard from "./OnboradingWizard";

export function OnboardingPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Welcome to Our SaaS Platform
      </h1>
      <OnboardingWizard />
    </div>
  );
}
export default OnboardingPage;
