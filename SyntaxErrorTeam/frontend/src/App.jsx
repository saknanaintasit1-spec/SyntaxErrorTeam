import { useEffect, useState } from 'react'
import './App.css'

const meta = { Algebra: ['𝑥', 'blue', 'Build your equation skills'], 'Pythagoras & Geometry': ['△', 'violet', 'Explore shapes and triangles'], Polynomials: ['⌁', 'orange', 'Master expressions and factoring'] }

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
      [<div className="scene-triangle">△<i>90°</i></div>, 'A right triangle has one angle measuring exactly 90°.'],
      [<div className="scene-triangle marked">△<i>90°</i><b>hypotenuse</b></div>, 'The hypotenuse is the side opposite the 90° angle.'],
      [<div className="scene-triangle rotate">△<i>90°</i><b>hypotenuse</b></div>, 'Even when the triangle rotates, the opposite side remains the hypotenuse.'],
    ],
    squares: [
      [<div className="scene-squares"><i>3 × 3<br />= 9</i><i>4 × 4<br />= 16</i><b>5 × 5<br />= 25</b></div>, 'Squares are built on each side of a 3–4–5 right triangle.'],
      [<div className="scene-equation">9 + 16 = 25</div>, 'The two smaller square areas equal the largest square area.'],
      [<div className="scene-equation">3² + 4² = 5² <strong>→</strong> a² + b² = c²</div>, 'This is the Pythagorean theorem.'],
    ],
    'missing-side': [
      [<div className="scene-triangle marked">△<i>6</i><b>8</b><strong>?</strong></div>, 'The question mark is the hypotenuse.'],
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
  return <section className="math-animation accurate-animation"><div className="scene-counter">Scene {scene + 1} / {view.length}</div>{visual}<p>{caption}</p><button onClick={() => setScene((scene + 1) % view.length)}>{scene === view.length - 1 ? 'Replay animation' : 'Next scene →'}</button></section>
}

function LessonPage({ course, index, data, close, complete }) {
  const [screen, setScreen] = useState('lesson'), [question, setQuestion] = useState(0), [answer, setAnswer] = useState(null)
  const quiz = data.quiz[question], correct = answer === quiz.answer
  const nextQuestion = () => { if (question === data.quiz.length - 1) complete(); else { setQuestion(question + 1); setAnswer(null) } }
  if (screen === 'quiz') return <main className="lesson-page"><header className="lesson-nav"><button onClick={close}>← Back to path</button><span>QUIZ {question + 1} / {data.quiz.length}</span><button className="skip" onClick={close}>Skip</button></header><section className="quiz-wrap"><p className="eyebrow">{course} · {data.title}</p><div className="quiz-number">{question + 1}</div><h1>Quick check</h1><h2>{quiz.question}</h2><div className="answers">{quiz.options.map(option => <button key={option} className={answer === option ? (correct ? 'right' : 'wrong') : ''} onClick={() => setAnswer(option)}><span>{option}</span></button>)}</div>{answer && <div className={`feedback ${correct ? 'good' : ''}`}><b>{correct ? 'Nice work!' : 'Let’s clear that up.'}</b><p>{quiz.explanations?.[answer] || quiz.explanation || `Your answer: ${answer}. The correct answer is ${quiz.answer}; review the animation and try that rule again.`}</p><button onClick={nextQuestion}>{question === data.quiz.length - 1 ? 'Finish lesson →' : 'Next question →'}</button></div>}</section></main>
  return <main className="lesson-page"><header className="lesson-nav"><button onClick={close}>← Back to path</button><span>LESSON {index + 1}</span><button className="skip" onClick={() => setScreen('quiz')}>Skip to quiz</button></header><article className="lesson-content"><div className="lesson-hero"><p>{course.toUpperCase()} · FOUNDATIONS</p><h1>{data.title}</h1><span>{data.intro}</span></div><section className="info-card"><h2>Key components</h2>{data.components.map(([name, description]) => <p key={name}><i>i</i><b>{name}:</b> {description}</p>)}</section><section className="info-card"><h2>How it works</h2><p>{data.intro} Follow the visual, work through the steps, then test yourself.</p></section><section className="interactive"><b>Interactive animation</b><Animation type={data.animation} /></section><h2 className="steps-heading">Steps</h2><section className="steps">{data.steps.map(([title, description], step) => <article key={title}><i>{step + 1}</i><div><b>{title}</b><p>{description}</p></div></article>)}</section><button className="quiz-button" onClick={() => setScreen('quiz')}>Go to quiz screen <span>→</span></button></article></main>
}

