import React, { useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme'; // Changed import path

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 50;

    // Particle class
    class Particle {
      constructor(x, y, radius, color, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speedX = speedX;
        this.speedY = speedY;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
      }

      update() {
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
          this.speedX = -this.speedX;
        }
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
          this.speedY = -this.speedY;
        }
        this.x += this.speedX;
        this.y += this.speedY;
        this.draw();
      }
    }

    const particleColor = theme === 'dark'
      ? 'rgba(156, 163, 175, 0.3)' // Brighter particles for dark mode (gray-400 with opacity)
      : 'rgba(107, 114, 128, 0.3)'; // Darker particles for light mode (gray-500 with opacity)


    function init() {
      particles.length = 0; // Clear existing particles
      for (let i = 0; i < particleCount; i++) {
        const radius = Math.random() * 2 + 1; // Particle size
        const x = Math.random() * (canvas.width - radius * 2) + radius;
        const y = Math.random() * (canvas.height - radius * 2) + radius;
        const speedX = (Math.random() - 0.5) * 0.5; // Slower speed
        const speedY = (Math.random() - 0.5) * 0.5; // Slower speed
        particles.push(new Particle(x, y, radius, particleColor, speedX, speedY));
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(particle => {
        particle.update();
      });
      animationFrameId = requestAnimationFrame(animate);
    }

    init();
    animate();

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init(); // Re-initialize particles for new size
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]); // Re-run effect if theme changes to update particle color

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1, // Behind other content
        width: '100%',
        height: '100%'
      }}
      aria-hidden="true" // Decorative background
    />
  );
};

export default ParticleBackground;
