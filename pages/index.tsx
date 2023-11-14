import React, { useEffect, useRef, useState, ChangeEvent } from 'react';
import '../styles/Home.module.css';

interface Asteroid {
  x: number;
  y: number;
  velocity: { x: number; y: number };
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

const initialPlayerState: Player = {
  x: 0,
  y: 0,
  width: 30,
  height: 30,
  color: 'red'
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Player>(initialPlayerState);
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [maxAsteroids, setMaxAsteroids] = useState<number>(10);
  const [asteroidFrequency, setAsteroidFrequency] = useState<number>(5000);
  const asteroidMaxSpeed = 2.5;
  let animationFrameId = useRef<number>();
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [bestTime, setBestTime] = useState<number>(0);
  const [currentUsersTime, setcurrentUsersTime] = useState<number>(0);

  const [gameOver, setGameOver] = useState<boolean>(false);
  const [showStartModal, setShowStartModal] = useState(true);

  

  useEffect(() => {
    if (gameOver) {
      setShowStartModal(true);
    }
  }, [gameOver]);
  useEffect(() => {
    const savedBestTime = parseFloat(localStorage.getItem('bestTime') || '0');
    setBestTime(savedBestTime);
  }, []);

 const generateAsteroid = (canvas: HTMLCanvasElement): Asteroid => {
  const speedX = (Math.random() * 2 - 1) * asteroidMaxSpeed;
  const speedY = (Math.random() * 2 - 1) * asteroidMaxSpeed;

  let x, y;
  if (Math.random() < 0.5) {
    x = Math.random() < 0.5 ? -20 : canvas.width + 20;
    y = Math.random() * canvas.height;
  } else {
    x = Math.random() * canvas.width;
    y = Math.random() < 0.5 ? -20 : canvas.height + 20;
  }

  return {
    x,
    y,
    velocity: { x: speedX, y: speedY }
  };
};

  const startGame = () => {
    setShowStartModal(false);
    setGameOver(false);
    setGameStartTime(Date.now());
  
    const canvas = canvasRef.current;
    if (canvas) {
      const initialAsteroids: Asteroid[] = [];
      for (let i = 0; i < 5; i++) {
        initialAsteroids.push(generateAsteroid(canvas));
      }
      setAsteroids(initialAsteroids);
    }
  
    if (canvas) {
      playerRef.current = {
        ...initialPlayerState,
        x: canvas.width / 2 - initialPlayerState.width / 2,
        y: canvas.height / 2 - initialPlayerState.height / 2
      };
    }
  };

  const checkCollision = (asteroid: Asteroid): boolean => {
    return (
      playerRef.current.x < asteroid.x + 20 &&
      playerRef.current.x + playerRef.current.width > asteroid.x &&
      playerRef.current.y < asteroid.y + 20 &&
      playerRef.current.y + playerRef.current.height > asteroid.y
    );
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      let newX = playerRef.current.x;
      let newY = playerRef.current.y;

      switch (event.key) {
        case 'ArrowLeft':
          newX -= 10;
          break;
        case 'ArrowRight':
          newX += 10;
          break;
        case 'ArrowUp':
          newY -= 10;
          break;
        case 'ArrowDown':
          newY += 10;
          break;
        default:
          return;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        if (newX < 0) newX = canvas.width - playerRef.current.width;
        else if (newX + playerRef.current.width > canvas.width) newX = 0;
        if (newY < 0) newY = canvas.height - playerRef.current.height;
        else if (newY + playerRef.current.height > canvas.height) newY = 0;
      }

      playerRef.current = { ...playerRef.current, x: newX, y: newY };
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (!context) return;

      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        playerRef.current = {
          ...playerRef.current,
          x: canvas.width / 2 - playerRef.current.width / 2,
          y: canvas.height / 2 - playerRef.current.height / 2
        };
      };

      resizeCanvas();


      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const updateAndRender = () => {
      if (gameOver || showStartModal) return;

      context.clearRect(0, 0, canvas.width, canvas.height);
      asteroids.forEach((asteroid, index) => {
        context.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
        context.shadowBlur = 5;
        context.shadowColor = 'rgba(0, 0, 0, 0.5)';
        asteroid.x += asteroid.velocity.x;
        asteroid.y += asteroid.velocity.y;

        if (asteroid.x > canvas.width + 20) asteroid.x = -20;
        else if (asteroid.x < -20) asteroid.x = canvas.width + 20;

        if (asteroid.y > canvas.height + 20) asteroid.y = -20;
        else if (asteroid.y < -20) asteroid.y = canvas.height + 20;

        context.fillRect(asteroid.x, asteroid.y, 20, 20);

        if (checkCollision(asteroid)) {
          setGameOver(true);
          const currentTime = Date.now();
          const duration = parseFloat(((currentTime - gameStartTime) / 1000).toFixed(3));
          setcurrentUsersTime(duration)
          if (duration > bestTime) {
            setBestTime(duration);
            localStorage.setItem('bestTime', duration.toString());
          }
        }
      });

      if (!gameOver) {
        context.fillStyle = playerRef.current.color;
        context.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
        animationFrameId.current = requestAnimationFrame(updateAndRender);
      }
    };

    let addAsteroidInterval = setInterval(() => {
      if (gameOver || showStartModal) return;

      if (asteroids.length < maxAsteroids) {
        setAsteroids(prevAsteroids => [
          ...prevAsteroids,
          generateAsteroid(canvas)
        ]);
      }
    }, asteroidFrequency);

    updateAndRender();

    return () => {
      clearInterval(addAsteroidInterval);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [asteroids, maxAsteroids, asteroidFrequency, gameOver]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'maxAsteroids') {
      setMaxAsteroids(Number(value));
    } else if (name === 'asteroidFrequency') {
      setAsteroidFrequency(Number(value));
    }
  };

  return (
    <>
      {showStartModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">{gameOver ? "Game Over" : "Welcome to Asteroids Game"}</h2>
            {gameOver && (
              <>
                <p className="mb-2">Current Time: {currentUsersTime.toFixed(3)} seconds</p>
                <p className="mb-4">Best Time: {bestTime.toFixed(3)} seconds</p>
              </>
            )}
            <form className="space-y-4">
              <label className="block">
                <span className="text-gray-700">Max Asteroids:</span>
                <input
                  type="number"
                  name="maxAsteroids"
                  value={maxAsteroids}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-gray-700">Asteroid Generation Frequency (ms):</span>
                <input
                  type="number"
                  name="asteroidFrequency"
                  value={asteroidFrequency}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </label>
            </form>
            <button 
              onClick={startGame}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
            >
              {gameOver ? "Restart" : "Start"}
            </button> 
          </div>
        </div>
      )}
  
        <main className="game-container">
          <canvas ref={canvasRef} className="game-canvas"></canvas>
        </main>
    </>
  );
  
}
