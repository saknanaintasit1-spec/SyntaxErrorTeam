import { useEffect, useState } from 'react'
import './App.css'
import './mission.css'
import './quiz.css'

const COURSE_META = {
  Algebra: ['𝑥', 'blue', 'Build your equation skills'],
  'Pythagoras & Geometry': ['△', 'violet', 'Explore shapes and triangles'],
  Polynomials: ['⌁', 'orange', 'Master expressions and factoring'],
}

const AVAILABLE_LESSON_COUNT = 3

const RANK_LEVELS = [
  ['Beginner', 1, 4],
  ['Learner', 5, 9],
  ['Explorer', 10, 14],
  ['Problem Solver', 15, 19],
  ['Mathematician', 20, 29],
  ['Strategist', 30, 39],
  ['Analyst', 40, 49],
  ['Expert', 50, 59],
  ['Master', 60, 69],
  ['Grandmaster', 70, 79],
  ['Legend', 80, 100],
]

const LEVEL_REWARDS = [
  [2, '10 tokens'], [3, '10 tokens'], [5, 'Basic profile frame'], [7, '15 tokens'], [10, 'Explorer title'],
  [12, '15 tokens'], [15, 'Bronze profile frame'], [20, 'Problem Solver title'], [25, 'Silver profile frame'], [30, 'Mathematician title'],
  [35, '20 tokens'], [40, 'Gold profile frame'], [45, 'Strategist title'], [50, 'Expert profile frame'], [55, '25 tokens'],
  [60, 'Expert title'], [65, 'Master profile frame'], [70, '30 tokens'], [75, 'Master title'], [80, 'Grandmaster profile frame'],
  [85, '35 tokens'], [90, 'Grandmaster title'], [95, 'Legend profile frame'], [100, 'Legend title + Legendary profile frame + 50 tokens'],
]

function getLevelFromXp(xp = 0) {
  return Math.min(100, Math.max(1, Math.floor(xp / 100) + 1))
}

function getRankForLevel(level) {
  return RANK_LEVELS.find(([, start, end]) => level >= start && level <= end)?.[0] || 'Beginner'
}

function getLevelProgress(xp = 0) {
  const level = getLevelFromXp(xp)
  const currentLevelXp = (level - 1) * 100
  const nextLevelXp = level === 100 ? currentLevelXp : level * 100
  return { level, rank: getRankForLevel(level), currentLevelXp, nextLevelXp, percent: level === 100 ? 100 : ((xp - currentLevelXp) / 100) * 100 }
}

