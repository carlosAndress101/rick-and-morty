import CharacterList from "./components/CharacterList";
import "./App.css";

const App = () => {
  return (
    <div  className="bg-dark text-white">
      <header>
        <h1 className="text-center display-1 py-4">
          Rick and Morty
        </h1>
      </header>
      <main>
            <CharacterList />
      </main>
    </div>
  );
};

export default App;
