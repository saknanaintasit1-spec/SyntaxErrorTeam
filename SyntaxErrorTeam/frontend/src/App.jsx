import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

const Card = ({title, description}) => {
  const [count, Setter] = useState(0)
  const [awnser,setAwnser] = useState("")
  let text;
  if (awnser != ""){
  if (awnser === "4x^3 + 6x^2"){
        text = "Correct!"
      } else {
        text = "Incorrect!"
      }
    }
  return(
    <div className='card vstack'>
      <h2> {title} </h2>
      <p> {description} </p>
      <button onClick={() => Setter(count + 1)}> Click Me </button>
      <input type = "text"
      value={awnser}
      onChange={(e) => setAwnser(e.target.value)}
      />
      <p> Your Awnser: {awnser} </p>
      <p>{text}</p>
      <h3> Count: {count} </h3>
    </div>
  )
}
const App = () => {
  return(
    <div>
  <h2> Math MentorAi </h2>
  <Card title = "Question1" description = "(2x)(2x^2 + 3x)"/>
  </div>
  )

}

export default App