const TABS = [
  { id: 'journey', label: 'Journey', icon: '⌂' },
  { id: 'mission', label: 'Mission', icon: '▱' },
  { id: 'practice', label: 'Practice', icon: '✎' },
  { id: 'shop', label: 'Shop', icon: '🛒' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

const MISSION_CATALOG = [
  ['Complete 5 practice problems', 25, 5, 5],
  ['Complete 10 practice problems', 50, 10, 10],
  ['Get 5 questions correct in a row', 40, 8, 5],
  ['Complete 1 lesson', 50, 10, 1],
  ['Complete 2 lessons', 90, 18, 2],
  ['Solve 3 problems without using a hint', 35, 7, 3],
  ['Complete 10 correct steps', 35, 7, 10],
  ['Retry and solve 3 previously missed questions', 40, 8, 3],
  ['Complete a practice session with 80%+ accuracy', 45, 9, 1],
  ['Complete a practice session with 100% accuracy', 70, 15, 1],
  ['Solve 5 algebra problems', 35, 7, 5],
  ['Solve 5 Pythagoras problems', 35, 7, 5],
  ['Solve 5 polynomial problems', 35, 7, 5],
  ['Complete 1 challenge problem', 40, 8, 1],
  ['Complete 3 challenge problems', 75, 15, 3],
  ['Practice for 10 minutes', 40, 8, 10],
  ['Earn 100 XP today', 50, 10, 100],
  ['Complete practice in 2 different topics', 45, 9, 2],
  ['Complete 5 problems on the first attempt', 40, 8, 5],
  ['Complete all 3 daily missions', 75, 15, 3],
]

const SHOP_BOXES = {
  frameBox: {
    label: 'Frame Box',
    icon: '▣',
    cost: 10,
    description: 'Give your profile a little more geometry.',
    rewards: [['Simple', 'Common', 45], ['Notebook', 'Common', 30], ['Pencil', 'Common', 15], ['Blue Glow', 'Rare', 5], ['Purple Glow', 'Rare', 3], ['Golden', 'Epic', 1.5], ['Galaxy', 'Legendary', 0.5]],
  },
  titleBox: {
    label: 'Title Box',
    icon: '✦',
    cost: 10,
    description: 'Wear a title that shows how you learn.',
    rewards: [['Number Learner', 'Common', 35], ['Equation Explorer', 'Common', 25], ['Math Student', 'Common', 20], ['Problem Solver', 'Rare', 8], ['Formula Finder', 'Rare', 5], ['Math Strategist', 'Epic', 5], ['Theorem Master', 'Epic', 1.5], ['Mathematical Legend', 'Legendary', 0.5]],
  },
}

function getMissionFallback() {
  const day = new Date().toISOString().slice(0, 10)
  const seed = [...day].reduce((total, character) => total + character.charCodeAt(0), 0)
  return MISSION_CATALOG
    .map((mission, index) => ({ mission, order: (seed + index * 17) % MISSION_CATALOG.length }))
    .sort((left, right) => left.order - right.order)
    .slice(0, 3)
    .map(({ mission }, index) => {
      const [title, xp, tokens, target] = mission
      return { id: index + 1, title, xp, tokens, target, progress: 0, completed: false }
    })
}

function LevelHud({ wallet }) {
  const [open, setOpen] = useState(false)
  const progression = getLevelProgress(wallet.xp || 0)

  return <>
    <button className="level-hud" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Open level progression"><span className="level-hud-badge">{progression.level}</span><span><strong>Level {progression.level}</strong><small>{progression.rank}</small></span><b>✦ {wallet.tokens || 0}</b></button>
    {open && <aside className="level-panel"><button className="level-panel-close" onClick={() => setOpen(false)} aria-label="Close level progression">×</button><p className="eyebrow">YOUR PROGRESSION</p><div className="level-panel-heading"><div className="level-hud-badge large">{progression.level}</div><div><h2>{progression.rank}</h2><p>Level {progression.level} of 100</p></div></div><div className="level-xp-row"><span>{wallet.xp || 0} XP</span><strong>{progression.level === 100 ? 'MAX LEVEL' : `${Math.max(0, progression.nextLevelXp - (wallet.xp || 0))} XP to level ${progression.level + 1}`}</strong></div><div className="level-xp-track"><span style={{ width: `${progression.percent}%` }} /></div><h3>Level rewards</h3><div className="level-rewards">{LEVEL_REWARDS.map(([rewardLevel, reward]) => <div className={rewardLevel <= progression.level ? 'unlocked' : ''} key={rewardLevel}><span>Level {rewardLevel}</span><strong>{reward}</strong></div>)}</div><p className="profile-frame-note">Profile frames are listed as rewards for future profile customization.</p></aside>}
  </>
}

const PRACTICE_LESSONS = {
  Algebra: [
    { title: 'Identify the parts of 7x + 4', prompt: 'Practice: Identify the parts of this expression.', display: '7x + 4', steps: [['Identify the coefficient', '7'], ['Identify the variable', 'x'], ['Identify the constant', '4'], ['Identify the number of terms', '2']] },
    { title: 'Simplify 4x + 3 + 2x - 1', prompt: 'Practice: Simplify this expression.', display: '4x + 3 + 2x - 1', steps: [['Group like terms', '4x + 2x + 3 - 1'], ['Combine the x terms', '6x + 3 - 1'], ['Combine the constants', '6x + 2']] },
    { title: 'Solve 2x + 6 = 14', prompt: 'Practice: Solve this equation.', display: '2x + 6 = 14', steps: [['Subtract 6 from both sides', '2x = 8'], ['Divide both sides by 2', 'x = 4'], ['Check your answer', '2(4) + 6 = 14']] },
  ],
  'Pythagoras & Geometry': [
    { title: 'Identify the hypotenuse', prompt: 'Practice: Identify the hypotenuse in a right triangle.', display: 'Side lengths: 5, 12, 13', steps: [['Find the 90° angle', '90°'], ['Identify the side opposite the 90° angle', '13'], ['Name this side', 'hypotenuse']] },
    { title: 'Find c when a = 3 and b = 4', prompt: 'Practice: Find c using the Pythagorean theorem.', display: 'a = 3, b = 4', steps: [['Write the formula', 'a² + b² = c²'], ['Substitute the values', '3² + 4² = c²'], ['Calculate the squares', '9 + 16 = c²'], ['Add', '25 = c²'], ['Take the square root', '5 = c'], ['State the answer', 'c = 5']] },
    { title: 'Find c when the legs are 6 and 8', prompt: 'Practice: Find the missing hypotenuse.', display: 'a = 6, b = 8', steps: [['Write the formula', '6² + 8² = c²'], ['Calculate the squares', '36 + 64 = c²'], ['Add', '100 = c²'], ['Take the square root', '10 = c'], ['State the answer', 'c = 10']] },
  ],
  Polynomials: [
    { title: 'Analyze 5x² + 3x - 7', prompt: 'Practice: Analyze this polynomial.', display: '5x² + 3x - 7', steps: [['Separate the terms', '5x² | 3x | -7'], ['Identify the coefficients', '5, 3, -7'], ['Find the highest exponent', '2'], ['State the degree', '2'], ['Classify the polynomial', 'trinomial']] },
    { title: 'Subtract (x² + x - 5) from (4x² + 3x + 2)', prompt: 'Practice: Subtract the polynomials.', display: '(4x² + 3x + 2) - (x² + x - 5)', steps: [['Remove the brackets', '4x² + 3x + 2 - x² - x + 5'], ['Group like terms', '4x² - x² + 3x - x + 2 + 5'], ['Combine x² terms', '3x² + 3x - x + 2 + 5'], ['Combine x terms', '3x² + 2x + 2 + 5'], ['Combine constants', '3x² + 2x + 7']] },
    { title: 'Multiply (x + 2)(x + 3)', prompt: 'Practice: Multiply these binomials.', display: '(x + 2)(x + 3)', steps: [['Multiply the first terms', 'x²'], ['Multiply the outer terms', '3x'], ['Multiply the inner terms', '2x'], ['Multiply the last terms', '6'], ['Write all the terms', 'x² + 3x + 2x + 6'], ['Combine like terms', 'x² + 5x + 6']] },
  ],
}

function normalizePracticeAnswer(value) {
  return value.trim().toLowerCase().replaceAll('²', '^2').replaceAll('³', '^3').replaceAll('−', '-').replaceAll('×', '*').replace(/\s+/g, '')
}

const PRACTICE_TYPES = {
  Algebra: [
    ['basics', 'Algebra Basics', 'Identify coefficients, variables, constants, and terms.'],
    ['simplify', 'Simplifying Expressions', 'Combine like terms one line at a time.'],
    ['linear', 'Solving Linear Equations', 'Keep both sides balanced while solving for x.'],
  ],
  Pythagoras: [
    ['right-triangle', 'Right Triangles', 'Identify the right angle, legs, and hypotenuse.'],
    ['theorem', 'Pythagorean Theorem', 'Set up and use a² + b² = c².'],
    ['missing-side', 'Find the Missing Side', 'Square, calculate, and find an unknown side.'],
  ],
  Polynomials: [
    ['polynomial-basics', 'Polynomial Basics', 'Identify parts and classify a polynomial.'],
    ['add-subtract', 'Adding & Subtracting Polynomials', 'Group and combine like terms.'],
    ['multiply', 'Multiplying Polynomials', 'Expand products step by step.'],
  ],
}

const PYTHAGOREAN_TRIPLES = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]]
const TRIANGLE_ORIENTATIONS = [0, 90, 180, 270]

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function answerFormat(answer, instruction) {
  const prompt = `${instruction} ${answer}`.toLowerCase()
  if (prompt.includes('variable')) return 'Answer format: one variable letter, such as x'
  if (prompt.includes('coefficient') || prompt.includes('constant') || prompt.includes('exponent') || prompt.includes('degree') || prompt.includes('length') || prompt.includes('number')) return 'Answer format: one number, such as 7'
  if (prompt.includes('angle')) return 'Answer format: an angle with °, such as 90°'
  if (answer.includes('|') || prompt.includes('term')) return 'Answer format: separate terms with |, such as 3x² | 2x | 1'
  if (answer.includes(',') || prompt.includes('coefficients')) return 'Answer format: comma-separated values, such as 5, 3, -7'
  if (/^[a-z ]+$/i.test(answer)) return 'Answer format: one math word, such as monomial'
  if (answer.includes('=')) return 'Answer format: a complete equation, such as 2x = 8'
  return 'Answer format: a simplified expression, such as 6x + 2'
}

