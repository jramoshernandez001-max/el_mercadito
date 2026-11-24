export function LogoTienda({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="5" y="17" width="30" height="19" rx="3" fill="#fff" />
      <rect x="16" y="24" width="8" height="12" rx="1.5" fill="#0B1E3A" />
      <path d="M3 9h34l-2 9H5z" fill="#2ED47A" />
      <path d="M9 9l-1.5 9M16 9l-.5 9M24 9l.5 9M31 9l1.5 9" stroke="#fff" strokeWidth="2.4" />
      <rect x="3" y="5" width="34" height="5" rx="2" fill="#16A864" />
    </svg>
  );
}
