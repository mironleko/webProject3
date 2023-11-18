import React, { useEffect, useRef, useState, ChangeEvent } from 'react';
import styles from '../styles/Home.module.css';

// Interface za asteroid u igri.
interface Asteroid {
  x: number;
  y: number;
  velocity: { x: number; y: number };
}

// Interface za igrača u igri.
interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}
// Početno stanje igrača na početku igre.
const initialPlayerState: Player = {
  x: 0,
  y: 0,
  width: 30,
  height: 30,
  color: 'red'
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);// Ref za canvas element u igri.
  const playerRef = useRef<Player>(initialPlayerState);// Ref za igrača u igri s početnim stanjem.
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);// Stanje koje sadrži informacije o asteroidima u igri.
  const [maxAsteroids, setMaxAsteroids] = useState<number>(10);// Stanje koje označava maksimalni broj asteroida u igri.
  const [asteroidFrequency, setAsteroidFrequency] = useState<number>(5000);// Stanje koje određuje frekvenciju generiranja asteroida (u milisekundama).
  const asteroidMaxSpeed = 5;// Maksimalna brzina asteroida.
  let animationFrameId = useRef<number>();// Ref za ID animation framea koji se koristi za animaciju igre.
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());// Vrijeme kada je igra započela (u milisekundama).
  const [bestTime, setBestTime] = useState<number>(0);// Najbolje vrijeme koje je postignuto u igri.
  const [currentUsersTime, setcurrentUsersTime] = useState<number>(0);// Trenutno vrijeme koje igrač postiže u trenutnoj sesiji igre.
  const [startingAsteroids, setStartingAsteroids] = useState<number>(5);// Broj asteroida s kojima igrač započinje igru.
  const [gameOver, setGameOver] = useState<boolean>(false);// Stanje koje označava je li igra završila (true) ili je u tijeku (false).s
  const [showStartModal, setShowStartModal] = useState(true);// Stanje koje označava je li prikazan početni modalni prozor za igru (true) ili nije (false).

// useEffect koji prikazuje početni modal ako je igra završila.
  useEffect(() => {
    if (gameOver) {
      setShowStartModal(true);
    }
  }, [gameOver]);

// useEffect koji učitava najbolje vrijeme iz localStorage-a kada se modal prikazuje.
  useEffect(() => {
    const savedBestTime = parseFloat(localStorage.getItem('bestTime') || '0');
    setBestTime(savedBestTime);
  }, []);