function buildPracticeProblem(category, type) {
  if (category === 'Algebra' && type === 'basics') {
    const coefficient = randomItem([3, 5, 7, 8, 9])
    const constant = randomItem([2, 4, 6, 8])
    const requested = randomItem([['coefficient', String(coefficient)], ['variable', 'x'], ['constant', String(constant)], ['number of terms', '2']])
    return { title: 'Identify the parts of an expression', display: `${coefficient}x + ${constant}`, instruction: `Type the ${requested[0]}.`, steps: [[`What is the ${requested[0]}?`, requested[1]]] }
  }

  if (category === 'Algebra' && type === 'simplify') {
    const first = randomItem([2, 3, 4, 5])
    const second = randomItem([2, 3, 4, 5])
    const constant = randomItem([5, 7, 9])
    const subtract = randomItem([1, 2, 3])
    return { title: 'Combine like terms', display: `${first}x + ${constant} + ${second}x - ${subtract}`, instruction: 'Type the next simplified line.', steps: [['Group like terms', `${first}x + ${second}x + ${constant} - ${subtract}`], ['Combine the x terms', `${first + second}x + ${constant} - ${subtract}`], ['Combine the constants', `${first + second}x + ${constant - subtract}`]] }
  }

  if (category === 'Algebra' && type === 'linear') {
    const coefficient = randomItem([2, 3, 4, 5])
    const solution = randomItem([3, 4, 5, 6])
    const constant = randomItem([4, 5, 6, 7])
    const total = coefficient * solution + constant
    return { title: 'Solve a linear equation', display: `${coefficient}x + ${constant} = ${total}`, instruction: 'Type the result of each operation.', steps: [[`Subtract ${constant} from both sides`, `${coefficient}x = ${coefficient * solution}`], [`Divide both sides by ${coefficient}`, `x = ${solution}`], ['Check your answer', `${coefficient}(${solution}) + ${constant} = ${total}`]] }
  }

  if (category === 'Pythagoras') {
    const [legA, legB, hypotenuse] = randomItem(PYTHAGOREAN_TRIPLES)
    const orientation = randomItem(TRIANGLE_ORIENTATIONS)
    const triangle = <RightTriangle legA={legA} legB={legB} hypotenuse={hypotenuse} marked={type === 'right-triangle'} orientation={orientation} />
    if (type === 'right-triangle') return { title: 'Identify the hypotenuse', display: triangle, instruction: 'Type the number on the side opposite the 90° corner.', steps: [['Type the hypotenuse length', String(hypotenuse)], ['Name the side', 'hypotenuse']] }
    if (type === 'theorem') return { title: 'Use the Pythagorean theorem', display: triangle, instruction: 'Type the exact equation requested below. Example: 3² + 4² = c²', steps: [['Type the formula', 'a² + b² = c²'], ['Substitute the side lengths', `${legA}² + ${legB}² = c²`], ['Calculate both squares', `${legA * legA} + ${legB * legB} = c²`], ['Add the squared legs', `${hypotenuse * hypotenuse} = c²`], ['Take the square root', `${hypotenuse} = c`], ['State the hypotenuse', `c = ${hypotenuse}`]] }
    return { title: 'Find the missing side', display: <RightTriangle legA={legA} legB={legB} hypotenuse={hypotenuse} marked missing orientation={orientation} />, instruction: 'Type the exact equation or value requested below. Example: 36 + 64 = c²', steps: [['Write the equation with the two known legs', `${legA}² + ${legB}² = c²`], ['Calculate both squares', `${legA * legA} + ${legB * legB} = c²`], ['Add the squared legs', `${hypotenuse * hypotenuse} = c²`], ['Take the square root', `${hypotenuse} = c`], ['State the missing side', `c = ${hypotenuse}`]] }
  }

  if (category === 'Polynomials' && type === 'polynomial-basics') {
    const coefficient = randomItem([2, 3, 4, 5, 6])
    const linear = randomItem([1, 2, 3, 4])
    const constant = randomItem([-9, -7, 5, 8])
    return { id: `${coefficient}x2-${linear}x-${constant}`, title: 'Analyze a polynomial', display: `${coefficient}x² + ${linear}x ${constant < 0 ? '−' : '+'} ${Math.abs(constant)}`, instruction: 'Type the exact answer requested below. Example: 5x² | 3x | -7', steps: [['Separate the terms with vertical bars', `${coefficient}x² | ${linear}x | ${constant}`], ['List the coefficients separated by commas', `${coefficient}, ${linear}, ${constant}`], ['Type the highest exponent', '2'], ['Type the degree', '2'], ['Type the classification', 'trinomial']] }
  }
  if (category === 'Polynomials' && type === 'add-subtract') {
    const first = randomItem([3, 4, 5])
    const second = randomItem([1, 2, 3])
    const firstLinear = randomItem([2, 3, 4])
    const secondLinear = randomItem([1, 2, 3])
    const firstConstant = randomItem([2, 4, 6])
    const secondConstant = randomItem([1, 3, 5])
    return { id: `subtract-${first}-${second}-${firstLinear}-${secondLinear}`, title: 'Subtract polynomials', display: `(${first}x² + ${firstLinear}x + ${firstConstant}) - (${second}x² + ${secondLinear}x - ${secondConstant})`, instruction: 'Type the exact next line after the instruction.', steps: [['Remove the brackets and distribute the minus sign', `${first}x² + ${firstLinear}x + ${firstConstant} - ${second}x² - ${secondLinear}x + ${secondConstant}`], ['Group matching powers and constants', `${first}x² - ${second}x² + ${firstLinear}x - ${secondLinear}x + ${firstConstant} + ${secondConstant}`], ['Combine the x² terms', `${first - second}x² + ${firstLinear}x - ${secondLinear}x + ${firstConstant} + ${secondConstant}`], ['Combine the x terms', `${first - second}x² + ${firstLinear - secondLinear}x + ${firstConstant} + ${secondConstant}`], ['Combine the constants', `${first - second}x² + ${firstLinear - secondLinear}x + ${firstConstant + secondConstant}`]] }
  }
  const firstFactor = randomItem([2, 3, 4])
  const secondFactor = randomItem([2, 3, 5])
  return { id: `multiply-${firstFactor}-${secondFactor}`, title: 'Multiply polynomials', display: `(x + ${firstFactor})(x + ${secondFactor})`, instruction: 'Type the exact product requested below.', steps: [['Multiply the first terms', 'x²'], ['Multiply the outer terms', `${secondFactor}x`], ['Multiply the inner terms', `${firstFactor}x`], ['Multiply the last terms', `${firstFactor * secondFactor}`], ['Write all four products in order', `x² + ${secondFactor}x + ${firstFactor}x + ${firstFactor * secondFactor}`], ['Combine the like terms', `x² + ${firstFactor + secondFactor}x + ${firstFactor * secondFactor}`]] }
}

function createPracticeProblem(category, type, previousId = '') {
  let problem
  let attempts = 0
  do {
    problem = buildPracticeProblem(category, type)
    problem.id ||= `${category}-${type}-${problem.title}-${problem.steps.map(step => step[1]).join('|')}`
    attempts += 1
  } while (problem.id === previousId && attempts < 8)
  return problem
}

function MissionCard({ mission }) {
  const progressPercent = (mission.progress / mission.target) * 100
  const iconClass = mission.id % 3 === 1 ? 'purple' : mission.id % 3 === 2 ? 'blue' : 'green'

  return <article className="mission-card">
    <div className={`mission-icon ${iconClass}`}>✦</div>
    <h2>{mission.title}</h2>
    <div className="mission-progress">
      <div className="progress-label"><span>Progress</span><strong>{mission.progress}/{mission.target}</strong></div>
      <div className="progress-track"><span style={{ width: `${progressPercent}%` }} /></div>
    </div>
    <footer><span className="points-reward">{mission.xp} XP · {mission.tokens} tokens</span><span>{mission.completed ? 'Complete' : 'Reward'}</span></footer>
  </article>
}

function MissionScreen({ wallet }) {
  const missions = wallet.missions?.length ? wallet.missions : getMissionFallback()
  const completedMissions = missions.filter(mission => mission.completed).length

  return <section className="screen mission-screen">
    <header className="mission-header">
      <div><p>Total Daily Progress</p><div className="header-progress"><span style={{ width: `${missions.length ? (completedMissions / missions.length) * 100 : 0}%` }} /></div></div>
      <strong>{completedMissions}/{missions.length}</strong><span className="mission-time">Today’s focus</span>
    </header>
    <div className="mission-title-row"><div><h1>Daily Missions</h1><p className="wallet-xp">{wallet.xp || 0} XP earned</p></div><span className="coin-balance" aria-label={`${wallet.tokens || 0} tokens available`}>✦ {wallet.tokens || 0}</span></div>
    <div className="mission-list">{missions.map(mission => <MissionCard key={mission.id} mission={mission} />)}</div>
  </section>
}

