'use client';

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

export function HolaMundo() {
  const gradientVariants: Variants = {
    animate: {
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      transition: {
        duration: 8,
        repeat: Infinity,
        repeatType: 'loop',
      },
    },
  };

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: 0.2 + i * 0.3,
      },
    }),
  };

  const dividerVariants: Variants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: {
        duration: 0.6,
        delay: 1.0,
      },
    },
  };

  const subtitleVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 1.3,
      },
    },
  };

  const badgeVariants: Variants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        type: 'spring',
        delay: 1.6,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col items-center justify-center px-4"
      variants={gradientVariants}
      animate="animate"
      style={{
        backgroundSize: '200% 200%',
      }}
    >
      {/* Contenedor principal */}
      <div className="flex flex-col items-center justify-center gap-6 text-center">
        {/* "Hola" */}
        <motion.h1
          className="text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tighter bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#3b82f6] bg-clip-text text-transparent"
          variants={textVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          Hola
        </motion.h1>

        {/* "Mundo" */}
        <motion.h2
          className="text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tighter bg-gradient-to-r from-[#8b5cf6] via-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent"
          variants={textVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          Mundo
        </motion.h2>

        {/* Línea divisora */}
        <motion.div
          className="h-1 w-32 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full"
          variants={dividerVariants}
          initial="hidden"
          animate="visible"
        />

        {/* Subtítulo */}
        <motion.p
          className="text-lg sm:text-xl font-light text-white/60 tracking-wide max-w-2xl"
          variants={subtitleVariants}
          initial="hidden"
          animate="visible"
        >
          Sistema Fullstack TypeScript con JSON Database Layer
        </motion.p>

        {/* Badge TypeScript */}
        <motion.div
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors"
          variants={badgeVariants}
          initial="hidden"
          animate="visible"
        >
          <span className="text-sm font-mono text-white/80">✨ TypeScript</span>
        </motion.div>
      </div>

      {/* Decoración de fondo */}
      <motion.div
        className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full filter blur-3xl"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: 'loop',
        }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-72 h-72 bg-violet-500/20 rounded-full filter blur-3xl"
        animate={{
          y: [0, 20, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: 'loop',
        }}
      />
    </motion.div>
  );
}
