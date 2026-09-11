require('dotenv').config()
const express = require('express')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { cert, getApps, initializeApp } = require('firebase-admin/app')
const { getAuth: getFirebaseAuth } = require('firebase-admin/auth')
const app = express()
app.use(express.json())
const port = process.env.PORT || 3001
const progressFile = path.join(__dirname, 'progress.json')
const usersFile = path.join(__dirname, 'users.json')
const sessionsFile = path.join(__dirname, 'sessions.json')
let firebaseAuth = null
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) })
    firebaseAuth = getFirebaseAuth(app)
  } catch {
    console.error('FIREBASE_SERVICE_ACCOUNT_JSON is invalid; Firebase verification is disabled.')
  }
}

const DAILY_MISSION_DEFINITIONS = [
  ['Complete 5 practice problems', 5, 25, 'practiceProblems', 5],
  ['Complete 10 practice problems', 10, 50, 'practiceProblems', 10],
  ['Get 5 questions correct in a row', 8, 40, 'correctStreak', 5],
  ['Complete 1 lesson', 10, 50, 'lessonsCompleted', 1],
  ['Complete 2 lessons', 18, 90, 'lessonsCompleted', 2],
  ['Solve 3 problems without using a hint', 7, 35, 'noHintProblems', 3],
  ['Complete 10 correct steps', 7, 35, 'correctSteps', 10],
  ['Retry and solve 3 previously missed questions', 8, 40, 'retrySolved', 3],
  ['Complete a practice session with 80%+ accuracy', 9, 45, 'sessionsAt80', 1],
  ['Complete a practice session with 100% accuracy', 15, 70, 'sessionsAt100', 1],
  ['Solve 5 algebra problems', 7, 35, 'algebraProblems', 5],
  ['Solve 5 Pythagoras problems', 7, 35, 'pythagorasProblems', 5],
  ['Solve 5 polynomial problems', 7, 35, 'polynomialProblems', 5],
  ['Complete 1 challenge problem', 8, 40, 'challengeProblems', 1],
  ['Complete 3 challenge problems', 15, 75, 'challengeProblems', 3],
  ['Practice for 10 minutes', 8, 40, 'practiceMinutes', 10],
  ['Earn 100 XP today', 10, 50, 'xp', 100],
  ['Complete practice in 2 different topics', 9, 45, 'topicCount', 2],
  ['Complete 5 problems on the first attempt', 8, 40, 'firstAttemptProblems', 5],
  ['Complete all 3 daily missions', 15, 75, 'dailyMissions', 3],
]

