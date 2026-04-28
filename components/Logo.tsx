import Image from 'next/image';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Logo({ size = 'medium', className = '' }: LogoProps) {
  const sizeMap = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 },
  };

  const dimensions = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="hoi thao"
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain"
        priority
      />
      <span className="font-bold text-lg text-foreground">hoi thao</span>
    </div>
  );
}
