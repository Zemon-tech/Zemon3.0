"use client";

import { useEffect, useRef } from 'react';

export function AnimatedHeroBanner() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);
  
  // Initialize and run the particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    
    // Configure canvas size to match container
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = Math.min(400, window.innerHeight * 0.4);
    };
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Particle class
    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.color = `hsl(${Math.random() * 60 + 220}, 100%, 70%)`;
        this.opacity = Math.random() * 0.5 + 0.3;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Particle fades as it moves
        if (this.size > 0.2) this.size -= 0.05;
        
        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      
      draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Initialize particles
    const initParticles = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 8000);
      
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push(new Particle(x, y));
      }
      
      return particles;
    };
    
    // Animate particles
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections between nearby particles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.globalAlpha = 1 - (distance / 100);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
        
        // Replace small particles
        if (particle.size <= 0.2) {
          const index = particles.indexOf(particle);
          particles[index] = new Particle(
            Math.random() * canvas.width,
            Math.random() * canvas.height
          );
        }
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    particles = initParticles();
    animate();
    
    particlesRef.current = particles;
    animationFrameRef.current = animationFrameId;
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  // Create confetti burst when banner loads
  useEffect(() => {
    setTimeout(() => {
      const canvas = canvasRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Add 50 particles from the center
      for (let i = 0; i < 50; i++) {
        const size = Math.random() * 5 + 2;
        const speedX = (Math.random() - 0.5) * 7;
        const speedY = (Math.random() - 0.5) * 7;
        const color = `hsl(${Math.random() * 360}, 100%, 70%)`;
        const opacity = Math.random() * 0.5 + 0.5;
        
        const particle = {
          x: centerX,
          y: centerY,
          size,
          speedX,
          speedY,
          color,
          opacity,
          update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.size > 0.2) this.size -= 0.05;
          },
          draw() {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
          }
        };
        
        particlesRef.current.push(particle);
      }
    }, 500);
  }, []);
  
  return (
    <div className="relative w-full overflow-hidden">
      <canvas 
        ref={canvasRef}
        className="w-full h-[400px] bg-gradient-to-r from-blue-900 to-purple-900"
      />
      <div className="absolute inset-0 flex items-center justify-center text-center">
        <div className="px-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Victory Wall
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto">
            Celebrating our team's achievements and completed projects
          </p>
        </div>
      </div>
    </div>
  );
} 