type ClassValue = string | number | null | false | undefined | ClassValue[];

/** Minimal classnames joiner — avoids a clsx dependency. */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const i of inputs) {
    if (!i) continue;
    if (Array.isArray(i)) out.push(cn(...i));
    else out.push(String(i));
  }
  return out.join(' ');
}