const SHOP_ITEMS = {
  frameBox: {
    cost: 10,
    rewards: [
      ['Simple', 'Common', 45], ['Notebook', 'Common', 30], ['Pencil', 'Common', 15],
      ['Blue Glow', 'Rare', 5], ['Purple Glow', 'Rare', 3], ['Golden', 'Epic', 1.5], ['Galaxy', 'Legendary', 0.5],
    ],
  },
  titleBox: {
    cost: 10,
    rewards: [
      ['Number Learner', 'Common', 35], ['Equation Explorer', 'Common', 25], ['Math Student', 'Common', 20],
      ['Problem Solver', 'Rare', 8], ['Formula Finder', 'Rare', 5], ['Math Strategist', 'Epic', 5], ['Theorem Master', 'Epic', 1.5], ['Mathematical Legend', 'Legendary', 0.5],
    ],
  },
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function updateStreak(stats) {
  const today = todayKey()
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  
  if (stats.lastActiveDate === today) {
    // Already active today, streak continues
    return stats
  } else if (stats.lastActiveDate === yesterday) {
    // Active yesterday, increment streak
    stats.streakDays += 1
  } else if (stats.lastActiveDate !== today) {
    // Streak broken or first time
    stats.streakDays = 1
  }
  
  stats.lastActiveDate = today
  return stats
}

function recordMistake(stats, category, type, problem) {
  const mistake = {
    category,
    type,
    problem,
    timestamp: Date.now(),
    attempted: false
  }
  
  // Add to mistakes array (keep last 50)
  stats.mistakes = [mistake, ...stats.mistakes].slice(0, 50)
  
  // Track weak areas
  const key = `${category}-${type}`
  stats.weakAreas[key] = (stats.weakAreas[key] || 0) + 1
  
  return stats
}

function getPersonalizedRecommendations(stats) {
  // Find most common mistakes
  const mistakeCounts = {}
  stats.mistakes.forEach(mistake => {
    const key = `${mistake.category}-${mistake.type}`
    mistakeCounts[key] = (mistakeCounts[key] || 0) + 1
  })
  
  // Sort by frequency
  const sortedMistakes = Object.entries(mistakeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3) // Top 3 weak areas
  
  return sortedMistakes.map(([key, count]) => {
    const [category, type] = key.split('-')
    return { category, type, count, priority: count }
  })
}

function createDailyMissions() {
  return [...DAILY_MISSION_DEFINITIONS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(([title, tokens, xp, stat, target], index) => ({ id: index + 1, title, tokens, xp, progress: 0, target, stat, completed: false }))
}

const createStats = () => ({
  practiceProblems: 0,
  correctStreak: 0,
  bestCorrectStreak: 0,
  currentStreak: 0,
  lastActiveDate: null,
  streakDays: 0,
  lessonsCompleted: 0,
  noHintProblems: 0,
  correctSteps: 0,
  retrySolved: 0,
  sessionsAt80: 0,
  sessionsAt100: 0,
  algebraProblems: 0,
  pythagorasProblems: 0,
  polynomialProblems: 0,
  challengeProblems: 0,
  practiceMinutes: 0,
  firstAttemptProblems: 0,
  topics: [],
  mistakes: [], // Track missed problems for personalized practice
  weakAreas: {}, // Track performance by topic
})

const createMeta = () => ({
  tokens: 25,
  xp: 0,
  profileName: 'Math Learner',
  collection: { frames: [], titles: [] },
  activeFrame: 'Simple',
  activeTitle: 'Number Learner',
  xpBoostUntil: 0,
  stats: createStats(),
  dailyDate: todayKey(),
  missions: createDailyMissions(),
})

const catalog = {
  Algebra: ['Algebra Basics', 'Simplifying Expressions', 'Linear Equations', 'Simplifying Expressions', 'Distributive Property', 'Linear Equations', 'Multi-Step Equations', 'Inequalities', 'Ratios & Proportions', 'Systems of Equations', 'Exponents', 'Radicals', 'Quadratic Equations', 'Factoring', 'Completing the Square', 'Functions', 'Graphing Functions'],
  'Pythagoras & Geometry': ['Right Triangles', 'Pythagorean Theorem', 'Finding a Missing Side', 'Right Triangles', 'Pythagorean Theorem', 'Finding Missing Sides', 'Converse of the Pythagorean Theorem', 'Special Right Triangles', 'Distance on the Coordinate Plane', 'Applications of Pythagoras'],
  Polynomials: ['Polynomial Basics', 'Adding & Subtracting Polynomials', 'Multiplying Polynomials', 'Adding Polynomials', 'Subtracting Polynomials', 'Multiplying Monomials', 'Multiplying Polynomials', 'Special Products', 'Dividing Polynomials by Monomials', 'Polynomial Long Division', 'Factoring Polynomials', 'Factoring by GCF', 'Factoring by Grouping', 'Factoring Trinomials', 'Difference of Squares', 'Solving Polynomial Equations'],
}

/** Convert concise quiz data into the API shape consumed by the client. */
const makeQuiz = (items) => items.map(([question, answer, options]) => {
  const answers = [...new Set([answer, ...options])].slice(0, 4)

  return {
    question,
    answer,
    options: answers,
    explanations: Object.fromEntries(answers.map(option => [option, option === answer
      ? `Correct: ${answer} is the result that follows from the rule in this question.`
      : `Your answer: ${option}. Why it doesn't work: this question uses the same rule throughout; apply it carefully to get ${answer}.`]))
  }
})
/** Create a lesson while keeping the curriculum source concise and consistent. */
const lesson = (title, intro, animation, components, steps, questions) => ({
  title,
  intro,
  animation,
  components,
  steps,
  quiz: makeQuiz(questions),
})

const lessons = {
  Algebra: [
    lesson('Algebra Basics', 'Learn how variables, constants, coefficients, terms, and expressions work together.', 'expression', [['Variable', 'A letter representing a number.'], ['Coefficient', 'The number multiplying a variable.'], ['Constant', 'A number without a variable.'], ['Term', 'A piece separated by + or −.']], [['Break apart 3x + 5', 'See each part of the expression separately.'], ['Label every piece', 'Match the coefficient, variable, constant, and terms.'], ['Read an expression', 'Expressions are math phrases without an equals sign.']], [['Identify the variable in 7x + 2', 'x', ['7', '2', '9']], ['Identify the coefficient in 5y', '5', ['y', '0', '10']], ['Identify the constant in 3x + 8', '8', ['3', 'x', '11']], ['How many terms are in 4x + 3?', '2', ['1', '3', '4']], ['Identify the terms in 6x² − 2x + 9', '6x², −2x, and 9', ['6x² and 9', 'x and 9', '3 terms only']], ['What is the coefficient of x² in 8x² + 3?', '8', ['x²', '3', '2']], ['How many terms are in 5a² + 2a − 7?', '3', ['2', '4', '5']], ['Identify the constant in 9m − 4', '−4', ['9', 'm', '4']]]),
    lesson('Simplifying Expressions', 'Combine like terms by adding or subtracting their coefficients.', 'blocks', [['Like terms', 'Terms with the same variables and exponents.'], ['Unlike terms', 'Terms that cannot be combined.']], [['Match like terms', 'Only matching variable blocks can join.'], ['Combine coefficients', 'Add or subtract the numbers in front.'], ['Leave unlike terms', 'x-blocks and y-blocks stay separate.']], [['3x + 2x', '5x', ['6x', '5x²', 'x']], ['7x − 4x', '3x', ['11x', '3', '−3x']], ['5a + 3 + 2a', '7a + 3', ['10a', '7a', '7a + 5']], ['4x + 2x + 7', '6x + 7', ['6x', '13x', '6x + 9']], ['8y − 3y + 4', '5y + 4', ['11y + 4', '5y', '5y − 4']], ['2x + 5 + 3x − 2', '5x + 3', ['5x + 7', '5x − 3', '5x']], ['6a + 2b + 4a', '10a + 2b', ['12ab', '10a', '10a + 6b']], ['9x² + 3x + 2x²', '11x² + 3x', ['14x²', '11x²', '11x + 3x²']]]),
    lesson('Linear Equations', 'Use inverse operations while doing the same thing to both sides of an equation.', 'balance', [['Equation', 'A statement showing two equal values.'], ['Inverse operations', 'Opposite operations that undo each other.']], [['Keep it balanced', 'Both sides must stay equal.'], ['Undo the operation', 'Use addition, subtraction, multiplication, or division.'], ['Check your answer', 'Substitute it back into the original equation.']], [['x + 4 = 9', 'x = 5', ['x = 13', 'x = 4', 'x = 3']], ['x − 3 = 8', 'x = 11', ['x = 5', 'x = −11', 'x = 24']], ['x + 7 = 15', 'x = 8', ['x = 22', 'x = 7', 'x = 15']], ['2x = 12', 'x = 6', ['x = 24', 'x = 10', 'x = 4']], ['3x = 21', 'x = 7', ['x = 18', 'x = 24', 'x = 6']], ['x/4 = 5', 'x = 20', ['x = 9', 'x = 1.25', 'x = 4']], ['2x + 3 = 11', 'x = 4', ['x = 7', 'x = 5.5', 'x = 8']], ['3x − 4 = 14', 'x = 6', ['x = 18', 'x = 10', 'x = 3']]]),
  ],
  'Pythagoras & Geometry': [
    lesson('Right Triangles', 'Recognize a right triangle, its legs, and the hypotenuse.', 'triangle', [['Right angle', 'An angle measuring 90°.'], ['Legs', 'The two sides forming the right angle.'], ['Hypotenuse', 'The longest side, opposite the right angle.']], [['Find 90°', 'Look for the square corner.'], ['Locate the hypotenuse', 'It is opposite the right angle.'], ['Name the legs', 'They meet to form the right angle.']], [['What is a right angle?', 'An angle measuring 90°', ['An angle measuring 45°', 'A straight line', 'A 180° angle']], ['How many degrees is a right angle?', '90°', ['45°', '180°', '360°']], ['Which side is opposite the 90° angle?', 'The hypotenuse', ['A leg', 'The shortest side', 'The base']], ['Identify the two legs.', 'The sides forming the right angle', ['The longest sides', 'The diagonal sides', 'Any two sides']], ['Is the hypotenuse always the longest side?', 'Yes', ['No', 'Only in an equilateral triangle', 'Only if horizontal']], ['Which triangle has one 90° angle?', 'A right triangle', ['An equilateral triangle', 'An obtuse triangle', 'A scalene triangle']], ['In a rotated right triangle, the hypotenuse is', 'Still opposite the 90° angle', ['Always horizontal', 'Always vertical', 'The shortest side']], ['A right angle is marked with', 'A small square', ['A circle', 'A star', 'Two arrows']]]),
    lesson('Pythagorean Theorem', 'For right triangles, the squared legs add to the squared hypotenuse.', 'squares', [['Formula', 'a² + b² = c².'], ['c', 'The hypotenuse.'], ['Squared sides', 'Each side length is multiplied by itself.']], [['Square both legs', 'Find a² and b².'], ['Add the areas', 'Their total is c².'], ['Find the side', 'Use the square root to find c.']], [['Write the Pythagorean theorem.', 'a² + b² = c²', ['a + b = c', 'a² − b² = c²', 'a + b + c = 180']], ['Which side is c?', 'The hypotenuse', ['Any leg', 'The shortest side', 'The right angle']], ['Calculate 3² + 4²', '25', ['7', '12', '49']], ['Calculate 5² + 12²', '169', ['17', '144', '119']], ['Find c² when a = 6, b = 8', '100', ['14', '10', '48']], ['Calculate 8² + 15²', '289', ['23', '120', '225']], ['Which sides are squared?', 'All three sides', ['Only a and b', 'Only c', 'No sides']], ['When can the theorem be used?', 'With a right triangle', ['With any polygon', 'With any triangle', 'Only squares']]]),
    lesson('Finding a Missing Side', 'Substitute values, calculate squares, take a square root, and check.', 'missing-side', [['Substitute', 'Put known lengths into the formula.'], ['Square root', 'Undo the final square to find the length.']], [['Identify c', 'Find whether the missing side is the hypotenuse or a leg.'], ['Calculate', 'Substitute and simplify the equation.'], ['Check', 'Verify the answer makes sense.']], [['Find c: 3, 4, ?', '5', ['6', '7', '25']], ['Find c: 5, 12, ?', '13', ['17', '7', '169']], ['Find c: 6, 8, ?', '10', ['14', '48', '12']], ['Find c: 8, 15, ?', '17', ['23', '225', '7']], ['Find the missing leg: 5, 13, ?', '12', ['18', '8', '169']], ['Find the missing leg: 6, 10, ?', '8', ['16', '4', '100']], ['Find the missing leg: 9, 15, ?', '12', ['24', '6', '225']], ['A 5m ladder reaches 4m high. Its base is', '3m', ['1m', '6m', '9m']]]),
  ],
  Polynomials: [
    lesson('Polynomial Basics', 'Identify terms, coefficients, variables, exponents, degree, and polynomial type.', 'polynomial', [['Degree', 'The highest exponent.'], ['Monomial', 'One term.'], ['Binomial', 'Two terms.'], ['Trinomial', 'Three terms.']], [['Separate terms', 'Split 4x² + 3x − 7 at signs.'], ['Label parts', 'Find coefficient, variable, exponent, and constant.'], ['Classify it', 'Count terms to name the polynomial.']], [['How many terms are in 4x² + 3x − 7?', '3', ['2', '4', '7']], ['What is the coefficient of 4x²?', '4', ['x', '2', 'x²']], ['What is the degree?', '2', ['3', '4', '7']], ['What is the constant?', '−7', ['4', '3', '7']], ['Identify the variable.', 'x', ['4', '2', '−7']], ['Classify 7x.', 'Monomial', ['Binomial', 'Trinomial', 'Constant']], ['Classify 3x + 2.', 'Binomial', ['Monomial', 'Trinomial', 'Quadratic']], ['Classify x² + 4x + 1.', 'Trinomial', ['Monomial', 'Binomial', 'Constant']]]),
    lesson('Adding & Subtracting Polynomials', 'Align and combine terms with identical variables and exponents.', 'grouping', [['Like terms', 'Terms with the same variable and exponent.'], ['Subtracting', 'Distribute the negative sign before combining.']], [['Remove parentheses', 'Keep signs with their terms.'], ['Group matches', 'Put x² terms, x terms, and constants together.'], ['Combine', 'Add or subtract each group.']], [['(2x + 3) + (4x + 5)', '6x + 8', ['6x + 15', '8x + 8', '6x + 2']], ['(3x² + 2x) + (x² + 4x)', '4x² + 6x', ['3x² + 6x', '4x² + 8x', '4x + 6x²']], ['(5x + 7) − (2x + 3)', '3x + 4', ['7x + 10', '3x + 10', '3x − 4']], ['(4x² + 3x + 2) + (x² + 5x + 1)', '5x² + 8x + 3', ['5x² + 8x + 1', '4x² + 8x + 3', '5x² + 3x + 3']], ['(7x² − 2x + 4) − (3x² + x − 1)', '4x² − 3x + 5', ['10x² − x + 3', '4x² − x + 5', '4x² − 3x + 3']], ['(2a + 5) + (3a − 2)', '5a + 3', ['5a + 7', '6a + 3', '5a − 3']], ['(6y² + y) − (2y² − 3y)', '4y² + 4y', ['8y² − 2y', '4y² − 2y', '4y² + y']], ['(5x² + 4x − 3) + (2x² − x + 6)', '7x² + 3x + 3', ['7x² + 5x + 3', '3x² + 3x + 3', '7x² + 3x − 9']]]),
    lesson('Multiplying Polynomials', 'Use distribution and FOIL so every term multiplies every other term.', 'area-model', [['Distributive property', 'Multiply a factor by every term inside parentheses.'], ['FOIL', 'First, outer, inner, last for two binomials.']], [['Multiply every pair', 'No term can be skipped.'], ['Combine like terms', 'Add matching powers afterward.'], ['Check the degree', 'The highest powers should add when multiplying.']], [['2(x + 3)', '2x + 6', ['2x + 3', '5x', '6x']], ['3(x + 4)', '3x + 12', ['3x + 4', '7x', '12x']], ['(x + 2)(x + 3)', 'x² + 5x + 6', ['x² + 6', 'x² + 5x', 'x² + 6x + 5']], ['(x + 4)(x + 5)', 'x² + 9x + 20', ['x² + 20', 'x² + 9x', 'x² + 20x + 9']], ['(x + 2)(x − 3)', 'x² − x − 6', ['x² − 6', 'x² + x − 6', 'x² − 5x − 6']], ['(2x + 3)(x + 4)', '2x² + 11x + 12', ['2x² + 12', '2x² + 8x + 3', '2x² + 7x + 12']], ['(3x + 2)(2x + 5)', '6x² + 19x + 10', ['6x² + 10', '6x² + 15x + 10', '5x² + 19x + 10']], ['(x − 4)(x + 6)', 'x² + 2x − 24', ['x² − 24', 'x² + 10x − 24', 'x² − 2x − 24']]]),
  ],
}

const MAX_AVAILABLE_LESSONS = 3

function loadProgress(userId) {
  try {
    const user = userId && readJson(usersFile, []).find(candidate => candidate.id === userId)
    const progress = user ? user.progress : JSON.parse(fs.readFileSync(progressFile, 'utf8'))
    const defaultMeta = createMeta()
    const meta = progress.meta || defaultMeta
    meta.profileName ||= defaultMeta.profileName
    meta.collection = { ...defaultMeta.collection, ...(meta.collection || {}) }
    meta.collection.frames ||= []
    meta.collection.titles ||= []
    meta.activeFrame ||= defaultMeta.activeFrame
    meta.activeTitle ||= defaultMeta.activeTitle
    meta.xpBoostUntil ||= 0
    meta.stats = { ...createStats(), ...(meta.stats || {}) }
    if (meta.dailyDate !== todayKey() || !Array.isArray(meta.missions) || meta.missions.length !== 3) {
      meta.dailyDate = todayKey()
      meta.missions = createDailyMissions()
    }
    return { ...progress, meta }
  } catch {
    // A learner without a saved file starts with no completed lessons.
    return { meta: createMeta() }
  }
}

function saveProgress(progress, userId) {
  if (userId) {
    const users = readJson(usersFile, [])
    const user = users.find(candidate => candidate.id === userId)
    if (user) {
      user.progress = progress
      writeJson(usersFile, users)
      return
    }
  }
  fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2))
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2))
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') }
}

