"use client";

import { cn } from "@/lib/utils";

interface AdSensePlaceholderProps {
  className?: string;
  slot?: string;
  format?: "horizontal" | "rectangle" | "vertical";
}

export default function AdSensePlaceholder({
  className,
  format = "horizontal",
}: AdSensePlaceholderProps) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  const sizeClass = {
    horizontal: "h-[90px]",
    rectangle: "h-[250px]",
    vertical: "h-[600px]",
  }[format];

  if (!adsenseId) {
    return (
      <div className={cn("bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400", sizeClass, className)}>
        광고 영역 (AdSense 코드 삽입 후 활성화)
      </div>
    );
  }

  return (
    <div className={cn(sizeClass, className)}>
      {/* Google AdSense 코드 삽입 위치 */}
    </div>
  );
}
