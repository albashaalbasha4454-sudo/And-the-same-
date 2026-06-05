
import React, { useState } from 'react';

export const Logo = ({ className = "h-10 w-10" }: { className?: string }) => {
  const [isError, setIsError] = useState(false);
  
  // Direct link to the logo (hosted on a reliable CDN)
  const logoUrl = "https://i.postimg.cc/m2f99M9X/soqalketab-logo.png";

  return (
    <div className={`${className} bg-slate-800 rounded-lg flex items-center justify-center shadow-lg overflow-hidden p-1`}>
      {!isError ? (
        <img 
          src={logoUrl} 
          alt="Soqq Alketab" 
          className="w-full h-full object-contain"
          onError={() => setIsError(true)}
        />
      ) : (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-2/3 h-2/3">
          <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.8370 4.26339 3.2011 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
};
