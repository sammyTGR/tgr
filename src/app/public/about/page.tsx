import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
const title = "About The Gun Range";

const AboutPage = () => {
  return (
    <div>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          <TextGenerateEffect words={title} />
        </h1>
        <p className="text-center mb-4">
          Learn more about our mission and values.
        </p>
      </main>
    </div>
  );
};

export default AboutPage;
