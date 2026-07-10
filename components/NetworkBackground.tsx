export default function NetworkBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none opacity-40 ${className}`}>
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
        <line x1="-100" y1="200" x2="200" y2="400" stroke="currentColor" strokeWidth="1" />
        <line x1="200" y1="400" x2="600" y2="100" stroke="currentColor" strokeWidth="1" />
        <line x1="600" y1="100" x2="900" y2="300" stroke="currentColor" strokeWidth="1" />
        <line x1="900" y1="300" x2="1100" y2="200" stroke="currentColor" strokeWidth="1" />
        <line x1="200" y1="400" x2="400" y2="800" stroke="currentColor" strokeWidth="1" />
        <line x1="400" y1="800" x2="800" y2="600" stroke="currentColor" strokeWidth="1" />
        <line x1="800" y1="600" x2="900" y2="300" stroke="currentColor" strokeWidth="1" />
        <line x1="800" y1="600" x2="1100" y2="900" stroke="currentColor" strokeWidth="1" />
        <line x1="100" y1="700" x2="400" y2="800" stroke="currentColor" strokeWidth="1" />
        <line x1="600" y1="100" x2="800" y2="600" stroke="currentColor" strokeWidth="1" />
        <line x1="-100" y1="500" x2="200" y2="400" stroke="currentColor" strokeWidth="1" />
        <line x1="400" y1="800" x2="600" y2="1000" stroke="currentColor" strokeWidth="1" />
        
        <circle cx="200" cy="400" r="6" fill="#FF5C00" />
        <circle cx="600" cy="100" r="6" fill="#8CC63F" />
        <circle cx="400" cy="800" r="6" fill="#FF5C00" />
        <circle cx="800" cy="600" r="6" fill="#8CC63F" />
        <circle cx="100" cy="700" r="4" fill="#FF5C00" />
        <circle cx="900" cy="300" r="4" fill="#8CC63F" />
      </svg>
    </div>
  );
}