function PracticeProblem({ category, type, onBack, onActivity, onHint, onSkip }) {
  const [problem, setProblem] = useState(() => createPracticeProblem(category, type))
  const [step, setStep] = useState(0)
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState('')
  const [problemVersion, setProblemVersion] = useState(0)
  const [skipped, setSkipped] = useState(false)
  const [usedHint, setUsedHint] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [hint, setHint] = useState('')
  const currentStep = problem.steps[step]
  const complete = step === problem.steps.length - 1

  function advanceStep() {
    if (complete) {
      onActivity({ kind: 'practice', topic: category, correct: mistakes === 0, firstAttempt: mistakes === 0 && !usedHint, usedHint, correctSteps: Math.max(0, problem.steps.length - (usedHint ? 1 : 0)), accuracy: mistakes === 0 && !usedHint ? 1 : Math.max(0.8, 1 - mistakes / (problem.steps.length + 1)) })
      setProblem(createPracticeProblem(category, type, problem.id))
      setStep(0)
      setProblemVersion(version => version + 1)
    } else setStep(step + 1)
    setValue('')
    setFeedback('')
    setSkipped(false)
    setUsedHint(false)
    setMistakes(0)
    setHint('')
  }

  function checkAnswer(event) {
    event.preventDefault()
    if (normalizePracticeAnswer(value) === normalizePracticeAnswer(currentStep[1])) {
      if (complete) {
        advanceStep()
      } else setStep(step + 1)
      setValue('')
      setFeedback('')
      return
    }
    setMistakes(count => count + 1)
    setFeedback(`Not quite. ${currentStep[0]} and check each symbol carefully.`)
  }

  async function skipStep() {
    const result = await onSkip()
    if (!result.ok) {
      setFeedback(result.message)
      return
    }
    setSkipped(true)
    setUsedHint(true)
    setValue('')
    setFeedback(`Answer: ${currentStep[1]}`)
  }

  async function requestHint() {
    const result = await onHint()
    if (!result.ok) {
      setFeedback(result.message)
      return
    }
    setUsedHint(true)
    setHint(`Hint: focus on ${currentStep[0].toLowerCase()}. ${answerFormat(currentStep[1], currentStep[0])}`)
  }

  return <section className="practice-problem-view"><button className="practice-back" onClick={onBack}>← All problem types</button><div className="practice-problem-header"><div><p className="eyebrow">{category.toUpperCase()} · PRACTICE</p><h2>{problem.title}</h2></div><span>Step {step + 1} of {problem.steps.length}</span></div><div className="practice-progress"><span style={{ width: `${(step / problem.steps.length) * 100}%` }} /></div><div key={problemVersion} className="problem-transition"><div className="generated-problem"><p>Problem</p><div>{problem.display}</div></div>{step > 0 && <div className="last-step"><strong>Last step completed</strong><span>{problem.steps[step - 1][1]}</span></div>}<div className="practice-task"><strong>{step === 0 ? 'Your task' : `Step ${step + 1}`}</strong><p>{currentStep[0]}</p><small>{problem.instruction}</small><em>{answerFormat(currentStep[1], currentStep[0])}</em></div>{hint && <p className="hint-message">{hint}</p>}</div><form className="generated-answer" onSubmit={checkAnswer}><label htmlFor="generated-practice-answer">Your answer</label><input id="generated-practice-answer" autoFocus disabled={skipped} value={value} onChange={event => { setValue(event.target.value); setFeedback('') }} autoComplete="off" /><div className="practice-actions"><button type="submit" disabled={skipped || !value.trim()}>{complete ? 'Finish and generate another' : 'Check answer'} <span>→</span></button><button type="button" className="hint-button" onClick={requestHint} disabled={skipped}>Hint · 1 token</button>{skipped ? <button type="button" className="continue-step" onClick={advanceStep}>{complete ? 'Generate next problem' : 'Continue to next step'} <span>→</span></button> : <button type="button" className="skip-step" onClick={skipStep}>Skip step · 2 tokens</button>}</div></form>{feedback && <p className={`practice-feedback ${skipped ? 'revealed-answer' : ''}`}>{feedback}</p>}</section>
}

function PracticeHub({ onActivity, onHint, onSkip }) {
  const [selection, setSelection] = useState(null)
  const categories = Object.entries(PRACTICE_TYPES)
  if (selection) return <PracticeProblem category={selection.category} type={selection.type} onBack={() => setSelection(null)} onActivity={onActivity} onHint={onHint} onSkip={onSkip} />

  return <section className="screen practice-hub"><header className="practice-hub-header"><p className="eyebrow">BUILD YOUR SKILLS</p><h1>Practice</h1><span>Choose a problem type and solve a fresh problem.</span></header><div className="practice-sections">{categories.map(([category, types]) => <section className={`practice-section practice-${category.toLowerCase().replace(' ', '-')}`} key={category}><header><span>{category === 'Algebra' ? '𝑥' : category === 'Pythagoras' ? '△' : '⌁'}</span><div><h2>{category}</h2><p>Choose a focus area</p></div></header><div className="practice-type-list">{types.map(([type, title, description]) => <button key={type} onClick={() => setSelection({ category, type })}><strong>{title}</strong><small>{description}</small><em>Start <span>→</span></em></button>)}</div></section>)}</div></section>
}

function ShopScreen({ wallet, onPurchase, onBoost }) {
  const [clock, setClock] = useState(Date.now())
  const [opening, setOpening] = useState(null)
  const [reward, setReward] = useState(null)
  const boostSeconds = wallet.xpBoostUntil ? Math.max(0, Math.ceil((wallet.xpBoostUntil - clock) / 1000)) : 0
  const boostMinutes = Math.ceil(boostSeconds / 60)
  const ownedFrames = wallet.collection?.frames || []
  const ownedTitles = wallet.collection?.titles || []

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  async function openBox(id) {
    setReward(null)
    setOpening(id)
    const result = await onPurchase(id)
    window.setTimeout(() => {
      setOpening(null)
      if (result?.reward) setReward(result)
    }, 900)
  }

  function formatBoostTime(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  }

  return <section className="screen shop-screen">
    <header className="shop-header"><div><p className="eyebrow">CUSTOMIZE YOUR PROFILE</p><h1>Math Shop</h1><span>Spend tokens on frames, titles, and focused XP time.</span></div><strong>✦ {wallet.tokens || 0}</strong></header>
    <div className="shop-grid">{Object.entries(SHOP_BOXES).map(([id, box]) => <article className={`shop-box ${id} ${opening === id ? 'opening' : ''}`} key={id}><div className="shop-box-art"><span>{box.icon}</span><i>{id === 'frameBox' ? 'a + b' : 'x² + y²'}</i>{opening === id && <b className="box-opening-label">Opening...</b>}</div><div className="shop-box-copy"><p className="eyebrow">MYSTERY BOX</p><h2>{box.label}</h2><p>{box.description}</p><button onClick={() => openBox(id)} disabled={opening !== null || (wallet.tokens || 0) < box.cost}>Open for {box.cost} tokens <span>→</span></button></div><div className="drop-table">{box.rewards.map(([name, rarity, rate]) => <div className={rarity.toLowerCase()} key={name}><span>{name}</span><strong>{rate}%</strong></div>)}</div></article>)}</div>
    <section className={`boost-card ${boostSeconds > 0 ? 'boost-active' : ''}`}><div><p className="eyebrow">{boostSeconds > 0 ? 'BOOST ACTIVE' : 'LIMITED BOOST'}</p><h2>XP surge</h2><p>{boostSeconds > 0 ? `${formatBoostTime(boostSeconds)} remaining at 2× XP.` : 'Double your XP earnings for the next 30 minutes.'}</p></div><button onClick={onBoost} disabled={boostSeconds > 0 || (wallet.tokens || 0) < 30}>{boostSeconds > 0 ? `${formatBoostTime(boostSeconds)} active` : '2× XP · 30 tokens'}</button></section>
    <section className="collection-strip"><div><p className="eyebrow">YOUR COLLECTION</p><h2>{wallet.activeTitle || 'Number Learner'}</h2><span>{ownedFrames.length} frames · {ownedTitles.length} titles discovered</span></div><div className={`collection-frame ${String(wallet.activeFrame || 'Simple').toLowerCase().replace(' ', '-')}`}><span>{wallet.activeFrame || 'Simple'}</span></div></section>
    {reward && <div className="shop-reveal"><button className="shop-reveal-close" onClick={() => setReward(null)} aria-label="Close reward">×</button><span className="reveal-spark">✦</span><p className="eyebrow">{reward.isNew ? 'ADDED TO PROFILES' : 'ALREADY OWNED'}</p><h2>{reward.reward.name}</h2><strong>{reward.reward.rarity}</strong><p>{reward.isNew ? 'You can equip this reward in Settings.' : 'Open another box to discover something new.'}</p></div>}
  </section>
}

