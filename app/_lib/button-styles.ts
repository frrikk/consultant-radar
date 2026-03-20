export const buttonStyles = {
  base: "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-medium no-underline transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  default: "border border-[#021e57] bg-[#021e57] text-[#fcfaf7] hover:border-[#021b42] hover:bg-[#021b42] dark:border-[#f5ff56] dark:bg-[#f5ff56] dark:text-[#021b42] dark:hover:bg-[#f6ff67]",
  secondary: "border border-[#d7df52] bg-[#f5ff56] text-[#021e57] hover:border-[#021e57] hover:bg-[#f6ff67] dark:border-[#2d4d8e] dark:bg-[#12306f] dark:text-[#fcfaf7] dark:hover:border-[#839df9] dark:hover:bg-[#17397f]",
  outline: "border border-[#021e57]/24 bg-white text-[#021e57] hover:border-[#021e57]/50 hover:bg-[#f3f0ef] hover:text-[#021e57] dark:border-white/18 dark:bg-[#082455] dark:text-[#fcfaf7] dark:hover:border-white/28 dark:hover:bg-[#12306f]",
};

export function getButtonStyles(variant: keyof typeof buttonStyles = "default") {
  return [buttonStyles.base, buttonStyles[variant]].join(" ");
}
