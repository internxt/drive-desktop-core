import type { ReactNode } from 'react';

type Props = { icon: ReactNode; title: string; description: string };

export function FeatureCard({ icon, title, description }: Readonly<Props>) {
  return (
    <div className="border-gray-20 bg-gray-1 rounded-[10px] border p-4">
      <span className="text-gray-70">{icon}</span>
      <div className="mt-3 text-sm font-semibold text-gray-100">{title}</div>
      <div className="text-gray-60 mt-1 text-[13px] leading-snug">{description}</div>
    </div>
  );
}
