/* eslint-disable react/prop-types */

const Character = ({character}) => {
  return (
    <div className="text-center p-5">
        <div>
          <img src={character.image} alt={character.name} className="img-fluid rounded-pill"/>
          <div>
          <h2>{character.name}</h2>
          <h3>{character.species}</h3>
          <p>{character.origin.name}</p>
          </div>
      </div>
    </div>
  )
}

export default Character