function passwordsMatch(password, user) {
  const hash = crypto.scryptSync(password, user.passwordSalt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordHash, 'hex'))
}

function getCookie(request, name) {
  const cookies = String(request.headers.cookie || '').split(';').map(cookie => cookie.trim())
  return cookies.find(cookie => cookie.startsWith(`${name}=`))?.slice(name.length + 1)
}

function currentUser(request) {
  const sessionId = getCookie(request, 'mathmentor_session')
  const session = sessionId && readJson(sessionsFile, {})[sessionId]
  if (!session) return null
  return readJson(usersFile, []).find(user => user.id === session.userId) || null
}

function getOrCreateFirebaseUser(decodedToken) {
  const users = readJson(usersFile, [])
  let user = users.find(candidate => candidate.id === `firebase:${decodedToken.uid}`)
  if (!user) {
    user = { id: `firebase:${decodedToken.uid}`, email: decodedToken.email || '', progress: users.length ? { meta: createMeta() } : readJson(progressFile, { meta: createMeta() }) }
    users.push(user)
    writeJson(usersFile, users)
  }
  return user
}

async function requireAuth(request, response, next) {
  const user = currentUser(request)
  if (user) {
    request.user = user
    return next()
  }
  const authorization = String(request.headers.authorization || '')
  if (firebaseAuth && authorization.startsWith('Bearer ')) {
    try {
      request.user = getOrCreateFirebaseUser(await firebaseAuth.verifyIdToken(authorization.slice(7)))
      return next()
    } catch {
      return response.status(401).json({ message: 'Your Firebase session is no longer valid.' })
    }
  }
  return response.status(401).json({ message: 'Please log in to continue.' })
}