function SettingsScreen({ wallet, onSaveProfile }) {
  const [profileName, setProfileName] = useState(wallet.profileName || 'Math Learner')
  const [activeFrame, setActiveFrame] = useState(wallet.activeFrame || 'Simple')
  const [activeTitle, setActiveTitle] = useState(wallet.activeTitle || 'Number Learner')
  const frames = ['Simple', ...(wallet.collection?.frames || [])].filter((item, index, list) => list.indexOf(item) === index)
  const titles = ['Number Learner', ...(wallet.collection?.titles || [])].filter((item, index, list) => list.indexOf(item) === index)

  return <section className="screen settings-screen">
    <header className="settings-header"><p className="eyebrow">YOUR IDENTITY</p><h1>Profile settings</h1><span>Choose how you appear while you learn.</span></header>
    <form className="profile-editor" onSubmit={event => { event.preventDefault(); onSaveProfile({ profileName, activeFrame, activeTitle }) }}>
      <div className={`profile-preview ${activeFrame.toLowerCase().replace(' ', '-')}`}><span className="profile-avatar">{profileName.slice(0, 1).toUpperCase()}</span><div><strong>{profileName}</strong><small>{activeTitle}</small></div></div>
      <label>Display name<input maxLength="24" value={profileName} onChange={event => setProfileName(event.target.value)} /></label>
      <fieldset><legend>Profile frame</legend><div className="profile-options">{frames.map(frame => <button type="button" className={activeFrame === frame ? 'selected' : ''} key={frame} onClick={() => setActiveFrame(frame)}><span className={`option-frame ${frame.toLowerCase().replace(' ', '-')}`} /><strong>{frame}</strong>{activeFrame === frame && <em>Equipped</em>}</button>)}</div></fieldset>
      <fieldset><legend>Profile title</legend><div className="title-options">{titles.map(title => <button type="button" className={activeTitle === title ? 'selected' : ''} key={title} onClick={() => setActiveTitle(title)}><strong>{title}</strong>{activeTitle === title && <em>Equipped</em>}</button>)}</div></fieldset>
      <button className="save-profile" type="submit">Save profile <span>→</span></button>
    </form>
  </section>
}

function PlaceholderScreen({ tab, coins }) {
  return <section className="screen placeholder-screen">
    <span className="placeholder-icon">{tab.icon}</span>
    <p>{tab.label.toUpperCase()}</p>
    <h1>{tab.label} is coming soon</h1>
    <span>This screen is ready for its next feature.</span>
    {tab.id === 'shop' && <div className="shop-balance">✦ {coins} points available</div>}
  </section>
}

function TabBar({ activeTab, onChange }) {
  return <nav className="tab-bar" aria-label="Main navigation">
    {TABS.map(tab => <button aria-current={tab.id === activeTab ? 'page' : undefined} className={tab.id === activeTab ? 'active' : ''} key={tab.id} onClick={() => onChange(tab.id)}><span>{tab.icon}</span>{tab.label}</button>)}
  </nav>
}

function StatusRail({ wallet, course, onMission, onJourney }) {
  const [clock, setClock] = useState(Date.now())
  const progression = getLevelProgress(wallet.xp || 0)
  const missions = wallet.missions?.length ? wallet.missions : getMissionFallback()
  const completedMissions = missions.filter(mission => mission.completed).length
  const boostSeconds = wallet.xpBoostUntil ? Math.max(0, Math.ceil((wallet.xpBoostUntil - clock) / 1000)) : 0
  const journeyMeta = COURSE_META[course] || ['⌂', 'blue', 'Choose a learning path']

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return <aside className="status-rail">
    <div className="rail-topline"><button className="rail-journey" onClick={onJourney}><span className={`rail-journey-icon ${journeyMeta[1]}`}>{journeyMeta[0]}</span><div><p>ACTIVE JOURNEY</p><strong>{course || 'Choose a journey'}</strong></div><b>→</b></button><div className="rail-wallet"><span>✦</span><strong>{wallet.tokens || 0}</strong></div></div>
    <section className="rail-level"><div className="rail-level-heading"><span className="level-hud-badge">{progression.level}</span><div><p>LEVEL {progression.level}</p><strong>{progression.rank}</strong></div></div><div className="rail-xp-label"><span>{wallet.xp || 0} XP</span><span>{progression.level === 100 ? 'MAX' : `${Math.max(0, progression.nextLevelXp - (wallet.xp || 0))} XP to go`}</span></div><div className="level-xp-track"><span style={{ width: `${progression.percent}%` }} /></div></section>
    <section className="rail-promo"><div><h2>Keep learning</h2><p>Build your streak with one more focused practice session.</p></div><span>✦</span><button onClick={() => onMission()}>VIEW MISSIONS</button></section>
    <section className={`rail-boost ${boostSeconds > 0 ? 'active' : ''}`}><span>2×</span><div><p>{boostSeconds > 0 ? 'XP SURGE ACTIVE' : 'XP SURGE'}</p><strong>{boostSeconds > 0 ? `${Math.floor(boostSeconds / 60)}:${String(boostSeconds % 60).padStart(2, '0')} remaining` : 'Visit Shop to activate'}</strong></div></section>
    <section className="rail-missions"><div className="rail-section-heading"><div><p>DAILY MISSIONS</p><strong>{completedMissions}/{missions.length} complete</strong></div><button onClick={onMission}>View</button></div>{missions.map(mission => <div className="rail-mission-item" key={mission.id}><span>{mission.title}</span><div className="rail-mission-track"><i style={{ width: `${Math.min(100, (mission.progress / mission.target) * 100)}%` }} /></div><small>{mission.progress}/{mission.target}</small></div>)}</section>
  </aside>
}

function AppFrame({ children, activeTab, onChange, wallet, course, onMission, onJourney }) {
  return <main className="app-frame"><TabBar activeTab={activeTab} onChange={onChange} /><section className="app-center">{children}</section><StatusRail wallet={wallet} course={course} onMission={onMission} onJourney={onJourney} /></main>
}

function RightTriangle({ legA = 3, legB = 4, hypotenuse = 5, missing = false, orientation = 0 }) {
  return <svg className="right-triangle" style={{ transform: `rotate(${orientation}deg)` }} viewBox="0 0 220 175" role="img" aria-label="right triangle"><polygon points="30,145 185,145 185,40" /><path className="right-angle" d="M 165 145 L 165 125 L 185 125" /><text className="triangle-side" x="15" y="101" transform={`rotate(${-orientation} 15 101)`}>{legA}</text><text className="triangle-side" x="104" y="164" transform={`rotate(${-orientation} 104 164)`}>{legB}</text><text className="triangle-value" x="194" y="36" transform={`rotate(${-orientation} 194 36)`}>{missing ? '?' : hypotenuse}</text></svg>
}

