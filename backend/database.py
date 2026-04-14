import os
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship, declarative_base

# Ustawienie ścieżki tak, aby plik zawsze powstawał w folderze, w którym jest ten skrypt
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "tactix.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Konfiguracja silnika bazy danych
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELE BAZY DANYCH ---

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True) # ID z API Statorium
    name = Column(String, index=True)
    logo = Column(String)
    style = Column(String, default="Standard")
    
    # Relacja: jeden klub ma wielu piłkarzy
    players = relationship("Player", back_populates="team")

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True) # ID z API Statorium
    team_id = Column(Integer, ForeignKey("teams.id"))
    name = Column(String, index=True)
    position = Column(String)
    
    # Statystyki pod analizę Mistrala
    goals = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    passing_accuracy = Column(Float, default=0.0)
    pace = Column(Integer, default=0) 
    
    # Relacja zwrotna do klubu
    team = relationship("Team", back_populates="players")

# Funkcja tworząca tabele
def init_db():
    Base.metadata.create_all(bind=engine)
    print(f"Baza danych została zainicjowana w: {DB_PATH}")

# TO WYMUSI STWORZENIE PLIKU PO URUCHOMIENIU:
if __name__ == "__main__":
    init_db()