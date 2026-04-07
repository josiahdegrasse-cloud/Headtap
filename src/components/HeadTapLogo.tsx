export function HeadTapLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Abstract curved bars suggesting movement and rhythm */}
      <path
        d="M 6 4 Q 8 8 6 12 Q 4 16 6 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      
      <path
        d="M 12 4 Q 14 8 12 12 Q 10 16 12 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      
      <path
        d="M 18 4 Q 20 8 18 12 Q 16 16 18 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}