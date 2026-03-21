"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "@/lib/utils";

const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipPortal = TooltipPrimitive.Portal;

function TooltipContent({ className, sideOffset = 8, children, ...props }: TooltipPrimitive.Popup.Props & { sideOffset?: number }) {
  return (
    <TooltipPortal>
      <TooltipPrimitive.Positioner side="top" sideOffset={sideOffset} className="z-50">
        <TooltipPrimitive.Popup
          className={cn(
            "z-50 max-w-64 rounded-[12px] border border-border bg-popover px-3 py-2 text-xs leading-5 text-popover-foreground shadow-md outline-none transition-[opacity,transform] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[starting-style]:scale-95",
            className,
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPortal>
  );
}

function TooltipTitle({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("font-medium text-foreground", className)} {...props} />;
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipTitle };
