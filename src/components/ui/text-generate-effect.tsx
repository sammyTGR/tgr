"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/cn";

export const TextGenerateEffect = ({
  words,
  className,
}: {
  words: string;
  className?: string;
}) => {
  const [scope, animate] = useAnimate();
  let wordsArray = words.split(" ");
  useEffect(() => {
    animate(
      "span",
      {
        opacity: 1,
      },
      {
        duration: 2,
        delay: stagger(0.2),
      }
    );
  }, [animate]);

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          // Updated class names for text color based on theme. Now, for dark theme it applies 'dark:text-white text-black' and for light theme 'dark:text-black text-white'
          return (
            <motion.span
              key={word + idx}
              className="dark:text-white text-gray-800 opacity-0 leading-snug tracking-tight"
            >
              {word}{" "}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className={cn("font-bold", className)}>
      <div className="">
        <div className="dark:text-white text-amber-500 leading-snug tracking-tight">
          {renderWords()}
        </div>
      </div>
    </div>
  );
};