function Animation({ type }) {
  const [scene, setScene] = useState(0)
  const view = {
    expression: [
      [<div className="scene-mystery"><b>7</b><strong>→</strong><b>[ ? ]</b><strong>→</strong><b>x</b></div>, 'x is a variable. It represents a number that can change.'],
      [<div className="scene-blocks"><i>x</i><i>x</i><i>x</i><b>3 × x</b><strong>→</strong><em>3x + 5</em></div>, 'Three x blocks become 3x, then a constant 5 joins the expression.'],
      [<div className="scene-label-expression"><b>3<small>coefficient</small></b><b>x<small>variable</small></b><b>3x<small>term</small></b><b>5<small>constant</small></b></div>, '3x + 5 has two terms: 3x and 5.'],
    ],
    blocks: [
      [<div className="scene-blocks"><i>x</i><i>x</i><i>x</i><strong>+</strong><i>x</i><i>x</i></div>, '3x + 2x becomes five x blocks.'],
      [<div className="scene-blocks merge"><i>x</i><i>x</i><i>x</i><i>x</i><i>x</i></div>, '3 + 2 = 5, so 3x + 2x = 5x.'],
      [<div className="scene-blocks unlike"><i>x</i><i>x</i><i>x</i><strong>+</strong><em>y</em><em>y</em></div>, 'x blocks and y blocks cannot combine because they are unlike terms.'],
      [<div className="scene-equation">4x + 3 + 2x + 5 <strong>→</strong> 6x + 8</div>, 'Group like terms first, then combine their coefficients.'],
    ],
    balance: [
      [<div className="scene-balance"><b>[ x ] + ■■■■</b><i>⚖</i><b>■■■■■■■■■</b></div>, 'The equation starts balanced: x + 4 = 9.'],
      [<div className="scene-balance"><b>[ x ]</b><i>⚖</i><b>■■■■■</b></div>, 'Remove four blocks from both sides to keep the scale level.'],
      [<div className="scene-equation">x + 4 = 9 <strong>→</strong> x = 5</div>, 'Subtracting 4 from both sides isolates x.'],
    ],
    triangle: [
      [<RightTriangle />, 'A right triangle has one angle measuring exactly 90°.'],
      [<RightTriangle marked />, 'The hypotenuse is the side opposite the 90° angle.'],
      [<RightTriangle marked orientation={90} />, 'Even when the triangle rotates, the opposite side remains the hypotenuse.'],
    ],
    squares: [
      [<div className="scene-squares"><i>3 × 3<br />= 9</i><i>4 × 4<br />= 16</i><b>5 × 5<br />= 25</b></div>, 'Squares are built on each side of a 3–4–5 right triangle.'],
      [<div className="scene-equation">9 + 16 = 25</div>, 'The two smaller square areas equal the largest square area.'],
      [<div className="scene-equation">3² + 4² = 5² <strong>→</strong> a² + b² = c²</div>, 'This is the Pythagorean theorem.'],
    ],
    'missing-side': [
      [<RightTriangle marked missing />, 'The question mark is the hypotenuse.'],
      [<div className="scene-equation">6² + 8² = c² <strong>→</strong> 36 + 64 = c²</div>, 'Substitute the known side lengths and calculate.'],
      [<div className="scene-equation">100 = c² <strong>→</strong> √100 = √c² <strong>→</strong> c = 10</div>, 'Take the square root to find the missing side.'],
    ],
    polynomial: [
      [<div className="scene-equation">4x² + 3x − 7</div>, 'The plus and minus signs split the expression into three terms.'],
      [<div className="scene-label-expression"><b>4<small>coefficient</small></b><b>x<small>variable</small></b><b>2<small>exponent</small></b><b>−7<small>constant</small></b></div>, '4x² expands to 4 × x × x.'],
      [<div className="scene-equation">4x² + 3x − 7 <strong>→</strong> degree 2</div>, 'The highest exponent, 2, is the degree.'],
    ],
    grouping: [
      [<div className="scene-groups"><b>3x² + 2x²</b><i>2x + 5x</i><em>4 − 1</em></div>, 'Remove the brackets and move matching terms together.'],
      [<div className="scene-equation">5x² + 7x + 3</div>, 'Combine each group of like terms.'],
      [<div className="scene-equation">(5x + 7) − (2x + 3) <strong>→</strong> 5x + 7 − 2x − 3</div>, 'A subtraction sign changes the sign of every term in its bracket.'],
    ],
    'area-model': [
      [<div className="scene-area"><span>x</span><span>2</span><b>x</b><i>x²</i><i>2x</i><b>3</b><i>3x</i><i>6</i></div>, 'Every row multiplies every column in the area model.'],
      [<div className="scene-equation">x² + 2x + 3x + 6</div>, 'The four rectangles give four products.'],
      [<div className="scene-equation">x² + 5x + 6</div>, 'Combine the matching middle terms: 2x + 3x = 5x.'],
    ],
  }[type] || []
  const [visual, caption] = view[scene]
  const isLastScene = scene === view.length - 1

  function showNextScene() {
    setScene((scene + 1) % view.length)
  }

  return <section className="math-animation accurate-animation"><div className="scene-counter">Scene {scene + 1} / {view.length}</div>{visual}<p>{caption}</p><button onClick={showNextScene}>{isLastScene ? 'Replay animation' : 'Next scene →'}</button></section>
}

function LessonIntro({ course, data, showTheory, setShowTheory, startQuiz, skipToPractice, close }) {
  return <main className="lesson-page"><header className="lesson-nav"><button onClick={close}>← Back to path</button><span>LESSON · {course}</span><button className="skip" onClick={skipToPractice}>Skip to practice · 2 tokens</button></header><section className={`lesson-launch ${showTheory ? '' : 'theory-hidden'}`}>
    {showTheory && <article className="theory-panel"><p className="eyebrow">{course.toUpperCase()} · FOUNDATIONS</p><h1>{data.title}</h1><p className="theory-intro">{data.intro}</p><section className="info-card"><h2>Key components</h2>{data.components.map(([name, description]) => <p key={name}><i>i</i><b>{name}:</b> {description}</p>)}</section><section className="info-card"><h2>How it works</h2><p>{data.intro} Follow the visual, work through the steps, then test yourself.</p></section><section className="interactive"><b>Interactive animation</b><Animation type={data.animation} /></section><button className="theory-toggle" onClick={() => setShowTheory(false)}>Hide theory</button></article>}
    <aside className="quiz-launch"><span className="quiz-launch-number">{data.quiz.length}</span><p className="eyebrow">READY WHEN YOU ARE</p><h2>Quick check</h2><p>Test what you learned, then work through guided practice one step at a time.</p><div className="launch-actions"><button className="quiz-button" onClick={startQuiz}>Start quiz <span>→</span></button><button className="secondary-action" onClick={skipToPractice}>Skip to practice · 2 tokens</button></div>{!showTheory && <button className="theory-toggle" onClick={() => setShowTheory(true)}>Show theory</button>}</aside>
  </section></main>
}

function PracticeScreen({ course, lessonIndex, close, complete, onHint, onSkip }) {
  const practice = PRACTICE_LESSONS[course][lessonIndex]
  const [step, setStep] = useState(0)
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState('')
  const [skipped, setSkipped] = useState(false)
  const [hint, setHint] = useState('')
  const currentStep = practice.steps[step]
  const progressPercent = (step / practice.steps.length) * 100

  function advanceStep() {
    if (step === practice.steps.length - 1) {
      complete()
      return
    }
    setStep(step + 1)
    setValue('')
    setFeedback('')
    setSkipped(false)
    setHint('')
  }

  function checkAnswer(event) {
    event.preventDefault()
    if (normalizePracticeAnswer(value) === normalizePracticeAnswer(currentStep[1])) {
      advanceStep()
      return
    }

    setFeedback(`Not quite. Check the instruction: ${currentStep[0].toLowerCase()}. Try the next line carefully.`)
  }

  async function skipStep() {
    const result = await onSkip()
    if (!result.ok) {
      setFeedback(result.message)
      return
    }
    setSkipped(true)
    setValue('')
    setFeedback(`Answer: ${currentStep[1]}`)
  }

  async function requestHint() {
    const result = await onHint()
    if (!result.ok) {
      setFeedback(result.message)
      return
    }
    setHint(`Hint: ${currentStep[0]}. ${answerFormat(currentStep[1], currentStep[0])}`)
  }

  return <main className="lesson-page practice-page"><header className="lesson-nav"><button onClick={close}>← Back to path</button><span>PRACTICE · {step + 1} / {practice.steps.length}</span><button className="skip" onClick={close}>Exit</button></header><section className="practice-wrap"><p className="eyebrow">{course} · GUIDED PRACTICE</p><div className="practice-step-counter"><strong>Step {step + 1}</strong><span>of {practice.steps.length}</span><em>{step} completed</em></div><div className="quiz-progress-meta"><span>{practice.steps.length - step} {practice.steps.length - step === 1 ? 'step' : 'steps'} left</span><strong>{Math.round(progressPercent)}%</strong></div><div className="quiz-progress"><span style={{ width: `${progressPercent}%` }} /></div><p className="practice-prompt">{practice.prompt}</p><div className="practice-problem">{practice.display}</div><h1>{practice.title}</h1><p className="practice-instruction">{currentStep[0]}</p><p className="practice-format">{answerFormat(currentStep[1], currentStep[0])}</p>{hint && <p className="hint-message">{hint}</p>}<form onSubmit={checkAnswer}><label htmlFor="practice-answer">Type the next line</label><input id="practice-answer" autoFocus disabled={skipped} value={value} onChange={event => { setValue(event.target.value); setFeedback('') }} autoComplete="off" /><div className="practice-actions"><button type="submit" disabled={skipped || !value.trim()}>Check answer <span>→</span></button><button type="button" className="hint-button" onClick={requestHint} disabled={skipped}>Hint · 1 token</button>{skipped ? <button type="button" className="continue-step" onClick={advanceStep}>{step === practice.steps.length - 1 ? 'Finish practice' : 'Continue to next step'} <span>→</span></button> : <button type="button" className="skip-step" onClick={skipStep}>Skip step · 2 tokens</button>}</div></form>{feedback && <p className={`practice-feedback ${skipped ? 'revealed-answer' : ''}`}>{feedback}</p>}</section></main>
}

