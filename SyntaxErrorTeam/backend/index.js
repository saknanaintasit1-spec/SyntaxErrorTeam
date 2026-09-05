const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()
const port = process.env.PORT || 3001
const progressFile = path.join(__dirname, 'progress.json')

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

function loadProgress() {
  try {
    const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'))
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

function saveProgress(progress) {
  fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2))
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

function getProgress(_request, response) {
  response.json(loadProgress())
}

function spendTokens(cost, response) {
  const progress = loadProgress()
  const meta = progress.meta

  if (meta.tokens < cost) {
    return response.status(402).json({ message: `You need ${cost} tokens for this action.`, progress })
  }

  meta.tokens -= cost
  saveProgress(progress)
  return response.json({ progress, cost })
}

function spendHint(_request, response) {
  return spendTokens(1, response)
}

function spendSkip(_request, response) {
  return spendTokens(2, response)
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
  const progress = loadProgress()
  if (progress.meta.tokens < item.cost) return response.status(402).json({ message: `You need ${item.cost} tokens for this item.`, progress })
  const reward = drawReward(item.rewards)
  const collectionKey = request.body.item === 'frameBox' ? 'frames' : 'titles'
  const isNew = !progress.meta.collection[collectionKey].includes(reward.name)
  progress.meta.tokens -= item.cost
  if (isNew) progress.meta.collection[collectionKey].push(reward.name)
  saveProgress(progress)
  return response.json({ progress, reward, isNew })
}

function purchaseXpSurge(_request, response) {
  const progress = loadProgress()
  if (progress.meta.tokens < 30) return response.status(402).json({ message: 'You need 30 tokens for the XP surge.', progress })
  progress.meta.tokens -= 30
  progress.meta.xpBoostUntil = Date.now() + 30 * 60 * 1000
  saveProgress(progress)
  return response.json({ progress })
}

function updateProfile(request, response) {
  const progress = loadProgress()
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
  saveProgress(progress)
  return response.json({ progress })
}

function getMissionProgress(meta, stat) {
  if (stat === 'correctStreak') return meta.stats.bestCorrectStreak
  if (stat === 'topicCount') return meta.stats.topics.length
  if (stat === 'dailyMissions') return meta.missions.filter(mission => mission.completed && mission.id <= 3).length
  return meta.stats[stat] || 0
}

function recordActivity(request, response) {
  const progress = loadProgress()
  const meta = progress.meta
  const startingTokens = meta.tokens
  const startingXp = meta.xp
  const xpMultiplier = meta.xpBoostUntil > Date.now() ? 2 : 1
  const activity = request.body || {}
  const topic = activity.topic
  const isPractice = activity.kind === 'practice'
  const isLesson = activity.kind === 'lesson'

  if (!isPractice && !isLesson) return response.status(400).json({ message: 'Activity kind must be practice or lesson.' })

  if (isPractice) {
    const accuracy = Math.max(0, Math.min(1, Number(activity.accuracy) || 0))
    meta.tokens += 2
    meta.xp += 10 * xpMultiplier
    meta.stats.practiceProblems += 1
    meta.stats.correctSteps += Math.max(0, Number(activity.correctSteps) || 0)
    meta.stats.correctStreak = activity.correct ? meta.stats.correctStreak + 1 : 0
    meta.stats.bestCorrectStreak = Math.max(meta.stats.bestCorrectStreak, meta.stats.correctStreak)
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

  saveProgress(progress)
  response.json({ progress, activityReward: { tokens: meta.tokens - startingTokens, xp: meta.xp - startingXp } })
}

function updateProgress(request, response) {
  const requestedCompletedCount = Number(request.body.completed) || 0
  const completed = Math.max(
    0,
    Math.min(MAX_AVAILABLE_LESSONS, requestedCompletedCount),
  )
  const progress = loadProgress()

  progress[request.params.course] = completed
  saveProgress(progress)

  response.json({ course: request.params.course, completed, progress })
}

app.use(express.json())

app.get('/api/courses', getCourseList)
app.get('/api/courses/:course/lessons/:lesson', getLesson)
app.get('/api/progress', getProgress)
app.post('/api/hint', spendHint)
app.post('/api/skip', spendSkip)
app.post('/api/shop/purchase', purchaseShopItem)
app.post('/api/shop/xp-surge', purchaseXpSurge)
app.put('/api/profile', updateProfile)
app.put('/api/progress/:course', updateProgress)
app.post('/api/activity', recordActivity)

app.listen(port, () => console.log(`Math Mentor API listening on http://localhost:${port}`))
