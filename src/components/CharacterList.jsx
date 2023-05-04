import { useEffect, useState } from "react";
import Character from "./Character";
import Loading from "./Loading";


function NavPage(props){
  return (
    <header className="d-flex justify-content-between align-items-center text-white">
      <button className="btn btn-primary " onClick={()=> props.SetPage(props.page - 1)} disabled={props.page <= 1 ? true : false}>Prev {props.page < 0 ? props.page === 1: props.page -1 }</button>
      <p>Page: {props.page}</p>
      <button className="btn btn-primary " onClick={()=> props.SetPage(props.page + 1)} disabled={props.page >= 42 ? true : false}>Next {props.page +1}</button>
    </header>
  )
}

const CharacterList = () => {
  const [characters, SetCharacters] = useState([]);
  const [loading, Setloading] = useState(true);
  const [page, SetPage] = useState(1);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`https://rickandmortyapi.com/api/character?page=${page}`);
      const data = await res.json();
      Setloading(false);
      SetCharacters(data.results);
    }
    fetchData();
  }, [page]);

  return (
    <div className="container">

      <NavPage page={page} SetPage={SetPage}/>

      {loading ? (
        <Loading />
      ) : (
        <div className="row">
          {characters.map((character) => {
            return (
              <div key={character.id} className="col-md-4">
                <Character character={character} />
              </div>
            );
          })}
        </div>
      )}
      <NavPage page={page} SetPage={SetPage}/>
    </div>
  );
};

export default CharacterList;
