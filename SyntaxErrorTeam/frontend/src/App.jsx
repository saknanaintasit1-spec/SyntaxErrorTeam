import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

const Card = () => {
  return(
    <div className='card'>
      <h2> Math MentorAi </h2>
    </div>
  )
}
const App = () => {
  return(
    <div>
  <h2> Math MentorAi </h2>
  <Card />
  </div>
  )

}

export default App