function App() {
  const [courses, setCourses] = useState([]), [progress, setProgress] = useState({}), [course, setCourse] = useState(null), [notice, setNotice] = useState(null), [lessonData, setLessonData] = useState(null), [error, setError] = useState('')
  useEffect(() => { Promise.all([fetch('/api/courses').then(r => r.json()), fetch('/api/progress').then(r => r.json())]).then(([courseData, savedProgress]) => { setCourses(courseData); setProgress(savedProgress) }).catch(() => setError('Start the backend server to load courses and save progress.')) }, [])
  const selected = courses.find(item => item.name === course), completed = progress[course] || 0
  const selectNode = index => { if (index <= completed && index < 3) setNotice(index) }
  const startLesson = () => { fetch(`/api/courses/${encodeURIComponent(course)}/lessons/${notice}`).then(r => r.ok ? r.json() : Promise.reject()).then(data => { setLessonData({ index: notice, data }); setNotice(null) }).catch(() => setError('Could not load this lesson.')) }
  const complete = async () => { const next = Math.min(3, lessonData.index + 1); const response = await fetch(`/api/progress/${encodeURIComponent(course)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: Math.max(completed, next) }) }); if (response.ok) setProgress({ ...progress, [course]: Math.max(completed, next) }); setLessonData(null) }
  if (lessonData) return <LessonPage course={course} index={lessonData.index} data={lessonData.data} close={() => setLessonData(null)} complete={complete} />
  if (!course) return <main className="page-shell"><section className="course-picker"><header className="picker-header"><p>WELCOME TO</p><h1>Math Mentor</h1><span>Choose a learning path to begin your journey.</span></header>{error && <p className="api-error">{error}</p>}<div className="course-list">{courses.map(item => <button key={item.name} className={`course-option ${meta[item.name][1]}`} onClick={() => setCourse(item.name)}><i>{meta[item.name][0]}</i><span><b>{item.name}</b><small>{meta[item.name][2]}</small><em>{progress[item.name] || 0}/3 complete · {item.lessons.length} lessons →</em></span></button>)}</div></section></main>
  const lessons = selected?.lessons || []
  return <main className="page-shell"><section className="journey-screen"><header className="journey-header"><button className="back" onClick={() => setCourse(null)}>‹</button><div><p>YOUR JOURNEY</p><h1>{course}</h1></div><span className="flame">♨ {completed}</span></header><section className="chapter-card"><p>COURSE PROGRESS</p><h2>{completed} / 3</h2><div className="progress"><i style={{ width: `${(completed / 3) * 100}%` }} /></div><span>Finish each quiz to unlock the next lesson.</span></section><section className="path-intro"><h2>Learning path</h2><p>Complete the first three lessons. Later lessons are locked.</p></section>{error && <p className="api-error">{error}</p>}<section className="lesson-path">{lessons.map((title, index) => { const available = index <= completed && index < 3; const done = index < completed; return <div className={`path-row ${index % 2 ? 'right' : 'left'}`} key={`${title}-${index}`}><span className="path-connector" /><button className={`lesson-node ${done ? 'complete' : available ? 'next' : 'locked'}`} onClick={() => selectNode(index)}>{done ? '✓' : available ? '▶' : '🔒'}</button><button className="lesson-label" disabled={!available} onClick={() => selectNode(index)}><small>LESSON {index + 1}</small><b>{title}</b>{!available && <em>Locked</em>}</button></div> })}</section>{notice !== null && <div className="start-notice"><button className="close" onClick={() => setNotice(null)}>×</button><span>LESSON {notice + 1}</span><h2>{lessons[notice]}</h2><p>Ready to begin? This lesson includes an animation and eight quiz questions.</p><button className="start-button" onClick={startLesson}>START LESSON →</button></div>}</section></main>
}
export default App
