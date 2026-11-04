import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

const styles = {
  primary: "bg-[#315c4c] text-white hover:bg-[#24483b]",
  secondary: "border border-[#d9ddd5] bg-white text-[#26362e] hover:bg-[#f5f6f2]",
  ghost: "text-[#52645a] hover:bg-[#f1f3ee]",
};

export function Button({ href, variant = "primary", className = "", children, ...props }: Props) {
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${styles[variant]} ${className}`;
  if (href) return <Link className={classes} href={href}>{children}</Link>;
  return <button className={classes} {...props}>{children}</button>;
}