function setSession(response, userId) {
  const sessions = readJson(sessionsFile, {})
  const sessionId = crypto.randomBytes(32).toString('hex')
  sessions[sessionId] = { userId, createdAt: Date.now() }
  writeJson(sessionsFile, sessions)
  response.setHeader('Set-Cookie', `mathmentor_session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`)
}

function authMe(request, response) {
  const user = currentUser(request)
  response.json({ user: user ? { id: user.id, email: user.email } : null })
}

function authSignup(request, response) {
  const email = String(request.body?.email || '').trim().toLowerCase()
  const password = String(request.body?.password || '')
  if (!/^\S+@\S+\.\S+$/.test(email)) return response.status(400).json({ message: 'Enter a valid email address.' })
  if (password.length < 6) return response.status(400).json({ message: 'Password must be at least 6 characters.' })
  const users = readJson(usersFile, [])
  if (users.some(user => user.email === email)) return response.status(409).json({ message: 'An account with that email already exists.' })
  const passwordData = hashPassword(password)
  const hasExistingAccount = users.length > 0
  const user = { id: crypto.randomUUID(), email, passwordHash: passwordData.hash, passwordSalt: passwordData.salt, progress: hasExistingAccount ? { meta: createMeta() } : readJson(progressFile, { meta: createMeta() }) }
  users.push(user)
  writeJson(usersFile, users)
  setSession(response, user.id)
  return response.status(201).json({ user: { id: user.id, email: user.email }, progress: user.progress })
}