function LessonPage({ course, index, data, close, complete, onHint, onSkip }) {
  const [screen, setScreen] = useState('lesson')
  const [showTheory, setShowTheory] = useState(true)
  const [quizQueue, setQuizQueue] = useState(() => data.quiz.map((_, quizIndex) => quizIndex))
  const [questionPosition, setQuestionPosition] = useState(0)
  const [missedQuestions, setMissedQuestions] = useState([])
  const [isRetryPass, setIsRetryPass] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [showQuizTheory, setShowQuizTheory] = useState(false)
  const [hint, setHint] = useState('')
  const question = quizQueue[questionPosition]
  const quiz = data.quiz[question]
  const correct = answer === quiz.answer
  const questionsLeft = quizQueue.length - questionPosition
  const progressPercent = ((questionPosition + (answer !== null ? 1 : 0)) / quizQueue.length) * 100

  function nextQuestion() {
    const updatedMissedQuestions = correct ? missedQuestions : [...missedQuestions, question]

    if (questionPosition < quizQueue.length - 1) {
      setMissedQuestions(isRetryPass ? missedQuestions : updatedMissedQuestions)
      setQuestionPosition(questionPosition + 1)
      setAnswer(null)
      return
    }

    if (!isRetryPass && updatedMissedQuestions.length > 0) {
      setQuizQueue(updatedMissedQuestions)
      setMissedQuestions([])
      setIsRetryPass(true)
      setQuestionPosition(0)
      setAnswer(null)
      return
    }

    setScreen('practice')
  }

  async function skipToPractice() {
    const result = await onSkip()
    if (result.ok) setScreen('practice')
  }

  async function requestQuizHint() {
    const result = await onHint()
    if (!result.ok) {
      setHint(result.message)
      return
    }
    setHint('Hint: identify the rule being tested, then compare each answer with the question wording.')
  }

  if (screen === 'practice') return <PracticeScreen course={course} lessonIndex={index} close={close} complete={complete} onHint={onHint} onSkip={onSkip} />
  if (screen === 'quiz') return <main className="lesson-page"><header className="lesson-nav"><button onClick={close}>← Back to path</button><span>QUIZ {questionPosition + 1} / {quizQueue.length}</span><button className="skip" onClick={skipToPractice}>Skip to practice · 2 tokens</button></header><section className="quiz-wrap"><div className="quiz-theory-row"><p className="eyebrow">{course} · {data.title}</p><button className="theory-toggle quiz-theory-toggle" onClick={() => setShowQuizTheory(!showQuizTheory)}>{showQuizTheory ? 'Hide theory' : 'View theory'}</button></div>{showQuizTheory && <aside className="quiz-theory"><h2>{data.title}</h2><p>{data.intro}</p>{data.components.map(([name, description]) => <p key={name}><b>{name}:</b> {description}</p>)}<Animation type={data.animation} /></aside>}<div className="quiz-progress-meta"><span>{questionsLeft} {questionsLeft === 1 ? 'question' : 'questions'} left</span><strong>{Math.round(progressPercent)}%</strong></div><div className="quiz-progress"><span style={{ width: `${progressPercent}%` }} /></div><div className="quiz-number">{questionPosition + 1}</div><h1>Quick check</h1><h2>{quiz.question}</h2>{hint && <p className="hint-message">{hint}</p>}<div className="answers">{quiz.options.map(option => <button disabled={answer !== null} key={option} className={answer === option ? (correct ? 'right' : 'wrong') : ''} onClick={() => setAnswer(option)}><span>{option}</span></button>)}</div>{answer === null && <button type="button" className="hint-button quiz-hint-button" onClick={requestQuizHint}>Hint · 1 token</button>}{answer !== null && <div className={`feedback ${correct ? 'good' : ''}`}><b>{correct ? 'Nice work!' : 'Let’s clear that up.'}</b><p>{quiz.explanations?.[answer] || quiz.explanation || `Your answer: ${answer}. The correct answer is ${quiz.answer}; review the animation and try that rule again.`}</p><button onClick={nextQuestion}>{questionPosition === quizQueue.length - 1 ? (isRetryPass ? 'Finish lesson →' : (missedQuestions.length || !correct ? 'Retry missed questions →' : 'Finish lesson →')) : 'Next question →'}</button></div>}</section></main>
  return <LessonIntro course={course} data={data} showTheory={showTheory} setShowTheory={setShowTheory} startQuiz={() => setScreen('quiz')} skipToPractice={skipToPractice} close={close} />
}

