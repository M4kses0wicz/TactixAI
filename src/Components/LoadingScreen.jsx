import { useState, useEffect } from "react";
import image1 from "../assets/image 1.png";
import image2 from "../assets/image 2.png";
import image4 from "../assets/image 4.png";
import image6 from "../assets/image 6.png";
import image7 from "../assets/image 7.png";
import "./LoadingScreen.css";

function LoadingScreen({ onClick }) {
  const images = [image1, image2, image4, image6, image7];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-screen" onClick={onClick}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet" />
      <div className="player-background">
        <img key={currentImageIndex} src={images[currentImageIndex]} alt="Zawodnik" className="background-image" />
      </div>
      <div className="dark-gradient"></div>
      <div className="text-content">
        <h1 className="tactix-title">Tactix AI</h1>
        <p className="subtitle">Kliknij w dowolnym miejscu, aby rozpocząć</p>
      </div>
    </div>
  );
}


export default LoadingScreen;
