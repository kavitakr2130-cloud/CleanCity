import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      id="cleancity-app-logo"
    >
      {/* Outer Green Chevron/Arrowhead Shape */}
      <path
        d="M250 40 L410 435 L250 375 L90 435 Z"
        fill="#008c45"
      />
      
      {/* Inner Cutout White Triangle */}
      <polygon
        points="250,115 345,320 155,320"
        fill="white"
      />
      
      {/* Central Blue Circle */}
      <circle
        cx="250"
        cy="250"
        r="63"
        fill="#0057b8"
      />
    </svg>
  );
};

export default Logo;
