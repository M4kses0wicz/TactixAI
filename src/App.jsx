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
      {/* {isLoading && <LoadingScreen onClick={handleLoadingScreenClick} />}
      {!isLoading && ( */}
        <>
          <h1>TactiX AI</h1>
          <MainWindow />
        </>
      {/* )} */}
    </>
  );
}

export default App;
