import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import '../assets/styles/cards/glass-card.css';

interface GlassmorphismCardProps {
  title?: string;
  content?: string;
  cardWidth?: number;
  cardHeight?: number;
  glassOpacity?: number;
  blurAmount?: number;
  onClose?: () => void;
  className?: string;
}

const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({
  title = 'Стеклянная карточка',
  content = 'Эта карточка появляется из центра экрана с эффектом масштабирования. Нажмите на фон, чтобы создать карточку, или на саму карточку, чтобы закрыть.',
  glassOpacity = 0.15,
  blurAmount = 10,
  className = '',
  onClose = () => {},
}) => {
  // Состояния
  const [cardVisible, setCardVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values для динамического взаимодействия
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Вычисляем центр экрана с учетом размеров окна
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // Обновляем размеры окна при ресайзе
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Обработчик закрытия карточки
  const handleCardClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setCardVisible(false);
    onClose();
  }, []);

  // Следим за движением мыши над карточкой для эффекта параллакса
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      mouseX.set(event.clientX - rect.left);
      mouseY.set(event.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  interface ParallaxStyle {
    rotateX: number;
    rotateY: number;
    transformPerspective: number;
  }

  const handleRotate: () => ParallaxStyle = useCallback(() => {
    return {
      rotateX:
        mouseY.get() > 0 ? (mouseY.get() / windowSize.height - 0.5) * 10 : 0,
      rotateY:
        mouseX.get() > 0 ? (mouseX.get() / windowSize.width - 0.5) * -10 : 0,
      transformPerspective: 1200,
    };
  }, [mouseX, mouseY, windowSize]);

  // Стили карточки через style props
  const cardStyle = {
    background: `rgba(255, 255, 255, ${glassOpacity})`,
    backdropFilter: `blur(${blurAmount}px)`,
  };

  return (
    <div
      className={`glass-container ${className}`}
      onMouseMove={handleMouseMove}
      ref={containerRef}
      aria-label="Кликните для создания карточки"
    >
      <AnimatePresence mode="wait">
        {cardVisible && (
          <motion.div
            className="glass-card w-md"
            style={cardStyle}
            initial={{
              opacity: 0,
              scale: 0.1,
              borderRadius: '50%',
              rotateY: 180,
              filter: 'blur(10px)',
            }}
            animate={{
              opacity: 1,
              scale: 1,
              borderRadius: '20px',
              rotateY: 0,
              filter: 'blur(0px)',
            }}
            exit={{
              opacity: 0,
              scale: 0.1,
              borderRadius: '50%',
              rotateY: -180,
              filter: 'blur(10px)',
            }}
            transition={{
              type: 'spring',
              stiffness: 220,
              damping: 25,
              mass: 1.5,
            }}
            whileHover={{
              scale: 1.03,
              boxShadow: '0 10px 40px rgba(31, 38, 135, 0.4)',
              transition: { duration: 0.3 },
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="card-title"
          >
            <motion.div
              className="card-content"
              style={{
                rotateX: handleRotate().rotateX,
                rotateY: handleRotate().rotateY,
                transformPerspective: handleRotate().transformPerspective,
              }}
            >
              <h2 id="card-title">{title}</h2>
              <p
                className={`
                    text-[clamp(1.3rem,2vw,1.3rem)] 
                    font-medium 
                    font-mono 
                    text-shadow-[0px_0px_5px_rgba(124,58,237,0.8)]
                  `}
              >
                {content}
              </p>
              <div className="card-actions">
                <button
                  className="card-button"
                  onClick={handleCardClick}
                  aria-label="Закрыть карточку"
                >
                  Закрыть
                </button>
              </div>
            </motion.div>

            <div className="card-decoration card-decoration-1"></div>
            <div className="card-decoration card-decoration-2"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(GlassmorphismCard);