function App() {
  const [courses, setCourses] = useState([])
  const [progress, setProgress] = useState({})
  const [course, setCourse] = useState(null)
  const [notice, setNotice] = useState(null)
  const [lessonData, setLessonData] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('mission')
  const [walletNotice, setWalletNotice] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/courses').then(response => response.json()),
      fetch('/api/progress').then(response => response.json()),
    ])
      .then(([courseData, savedProgress]) => {
        setCourses(courseData)
        setProgress(savedProgress)
      })
      .catch(() => {
        setError('Start the backend server to load courses and save progress.')
      })
  }, [])

  const selected = courses.find(item => item.name === course)
  const completed = progress[course] || 0
  const wallet = progress.meta || { tokens: 25, xp: 0, missions: [] }

  async function recordActivity(activity) {
    const response = await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity),
    })
    if (response.ok) {
      const result = await response.json()
      setProgress(result.progress)
      if (result.activityReward?.tokens > 0) {
        setWalletNotice(`+${result.activityReward.tokens} tokens · +${result.activityReward.xp} XP`)
        window.setTimeout(() => setWalletNotice(null), 2600)
      }
      return { ok: true }
    }
    return { ok: false, message: 'Rewards could not be saved. Try again.' }
  }

  async function spendHint() {
    const response = await fetch('/api/hint', { method: 'POST' })
    const result = await response.json()
    if (!response.ok) return { ok: false, message: result.message || 'You need 1 token to use a hint.' }
    setProgress(result.progress)
    setWalletNotice('-1 token · hint unlocked')
    window.setTimeout(() => setWalletNotice(null), 2200)
    return { ok: true }
  }

  async function spendSkip() {
    const response = await fetch('/api/skip', { method: 'POST' })
    const result = await response.json()
    if (!response.ok) return { ok: false, message: result.message || 'You need 2 tokens to skip a step.' }
    setProgress(result.progress)
    setWalletNotice('-2 tokens · step skipped')
    window.setTimeout(() => setWalletNotice(null), 2200)
    return { ok: true }
  }

  async function purchaseShopItem(item) {
    const response = await fetch('/api/shop/purchase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item }) })
    const result = await response.json()
    if (!response.ok) {
      setWalletNotice(result.message || 'You do not have enough tokens.')
      window.setTimeout(() => setWalletNotice(null), 2200)
      return null
    }
    setProgress(result.progress)
    setWalletNotice(result.isNew ? `${result.reward.name} ${result.reward.rarity} added to Profiles` : `${result.reward.name} ${result.reward.rarity} already in Profiles`)
    window.setTimeout(() => setWalletNotice(null), 2800)
    return result
  }

  async function purchaseXpSurge() {
    const response = await fetch('/api/shop/xp-surge', { method: 'POST' })
    const result = await response.json()
    if (!response.ok) {
      setWalletNotice(result.message || 'You do not have enough tokens.')
      window.setTimeout(() => setWalletNotice(null), 2200)
      return
    }
    setProgress(result.progress)
    setWalletNotice('2× XP active for 30 minutes')
    window.setTimeout(() => setWalletNotice(null), 2800)
  }

  async function saveProfile(profile) {
    const response = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })
    const result = await response.json()
    if (!response.ok) {
      setWalletNotice(result.message || 'Profile could not be saved.')
      window.setTimeout(() => setWalletNotice(null), 2200)
      return
    }
    setProgress(result.progress)
    setWalletNotice('Profile saved')
    window.setTimeout(() => setWalletNotice(null), 2200)
  }

  function selectNode(index) {
    const isAvailable = index <= completed && index < AVAILABLE_LESSON_COUNT

    if (isAvailable) {
      setNotice(index)
    }
  }

  function startLesson() {
    const url = `/api/courses/${encodeURIComponent(course)}/lessons/${notice}`

    fetch(url)
      .then(response => (response.ok ? response.json() : Promise.reject()))
      .then(data => {
        setLessonData({ index: notice, data })
        setNotice(null)
      })
      .catch(() => setError('Could not load this lesson.'))
  }

  async function complete() {
    const nextLesson = Math.min(AVAILABLE_LESSON_COUNT, lessonData.index + 1)
    const nextProgress = Math.max(completed, nextLesson)
    const response = await fetch(`/api/progress/${encodeURIComponent(course)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: nextProgress }),
    })

    if (response.ok) {
      const result = await response.json()
      setProgress(result.progress || { ...progress, [course]: nextProgress })
      await recordActivity({ kind: 'lesson', repeat: completed > 0 })
    }

    setLessonData(null)
  }

  if (lessonData) return <LessonPage course={course} index={lessonData.index} data={lessonData.data} close={() => setLessonData(null)} complete={complete} onHint={spendHint} onSkip={spendSkip} />
  const activeTabDetails = TABS.find(tab => tab.id === activeTab)
  const onJourney = () => { setCourse(null); setActiveTab('journey') }
  if (activeTab === 'mission') return <AppFrame activeTab={activeTab} onChange={setActiveTab} wallet={wallet} course={course} onMission={() => setActiveTab('mission')} onJourney={onJourney}><MissionScreen wallet={wallet} />{walletNotice && <div className="wallet-notice">{walletNotice}</div>}</AppFrame>
  if (activeTab === 'practice') return <AppFrame activeTab={activeTab} onChange={setActiveTab} wallet={wallet} course={course} onMission={() => setActiveTab('mission')} onJourney={onJourney}><PracticeHub onActivity={recordActivity} onHint={spendHint} onSkip={spendSkip} />{walletNotice && <div className="wallet-notice">{walletNotice}</div>}</AppFrame>
  if (activeTab === 'shop') return <AppFrame activeTab={activeTab} onChange={setActiveTab} wallet={wallet} course={course} onMission={() => setActiveTab('mission')} onJourney={onJourney}><ShopScreen wallet={wallet} onPurchase={purchaseShopItem} onBoost={purchaseXpSurge} />{walletNotice && <div className="wallet-notice">{walletNotice}</div>}</AppFrame>
  if (activeTab === 'settings') return <AppFrame activeTab={activeTab} onChange={setActiveTab} wallet={wallet} course={course} onMission={() => setActiveTab('mission')} onJourney={onJourney}><SettingsScreen wallet={wallet} onSaveProfile={saveProfile} />{walletNotice && <div className="wallet-notice">{walletNotice}</div>}</AppFrame>
  if (activeTab !== 'journey') return <AppFrame activeTab={activeTab} onChange={setActiveTab} wallet={wallet} course={course} onMission={() => setActiveTab('mission')} onJourney={onJourney}><PlaceholderScreen coins={wallet.tokens} tab={activeTabDetails} />{walletNotice && <div className="wallet-notice">{walletNotice}</div>}</AppFrame>
  if (!course) return <AppFrame activeTab={activeTab} onChange={setActiveTab} wallet={wallet} course={course} onMission={() => setActiveTab('mission')} onJourney={onJourney}><section className="course-picker compact-course-picker"><header className="picker-header"><p>WELCOME TO</p><h1>Choose a journey</h1><span>Pick a learning path to continue.</span></header>{error && <p className="api-error">{error}</p>}<div className="course-list">{courses.map(item => <button key={item.name} className={`course-option ${COURSE_META[item.name][1]}`} onClick={() => setCourse(item.name)}><i>{COURSE_META[item.name][0]}</i><span><b>{item.name}</b><small>{COURSE_META[item.name][2]}</small><em>{progress[item.name] || 0}/3 complete · {item.lessons.length} lessons →</em></span></button>)}</div></section>{walletNotice && <div className="wallet-notice">{walletNotice}</div>}</AppFrame>
  const lessons = selected?.lessons || []
  return <AppFrame activeTab={activeTab} onChange={setActiveTab} wallet={wallet} course={course} onMission={() => setActiveTab('mission')} onJourney={onJourney}><section className="journey-screen"><header className="journey-header"><button className="back" onClick={() => setCourse(null)}>‹</button><div><p>YOUR JOURNEY</p><h1>{course}</h1></div><span className="flame">♨ {completed}</span></header><section className="chapter-card"><p>COURSE PROGRESS</p><h2>{completed} / 3</h2><div className="progress"><i style={{ width: `${(completed / 3) * 100}%` }} /></div><span>Finish each quiz to unlock the next lesson.</span></section><section className="path-intro"><h2>Learning path</h2><p>Complete the first three lessons. Later lessons are locked.</p></section>{error && <p className="api-error">{error}</p>}<section className="lesson-path">{lessons.map((title, index) => { const available = index <= completed && index < 3; const done = index < completed; return <div className={`path-row ${index % 2 ? 'right' : 'left'}`} key={`${title}-${index}`}><span className="path-connector" /><button className={`lesson-node ${done ? 'complete' : available ? 'next' : 'locked'}`} onClick={() => selectNode(index)}>{done ? '✓' : available ? '▶' : '🔒'}</button><button className="lesson-label" disabled={!available} onClick={() => selectNode(index)}><small>LESSON {index + 1}</small><b>{title}</b>{!available && <em>Locked</em>}</button></div> })}</section>{notice !== null && <div className="start-notice"><button className="close" onClick={() => setNotice(null)}>×</button><span>LESSON {notice + 1}</span><h2>{lessons[notice]}</h2><p>Ready to begin? This lesson includes an animation and eight quiz questions.</p><button className="start-button" onClick={startLesson}>START LESSON →</button></div>}</section>{walletNotice && <div className="wallet-notice">{walletNotice}</div>}</AppFrame>
}
export default App
