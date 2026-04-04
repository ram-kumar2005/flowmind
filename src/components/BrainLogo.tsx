import React from "react";

export const BrainLogo = ({ className = "w-8 h-8", color = "#C4714F" }: { className?: string, color?: string }) => (
  <svg 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M16 28C16 28 12 28 9 25C6 22 4 19 4 15C4 11 7 8 11 8C11.5 8 12 8.1 12.5 8.2C13.5 5.5 16 4 19 4C23 4 27 7 28 11C29 11.5 30 13 30 15C30 19 28 22 25 25C22 28 18 28 16 28Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M16 8V28" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M12 12C10 12 8 13.5 8 15.5C8 17.5 10 19 12 19" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M20 12C22 12 24 13.5 24 15.5C24 17.5 22 19 20 19" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M16 14C14 14 13 15 13 16.5C13 18 14 19 16 19C18 19 19 18 19 16.5C19 15 18 14 16 14Z" 
      stroke={color} 
      strokeWidth="1.5" 
    />
  </svg>
);
