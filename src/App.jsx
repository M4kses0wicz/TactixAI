import { useState } from "react";
import "./App.css";
import MainWindow from "./Components/MainWindow";
import LoadingScreen from "./Components/LoadingScreen";

function App() {
  // const [isLoading, setIsLoading] = useState(true);

  // const handleLoadingScreenClick = () => {
  //   setIsLoading(false);
  // };

  return (
    <>
      <MainWindow />
    </>
  );
}

export default App;