// Funkcija koja generira asteroid.
 const generateAsteroid = (canvas: HTMLCanvasElement): Asteroid => {
  // Generiranje slučajnih brzina za asteroid.
  const speedX = (Math.random() * 2 - 1) * asteroidMaxSpeed;
  const speedY = (Math.random() * 2 - 1) * asteroidMaxSpeed;

  let x, y;
  if (Math.random() < 0.5) {
    // Postavljanje početne pozicije asteroida izvan lijevog ili desnog ruba canvasa.
    x = Math.random() < 0.5 ? -20 : canvas.width + 20;
    y = Math.random() * canvas.height;
  } else {
    // Postavljanje početne pozicije asteroida izvan gornjeg ili donjeg ruba canvasa.
    x = Math.random() * canvas.width;
    y = Math.random() < 0.5 ? -20 : canvas.height + 20;
  }

  return {
    x,
    y,
    velocity: { x: speedX, y: speedY }
  };
};

  // Funkcija koja započinje igru.
  const startGame = () => {
    // Zatvaranje početnog modala i resetiranje stanja igre.
    setShowStartModal(false);
    setGameOver(false);
    setGameStartTime(Date.now());
  
    const canvas = canvasRef.current;
    if (canvas) {
      const initialAsteroids: Asteroid[] = [];
      for (let i = 0; i < startingAsteroids; i++) {
        // Generiranje početnih asteroida.
        initialAsteroids.push(generateAsteroid(canvas));
      }
      setAsteroids(initialAsteroids);
    }
  
    if (canvas) {
      // Postavljanje početne pozicije igrača na sredinu canvasa.
      playerRef.current = {
        ...initialPlayerState,
        x: canvas.width / 2 - initialPlayerState.width / 2,
        y: canvas.height / 2 - initialPlayerState.height / 2
      };
    }
  };
  // Funkcija koja provjerava sudar između igrača i asteroida.
  const detectCollision  = (asteroid: Asteroid): boolean => {
    return (
      playerRef.current.x < asteroid.x + 20 &&
      playerRef.current.x + playerRef.current.width > asteroid.x &&
      playerRef.current.y < asteroid.y + 20 &&
      playerRef.current.y + playerRef.current.height > asteroid.y
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Funkcije za pomicanje igrača u različitim smjerovima.

    const shiftPlayerLeft = () => {
      playerRef.current.x = (playerRef.current.x - 10 + canvas.width) % canvas.width;
    };

    const shiftPlayerRight = () => {
      playerRef.current.x = (playerRef.current.x + 10) % canvas.width;
    };

    const shiftPlayerUp = () => {
      playerRef.current.y = (playerRef.current.y - 10 + canvas.height) % canvas.height;
    };

    const shiftPlayerDown = () => {
      playerRef.current.y = (playerRef.current.y + 10) % canvas.height;
    };
    // Mapiranje tipki na funkcije za pomicanje igrača.
    const playerMovementActions = {
      'ArrowLeft': shiftPlayerLeft,
      'ArrowRight': shiftPlayerRight,
      'ArrowUp': shiftPlayerUp,
      'ArrowDown': shiftPlayerDown,
    };
    // Osluškivanje događaja pritiska tipke na tipkovnici.
    const onArrowKeyPress = (event: KeyboardEvent) => {
      const key = event.key as keyof typeof playerMovementActions;
      const movePlayer = playerMovementActions[key];

      if (movePlayer) {
        movePlayer();
      }
    };

    document.addEventListener('keydown', onArrowKeyPress);
      
    // Poništavanje osluškivanja događaja pritiska tipke kada komponenta prestane postojati.
    return () => document.removeEventListener('keydown', onArrowKeyPress);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (!context) return;
      // Funkcija za promjenu veličine canvasa kako bi odgovarala prozoru preglednika.
      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
       // Postavljanje položaja igrača u sredinu canvasa nakon promjene veličine.
        playerRef.current = {
          ...playerRef.current,
          x: canvas.width / 2 - playerRef.current.width / 2,
          y: canvas.height / 2 - playerRef.current.height / 2
        };
      };
      // Prilagodba veličine platna pri prvom renderu.
      resizeCanvas();

      // Osluškivanje promjene veličine prozora preglednika i ponovna prilagodba veličine canvasa.
      window.addEventListener('resize', resizeCanvas);
      // Poništavanje osluškivanja promjene veličine prozora preglednika kada komponenta prestane postojati.
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Funkcija za ažuriranje i renderiranje igre.
    const updateAndRender = () => {
      if (gameOver || showStartModal) return;
      // Očisti canvas prije svakog renderiranja.
      context.clearRect(0, 0, canvas.width, canvas.height);
      // Iteriraj kroz asteroide, iscrtaj ih i provjeri kolizije s igračem.
      asteroids.forEach((asteroid) => {
        const startColor = 'rgb(50, 50, 50)';
        const endColor = 'rgb(200, 200, 200)';

        const gradient = context.createLinearGradient(asteroid.x, asteroid.y, asteroid.x + 20, asteroid.y + 20);

        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, endColor); 

        context.fillStyle = gradient;
        context.shadowColor = 'black';
        context.shadowBlur = 15;
        context.fill();

        asteroid.x += asteroid.velocity.x;
        asteroid.y += asteroid.velocity.y;
      // Ponovno postavljanje asteroida unutar canvasa ako izađe izvan granica.
        if (asteroid.x > canvas.width + 20) asteroid.x = -20;
        else if (asteroid.x < -20) asteroid.x = canvas.width + 20;

        if (asteroid.y > canvas.height + 20) asteroid.y = -20;
        else if (asteroid.y < -20) asteroid.y = canvas.height + 20;

        context.fillRect(asteroid.x, asteroid.y, 20, 20);
      // Provjera kolizija s igračem i obrada rezultata.
        if (detectCollision(asteroid)) {
          setGameOver(true);
          const currentTime = Date.now();
          const duration = currentTime - gameStartTime;
          setcurrentUsersTime(duration)
          if (duration > bestTime) {
            setBestTime(duration);
            localStorage.setItem('bestTime',formatTime(duration));
          }
        }
      });

      if (!gameOver) {
        // Crta igrača ako igra još traje.
        context.fillStyle = playerRef.current.color;
        context.shadowColor = 'red';
        context.shadowBlur = 15;
        context.fill();
        context.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
        animationFrameId.current = requestAnimationFrame(updateAndRender);
      }
    };

    // Interval za dodavanje novih asteroida.
    let addAsteroidInterval = setInterval(() => {
      if (gameOver || showStartModal) return;

      if (asteroids.length < maxAsteroids) {
        setAsteroids(prevAsteroids => [
          ...prevAsteroids,
          generateAsteroid(canvas)
        ]);
      }
    }, asteroidFrequency);

    // Pokreni prvo ažuriranje i renderiranje igre.
    updateAndRender();

    // Očisti interval za dodavanje asteroida i poništi animacijski okvir kada komponenta prestane postojati.
    return () => {
      clearInterval(addAsteroidInterval);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [asteroids, maxAsteroids, asteroidFrequency, gameOver]);

  // Funkcija koja prati promjenu vrijednosti input polja.
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'maxAsteroids') {
      // Ažuriranje maksimalnog broja asteroida.
      setMaxAsteroids(value === "" ? Number(5):Number(value));
    } else if (name === 'asteroidFrequency') {
      // Ažuriranje frekvencije asteroida.
      setAsteroidFrequency(value === "" ? Number(1000):Number(value));
    }
  };
