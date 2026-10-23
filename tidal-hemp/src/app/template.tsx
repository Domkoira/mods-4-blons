/** Re-mounts on navigation, giving each page a soft fade-in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