function authLogin(request, response) {
  const email = String(request.body?.email || '').trim().toLowerCase()
  const password = String(request.body?.password || '')
  const user = readJson(usersFile, []).find(candidate => candidate.email === email)
  if (!user || !passwordsMatch(password, user)) return response.status(401).json({ message: 'Email or password is incorrect.' })
  setSession(response, user.id)
  return response.json({ user: { id: user.id, email: user.email }, progress: user.progress })
}

function authLogout(request, response) {
  const sessionId = getCookie(request, 'mathmentor_session')
  const sessions = readJson(sessionsFile, {})
  if (sessionId) delete sessions[sessionId]
  writeJson(sessionsFile, sessions)
  response.setHeader('Set-Cookie', 'mathmentor_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0')
  response.json({ ok: true })
}

function getCourseList(_request, response) {
  const courses = Object.entries(catalog).map(([name, lessonNames]) => ({
    name,
    lessons: lessonNames,
  }))

  response.json(courses)
}

function getLesson(request, response) {
  const courseLessons = lessons[request.params.course]
  const lessonIndex = Number(request.params.lesson)
  const requestedLesson = courseLessons?.[lessonIndex]

  if (!requestedLesson) {
    return response.status(404).json({
      message: 'This lesson is locked or unavailable.',
    })
  }

  return response.json(requestedLesson)
}