// Funkcija koja prati promjenu vrijednosti početnog broja asteroida.
  const handleStartingAsteroidsChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStartingAsteroids(event.target.value === "" ? Number(1) : Number(event.target.value));
  };

// Funkcija za formatiranje vremena u format (mm:ss.sss).
  const formatTime = (time: number): string => {
    let minutes: number = Math.floor(time / 60000);
    let seconds: number = Math.floor((time % 60000) / 1000);
    let milliseconds: number = time % 1000;
    
    // Formatiranje minuta i sekundi dodajući vodeće nule.
    const formattedMinutes: string = minutes < 10 ? '0' + minutes.toString() : minutes.toString();
    const formattedSeconds: string = seconds < 10 ? '0' + seconds.toString() : seconds.toString();
    let formattedMilliseconds: string = milliseconds.toString();
  
    // Dodavanje vodećih nula za milisekunde.
    if (milliseconds < 10) {
      formattedMilliseconds = '00' + formattedMilliseconds;
    } else if (milliseconds < 100) {
      formattedMilliseconds = '0' + formattedMilliseconds;
    }
    //Formatirano vrijeme
    return `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
  };


  return (
    <>
      {showStartModal && (
        <div className={styles.modalBackground}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{gameOver ? "Game Over" : "Welcome to Asteroids Game"}</h2>
            {gameOver && (
              <>
                <p className="mb-2">Current Time: {formatTime(currentUsersTime)}</p>
                <p className="mb-4">Best Time: {formatTime(bestTime)}</p>
              </>
            )}
            <form className="space-y-4">
              <label className={styles.modalLabel}>
                <span>Max Asteroids(minimal 5 asteroids):</span>
                <input
                  type="number"
                  name="maxAsteroids"
                  value={maxAsteroids}
                  min="5"
                  onChange={handleInputChange}
                  className={styles.modalInput}
                />
              </label>
              <label className={styles.modalLabel}>
                <span>Asteroid Generation Frequency (ms):</span>
                <input
                  type="number"
                  name="asteroidFrequency"
                  min="1000"
                  value={asteroidFrequency}
                  onChange={handleInputChange}
                  className={styles.modalInput}
                />
              </label>
              <label className={styles.modalLabel}>
                <span>Starting Asteroids:</span>
                <input
                  type="number"
                  value={startingAsteroids}
                  onChange={handleStartingAsteroidsChange}
                  min="1"
                  className={styles.modalInput}
                />
              </label>
            </form>
            <button 
              onClick={startGame}
              className={styles.modalButton}
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
