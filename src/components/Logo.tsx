export function BrandLogo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <svg
        width="30"
        height="30"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="2"
          y="2"
          width="32"
          height="32"
          rx="6"
          stroke="#C9A45C"
          strokeWidth="1.5"
        />
        <path
          d="M11 26V15C11 11.134 14.134 8 18 8C21.866 8 25 11.134 25 15V26"
          stroke="#C9A45C"
          strokeWidth="1.5"
        />
        <path
          d="M18 12.5L21.5 18L18 23.5L14.5 18L18 12.5Z"
          fill="#C9A45C"
        />
      </svg>
      <span
        className={`font-display text-xl font-semibold tracking-wider ${
          dark ? 'text-white' : 'text-[#151515]'
        }`}
      >
        EVENT <span className="text-[#C9A45C]">PRO</span>
      </span>
    </span>
  );
}
