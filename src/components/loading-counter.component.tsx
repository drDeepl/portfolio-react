import React, { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

interface LoadingCounterProps {
  onLoadingComplete?: () => void;
}

const LoadingCounter: React.FC<LoadingCounterProps> = ({
  onLoadingComplete = () => {},
}) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const controls = useAnimation();

  // Эффект для анимации счётчика от 0 до 100
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (count < 100) {
          setCount((prevCount) => prevCount + 1);
        } else {
          setLoading(false);
          // Вызываем коллбэк по завершении загрузки
          if (onLoadingComplete) onLoadingComplete();
        }
      }, count * 1.2); // Скорость смены чисел

      return () => clearTimeout(timer);
    }
  }, [count, loading, onLoadingComplete]);

  // Эффект для анимации прогресс-бара
  useEffect(() => {
    controls.start({
      width: `${count}%`,
      transition: { duration: 0.4, ease: 'easeInOut' },
    });
  }, [count, controls]);

  // Варианты анимации для заголовка
  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  // Варианты анимации для числового счетчика
  const counterVariants = {
    initial: { y: 0 },
    animate: { y: 0, transition: { duration: 0.3 } },
    exit: { y: 0, transition: { duration: 0.3 } },
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          className="loading-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          key="loader"
        >
          <motion.h1
            variants={titleVariants}
            initial="hidden"
            animate="visible"
            className="loading-title font-new-mexika"
          >
            Загрузка страницы
          </motion.h1>

          <div className="counter-container">
            <AnimatePresence mode="wait">
              <motion.div
                key={count}
                variants={counterVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="counter"
              >
                {count}%
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="progress-bar-container">
            <motion.div
              className="progress-bar"
              initial={{ width: 0 }}
              animate={controls}
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7, transition: { delay: 1, duration: 0.5 } }}
            className="loading-message"
          >
            Подготовка данных...
          </motion.p>
        </motion.div>
      ) : (
        <motion.div
          className="content"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          key="content"
        >
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="font-new-mexika"
          >
            Страница загружена! VLIMO
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Добро пожаловать на сайт
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingCounter;