function getProgress(request, response) {
  response.json(loadProgress(request.user.id))
}

function spendTokens(cost, request, response) {
  const progress = loadProgress(request.user.id)
  const meta = progress.meta

  if (meta.tokens < cost) {
    return response.status(402).json({ message: `You need ${cost} tokens for this action.`, progress })
  }

  meta.tokens -= cost
  saveProgress(progress, request.user.id)
  return response.json({ progress, cost })
}

function spendHint(request, response) {
  return spendTokens(1, request, response)
}

function spendSkip(request, response) {
  return spendTokens(2, request, response)
}

function drawReward(rewards) {
  const roll = Math.random() * 100
  let total = 0
  for (const [name, rarity, rate] of rewards) {
    total += rate
    if (roll < total) return { name, rarity }
  }
  const [name, rarity] = rewards[rewards.length - 1]
  return { name, rarity }
}

function purchaseShopItem(request, response) {
  const item = SHOP_ITEMS[request.body?.item]
  if (!item) return response.status(400).json({ message: 'That shop item does not exist.' })
  const progress = loadProgress(request.user.id)
  if (progress.meta.tokens < item.cost) return response.status(402).json({ message: `You need ${item.cost} tokens for this item.`, progress })
  const reward = drawReward(item.rewards)
  const collectionKey = request.body.item === 'frameBox' ? 'frames' : 'titles'
  const isNew = !progress.meta.collection[collectionKey].includes(reward.name)
  progress.meta.tokens -= item.cost
  if (isNew) progress.meta.collection[collectionKey].push(reward.name)
  saveProgress(progress, request.user.id)
  return response.json({ progress, reward, isNew })
}

