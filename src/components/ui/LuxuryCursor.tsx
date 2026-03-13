import React, { useEffect, useState } from 'react';

export const LuxuryCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('cursor-pointer')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', onMouseOver);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        body {
          cursor: none !important;
        }
        button, a, .cursor-pointer {
          cursor: none !important;
        }
      `}</style>
      <div
        className={`fixed top-0 left-0 w-8 h-8 pointer-events-none z-[9999] transition-transform duration-300 ease-out flex items-center justify-center`}
        style={{
          transform: `translate3d(${position.x - 16}px, ${position.y - 16}px, 0) scale(${isHovering ? 1.5 : 1})`,
        }}
      >
        {/* Outer Ring */}
        <div className={`absolute inset-0 border border-luxury-gold/40 rounded-full transition-opacity duration-300 ${isHovering ? 'opacity-100 scale-110' : 'opacity-40'}`} />
        
        {/* Inner Dot with Glow */}
        <div className={`w-1.5 h-1.5 bg-luxury-gold rounded-full transition-all duration-300 ${isHovering ? 'scale-0' : 'scale-100 shadow-[0_0_10px_rgba(212,175,55,0.8)]'}`} />
        
        {/* Diamond Shape on Hover */}
        <div className={`absolute w-3 h-3 border border-luxury-gold rotate-45 transition-all duration-300 ${isHovering ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
      </div>

      {/* Trailing Blur Effect */}
      <div
        className="fixed top-0 left-0 w-24 h-24 pointer-events-none z-[9998] bg-luxury-gold/5 rounded-full blur-3xl transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${position.x - 48}px, ${position.y - 48}px, 0)`,
        }}
      />
    </>
  );
};
