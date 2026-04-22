import React from "react";
import logo from "../assets/Feyenoord.png"; // Placeholder
import "../styles/MainWindow/css/main-window.css"; // Reuse some styles or create new

export default function StartScreen({ onNext, onCreate }) {
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#111", color: "white" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "2rem" }}>Football Manager Clone</h1>
        
        <button 
          onClick={onNext}
          style={{ padding: "1rem 2rem", fontSize: "1.2rem", marginBottom: "1rem", backgroundColor: "#333", color: "white", border: "1px solid #555", borderRadius: "8px", cursor: "pointer" }}
        >
          Rozpocznij grę istniejącym klubem
        </button>
        
        <button 
          onClick={onCreate}
          style={{ padding: "1rem 2rem", fontSize: "1.2rem", backgroundColor: "#222", color: "white", border: "1px solid #444", borderRadius: "8px", cursor: "pointer" }}
        >
          Stwórz własny klub
        </button>
      </div>
      <div style={{ flex: 1, backgroundImage: "url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }}>
      </div>
    </div>
  );
}