function purchaseXpSurge(request, response) {
  const progress = loadProgress(request.user.id)
  if (progress.meta.tokens < 30) return response.status(402).json({ message: 'You need 30 tokens for the XP surge.', progress })
  progress.meta.tokens -= 30
  progress.meta.xpBoostUntil = Date.now() + 30 * 60 * 1000
  saveProgress(progress, request.user.id)
  return response.json({ progress })
}

function updateProfile(request, response) {
  const progress = loadProgress(request.user.id)
  const meta = progress.meta
  const profileName = String(request.body?.profileName || '').trim().slice(0, 24)
  const frame = String(request.body?.activeFrame || '')
  const title = String(request.body?.activeTitle || '')
  const ownedFrames = ['Simple', ...(meta.collection.frames || [])]
  const ownedTitles = ['Number Learner', ...(meta.collection.titles || [])]

  if (!profileName) return response.status(400).json({ message: 'Profile name cannot be empty.' })
  if (!ownedFrames.includes(frame) || !ownedTitles.includes(title)) return response.status(403).json({ message: 'That profile item has not been unlocked.', progress })

  meta.profileName = profileName
  meta.activeFrame = frame
  meta.activeTitle = title
  saveProgress(progress, request.user.id)
  return response.json({ progress })
}

function getMissionProgress(meta, stat) {
  if (stat === 'correctStreak') return meta.stats.bestCorrectStreak
  if (stat === 'topicCount') return meta.stats.topics.length
  if (stat === 'dailyMissions') return meta.missions.filter(mission => mission.completed && mission.id <= 3).length
  return meta.stats[stat] || 0
}

