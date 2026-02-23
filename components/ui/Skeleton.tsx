import * as React from "react";
import { cn } from "./Utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#e5e5e5]", className)}
      {...props}
    />
  );
}

export { Skeleton };
