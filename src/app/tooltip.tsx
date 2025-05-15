'use client';
import React from 'react';
import { AnimatedTooltip } from '@/components/ui/animated-tooltip';
const people = [
  {
    id: 1,
    name: 'Sammy',
    designation: 'Ops Manager',
    image: 'https://utfs.io/f/d0e97c23-87fa-4af9-b89b-0edc379f71a5-4qth1s.jpg',
  },
];

export default function ToolTip() {
  return (
    <div className="flex flex-row items-center justify-center mb-10 w-full">
      <AnimatedTooltip items={people} />
    </div>
  );
}