function recordActivity(request, response) {
  const progress = loadProgress(request.user.id)
  const meta = progress.meta
  const startingTokens = meta.tokens
  const startingXp = meta.xp
  const xpMultiplier = meta.xpBoostUntil > Date.now() ? 2 : 1
  const activity = request.body || {}
  const topic = activity.topic
  const isPractice = activity.kind === 'practice'
  const isLesson = activity.kind === 'lesson'

  if (!isPractice && !isLesson) return response.status(400).json({ message: 'Activity kind must be practice or lesson.' })

  // Update streak for any activity
  updateStreak(meta.stats)

  if (isPractice) {
    const accuracy = Math.max(0, Math.min(1, Number(activity.accuracy) || 0))
    meta.tokens += 2
    meta.xp += 10 * xpMultiplier
    meta.stats.practiceProblems += 1
    meta.stats.correctSteps += Math.max(0, Number(activity.correctSteps) || 0)
    meta.stats.correctStreak = activity.correct ? meta.stats.correctStreak + 1 : 0
    meta.stats.bestCorrectStreak = Math.max(meta.stats.bestCorrectStreak, meta.stats.correctStreak)
    
    // Record mistakes for personalized practice
    if (!activity.correct && activity.mistake) {
      recordMistake(meta.stats, topic, activity.type, activity.mistake)
    }
    
    if (!activity.usedHint) meta.stats.noHintProblems += 1
    if (activity.retrySolved) meta.stats.retrySolved += 1
    if (accuracy >= 0.8) meta.stats.sessionsAt80 += 1
    if (accuracy === 1) meta.stats.sessionsAt100 += 1
    if (activity.firstAttempt) meta.stats.firstAttemptProblems += 1
    if (topic === 'Algebra') meta.stats.algebraProblems += 1
    if (topic === 'Pythagoras') meta.stats.pythagorasProblems += 1
    if (topic === 'Polynomials') meta.stats.polynomialProblems += 1
    if (activity.challenge) meta.stats.challengeProblems += 1
    meta.stats.practiceMinutes += Math.max(0, Number(activity.minutes) || 0)
    if (topic && !meta.stats.topics.includes(topic)) meta.stats.topics.push(topic)
  }

  if (isLesson) {
    meta.tokens += activity.repeat ? 3 : 5
    meta.xp += (activity.repeat ? 30 : 50) * xpMultiplier
    meta.stats.lessonsCompleted += 1
  }

  for (const mission of meta.missions) {
    mission.progress = Math.min(mission.target, getMissionProgress(meta, mission.stat))
    if (!mission.completed && mission.progress >= mission.target) {
      mission.completed = true
      meta.tokens += mission.tokens
      meta.xp += mission.xp * xpMultiplier
    }
  }

  saveProgress(progress, request.user.id)
  
  // Include personalized recommendations in response
  const recommendations = getPersonalizedRecommendations(meta.stats)
  
  response.json({ 
    progress, 
    activityReward: { tokens: meta.tokens - startingTokens, xp: meta.xp - startingXp },
    recommendations 
  })
}

function updateProgress(request, response) {
  const requestedCompletedCount = Number(request.body.completed) || 0
  const completed = Math.max(
    0,
    Math.min(MAX_AVAILABLE_LESSONS, requestedCompletedCount),
  )
  const progress = loadProgress(request.user.id)

  progress[request.params.course] = completed
  saveProgress(progress, request.user.id)

  response.json({ course: request.params.course, completed, progress })
}

app.use(express.json())

app.get('/api/courses', getCourseList)
app.get('/api/courses/:course/lessons/:lesson', getLesson)
app.get('/api/auth/me', authMe)
app.post('/api/auth/signup', authSignup)
app.post('/api/auth/login', authLogin)
app.post('/api/auth/logout', authLogout)
app.get('/api/progress', requireAuth, getProgress)
app.post('/api/hint', requireAuth, spendHint)
app.post('/api/skip', requireAuth, spendSkip)
app.post('/api/shop/purchase', requireAuth, purchaseShopItem)
app.post('/api/shop/xp-surge', requireAuth, purchaseXpSurge)
app.put('/api/profile', requireAuth, updateProfile)
app.put('/api/progress/:course', requireAuth, updateProgress)
app.post('/api/activity', requireAuth, recordActivity)

app.get('/api/recommendations', requireAuth, (request, response) => {
  const progress = loadProgress(request.user.id)
  const recommendations = getPersonalizedRecommendations(progress.meta.stats)
  response.json({ recommendations })
})


app.post('/api/ai', async (req, res) => {
  try {
    const { message } = req.body

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        messages: [
          {
            role: 'system',
            content: `You are Math Mentor AI.

You are a mathematics tutor for Grade 8 students.
Explain math step-by-step.
Give hints before giving the final answer.
Only help with mathematics.
Keep your answers concise and under 200 words.
Do not use * formatting
Instead use clean formatting with clear steps and examples.
combined with bullet heads
`
          },
          {
            role: 'user',
            content: message
          }
        ],
        stream: true,
        options: {
          num_predict: 150, // Limit response length
          temperature: 0.7
        }
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Ollama API returned ${response.status}`)
    }

    const data = await response.json()

    res.json({
      answer: data.message?.content || data.message || 'No response generated'
    })
  } catch (error) {
    console.error('AI Error:', error.message)
    
    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: 'AI request timed out. The model might be too slow. Try a simpler question.'
      })
    }
    
    res.status(500).json({
      error: 'AI request failed. Make sure Ollama is running with the llama 3.2:1b model.'
    })
  }
})
app.listen(port, () => console.log(`Math Mentor API listening on http://localhost:${port}`))