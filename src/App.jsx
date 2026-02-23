import { useEffect, useMemo, useRef, useState } from 'react'
import rough from 'roughjs/bin/svg'
import './App.css'

const CLEANUP_STEPS = [
  'Sweeping random tabs off the floor...',
  'Sorting tasks into clear little piles...',
  'Dusting procrastination corners...',
  'Lining up your focus blocks...',
]

const DAY_MINUTES = 24 * 60
const MIN_WORK_BLOCK = 15
const DEFAULT_NOTES = ['deadlines', 'ideas', 'emails', 'errands', 'side quests']

function parseTasks(rawTasks) {
  return Array.from(
    new Set(
      rawTasks
        .split(/\n|,/)
        .map((item) => item.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean),
    ),
  )
}

function parseTimeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function toClockLabel(minutes) {
  const normalized = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES
  let hour = Math.floor(normalized / 60)
  const minute = normalized % 60
  const suffix = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12 || 12
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`
}

function buildTimetable(tasks, startTime, endTime) {
  const startMinutes = parseTimeToMinutes(startTime)
  let endMinutes = parseTimeToMinutes(endTime)

  if (endMinutes <= startMinutes) {
    endMinutes += DAY_MINUTES
  }

  const availableMinutes = endMinutes - startMinutes
  if (availableMinutes < tasks.length * MIN_WORK_BLOCK) {
    return {
      error: `Need at least ${tasks.length * MIN_WORK_BLOCK} minutes for ${tasks.length} tasks. Try extending your time window.`,
    }
  }

  const breakSlots = Math.max(0, tasks.length - 1)
  let breakMinutes =
    breakSlots > 0 ? Math.min(12, Math.max(6, Math.floor((availableMinutes * 0.12) / breakSlots))) : 0

  while (breakMinutes > 0 && availableMinutes - breakMinutes * breakSlots < tasks.length * MIN_WORK_BLOCK) {
    breakMinutes -= 1
  }

  const focusBudget = availableMinutes - breakMinutes * breakSlots
  const baseTaskMinutes = Math.floor(focusBudget / tasks.length)
  let leftoverMinutes = focusBudget - baseTaskMinutes * tasks.length

  let cursor = startMinutes
  const entries = []

  tasks.forEach((task, index) => {
    const taskMinutes = baseTaskMinutes + (leftoverMinutes > 0 ? 1 : 0)
    if (leftoverMinutes > 0) {
      leftoverMinutes -= 1
    }

    const taskEnd = cursor + taskMinutes
    entries.push({
      type: 'task',
      label: task,
      start: cursor,
      end: taskEnd,
      minutes: taskMinutes,
    })
    cursor = taskEnd

    if (index < tasks.length - 1 && breakMinutes > 0) {
      const breakEnd = cursor + breakMinutes
      entries.push({
        type: 'break',
        label: 'Reset break',
        start: cursor,
        end: breakEnd,
        minutes: breakMinutes,
      })
      cursor = breakEnd
    }
  })

  return { entries, availableMinutes }
}

function SketchBoard({ children }) {
  const boardRef = useRef(null)

  useEffect(() => {
    const svg = boardRef.current
    if (!svg) return

    svg.replaceChildren()
    const rc = rough.svg(svg)

    const outerFrame = rc.rectangle(16, 16, 688, 548, {
      stroke: '#3c2d20',
      strokeWidth: 3,
      roughness: 1.5,
      fill: '#fff7d6',
      fillStyle: 'zigzag',
      hachureGap: 8,
    })

    const innerBorder = rc.rectangle(34, 34, 652, 512, {
      stroke: '#7f6a56',
      strokeWidth: 1.8,
      roughness: 1.3,
      fill: 'transparent',
    })

    const tapeLeft = rc.rectangle(90, 0, 100, 34, {
      stroke: '#a89877',
      strokeWidth: 1.5,
      roughness: 1.8,
      fill: '#f4d9ac',
      fillStyle: 'solid',
    })

    const tapeRight = rc.rectangle(520, 0, 100, 34, {
      stroke: '#a89877',
      strokeWidth: 1.5,
      roughness: 1.8,
      fill: '#f4d9ac',
      fillStyle: 'solid',
    })

    svg.append(outerFrame, innerBorder, tapeLeft, tapeRight)
  }, [])

  return (
    <section className="board-shell">
      <svg
        ref={boardRef}
        className="board-svg"
        role="presentation"
        viewBox="0 0 720 580"
        preserveAspectRatio="none"
      />
      <div className="board-content">{children}</div>
    </section>
  )
}

function SketchCoach({ phase }) {
  const coachRef = useRef(null)

  useEffect(() => {
    const svg = coachRef.current
    if (!svg) return

    svg.replaceChildren()
    const rc = rough.svg(svg)

    const eyes = phase === 'organizing' ? 14 : 10
    const mouthPath =
      phase === 'planned' ? 'M120 116 Q152 138 182 116' : phase === 'organizing' ? 'M124 118 Q152 92 178 118' : 'M122 118 Q152 126 180 118'

    const head = rc.circle(152, 84, 98, {
      stroke: '#2f241c',
      strokeWidth: 3,
      roughness: 1.8,
      fill: '#fffef8',
      fillStyle: 'solid',
    })

    const leftEye = rc.circle(132, 84, eyes, {
      stroke: '#2f241c',
      strokeWidth: 2.4,
      roughness: 1.5,
      fill: '#2f241c',
      fillStyle: 'solid',
    })

    const rightEye = rc.circle(172, 84, eyes, {
      stroke: '#2f241c',
      strokeWidth: 2.4,
      roughness: 1.5,
      fill: '#2f241c',
      fillStyle: 'solid',
    })

    const smile = rc.path(mouthPath, {
      stroke: '#2f241c',
      strokeWidth: 2.8,
      roughness: 1.4,
      fill: 'transparent',
    })

    const torso = rc.line(152, 132, 152, 224, {
      stroke: '#2f241c',
      strokeWidth: 3,
      roughness: 1.6,
    })

    const leftArm = rc.line(152, 160, 102, 188, {
      stroke: '#2f241c',
      strokeWidth: 3,
      roughness: 1.5,
    })

    const rightArm = rc.line(152, 165, 206, 152, {
      stroke: '#2f241c',
      strokeWidth: 3,
      roughness: 1.5,
    })

    const leftLeg = rc.line(152, 224, 118, 284, {
      stroke: '#2f241c',
      strokeWidth: 3,
      roughness: 1.6,
    })

    const rightLeg = rc.line(152, 224, 184, 284, {
      stroke: '#2f241c',
      strokeWidth: 3,
      roughness: 1.6,
    })

    const broomHandle = rc.line(206, 152, 240, 248, {
      stroke: '#7a5b3f',
      strokeWidth: 4,
      roughness: 1.3,
    })

    const broomHead = rc.rectangle(226, 246, 34, 22, {
      stroke: '#2f241c',
      strokeWidth: 2.2,
      roughness: 1.5,
      fill: '#f0bf60',
      fillStyle: 'hachure',
      hachureGap: 4,
    })

    svg.append(
      head,
      leftEye,
      rightEye,
      smile,
      torso,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      broomHandle,
      broomHead,
    )

    if (phase === 'planned') {
      const sparkLeft = rc.path('M84 40 L92 52 L104 56 L92 60 L86 72 L80 60 L68 56 L80 52 Z', {
        stroke: '#2f241c',
        strokeWidth: 1.8,
        roughness: 1.5,
        fill: '#ffe57f',
        fillStyle: 'solid',
      })

      const sparkRight = rc.path('M228 28 L234 38 L246 40 L234 46 L230 58 L224 46 L212 40 L224 38 Z', {
        stroke: '#2f241c',
        strokeWidth: 1.8,
        roughness: 1.5,
        fill: '#ffe57f',
        fillStyle: 'solid',
      })

      svg.append(sparkLeft, sparkRight)
    }
  }, [phase])

  return (
    <div className={`coach-card coach-${phase}`}>
      <svg ref={coachRef} className="coach-svg" viewBox="0 0 300 300" role="img" aria-label="Doodle coach character" />
      <p className="coach-line">
        {phase === 'organizing'
          ? 'I am tidying your mind-room now.'
          : phase === 'planned'
            ? 'All tidy. Follow this plan and dodge procrastination.'
            : "Give me your tasks and I'll map your day."}
      </p>
    </div>
  )
}

function MindCleanupScene({ active, notes }) {
  return (
    <section className={`mind-room ${active ? 'mind-room-active' : ''}`} aria-hidden="true">
      <p className="mind-title">{active ? 'Organizing your thoughts...' : 'Mind room preview'}</p>
      <span className="mind-note note-1">{notes[0]}</span>
      <span className="mind-note note-2">{notes[1]}</span>
      <span className="mind-note note-3">{notes[2]}</span>
      <span className="mind-note note-4">{notes[3]}</span>
      <span className="mind-note note-5">{notes[4]}</span>
      <span className="broom-sweep" />
    </section>
  )
}

function App() {
  const [taskInput, setTaskInput] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [phase, setPhase] = useState('intake')
  const [error, setError] = useState('')
  const [cleanupStep, setCleanupStep] = useState(CLEANUP_STEPS[0])
  const [timetable, setTimetable] = useState([])

  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)
  const notesFromTasks = useMemo(() => {
    const fromTasks = parseTasks(taskInput)
      .map((task) => task.toLowerCase().split(' ').slice(0, 2).join(' '))
      .slice(0, 5)

    return [...fromTasks, ...DEFAULT_NOTES].slice(0, 5)
  }, [taskInput])

  function clearPlanningTimers() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  useEffect(() => () => clearPlanningTimers(), [])

  function fillSampleTasks() {
    setTaskInput('Reply to client emails\nWorkout 30 mins\nBuild project feature\nRead 20 pages')
    setStartTime('08:30')
    setEndTime('13:00')
    setError('')
    if (phase === 'planned') {
      setPhase('intake')
      setTimetable([])
    }
  }

  function generatePlan() {
    const cleanedTasks = parseTasks(taskInput)
    if (cleanedTasks.length === 0) {
      setError('Drop at least one task on the board first.')
      return
    }

    const result = buildTimetable(cleanedTasks, startTime, endTime)
    if (result.error) {
      setError(result.error)
      return
    }

    clearPlanningTimers()
    setError('')
    setPhase('organizing')
    setCleanupStep(CLEANUP_STEPS[0])
    setTimetable([])

    intervalRef.current = window.setInterval(() => {
      setCleanupStep((current) => {
        const currentIndex = CLEANUP_STEPS.indexOf(current)
        const nextIndex = (currentIndex + 1) % CLEANUP_STEPS.length
        return CLEANUP_STEPS[nextIndex]
      })
    }, 850)

    timeoutRef.current = window.setTimeout(() => {
      clearPlanningTimers()
      setTimetable(result.entries)
      setPhase('planned')
    }, 3600)
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="brand">ProcastiNO</p>
        <h1 className="headline">A doodle buddy to help you stop procrastinating.</h1>
      </header>

      <div className="stage-grid">
        <aside className="left-stage">
          <SketchCoach phase={phase} />
          <MindCleanupScene active={phase === 'organizing'} notes={notesFromTasks} />
        </aside>

        <SketchBoard>
          <h2 className="board-title">Planning Board</h2>
          <p className="board-copy">
            {phase === 'planned'
              ? 'Plan ready. Follow this timeline and keep momentum.'
              : "Give me your tasks and I'll give you a timetable for the timeframe you like."}
          </p>

          <label className="board-label" htmlFor="task-input">
            Tasks (one per line or comma-separated)
          </label>
          <textarea
            id="task-input"
            className="hand-textarea"
            value={taskInput}
            onChange={(event) => setTaskInput(event.target.value)}
            placeholder="Example: Finish assignment, Call mom, 45 min workout"
            rows={5}
            disabled={phase === 'organizing'}
          />

          <div className="time-grid">
            <label className="board-label" htmlFor="start-time">
              Start
            </label>
            <input
              id="start-time"
              className="hand-input"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              disabled={phase === 'organizing'}
            />

            <label className="board-label" htmlFor="end-time">
              End
            </label>
            <input
              id="end-time"
              className="hand-input"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              disabled={phase === 'organizing'}
            />
          </div>

          <div className="actions-row">
            <button className="hand-button" type="button" onClick={generatePlan} disabled={phase === 'organizing'}>
              {phase === 'organizing' ? 'Organizing...' : 'Build my no-procrastination plan'}
            </button>
            <button
              className="hand-button hand-button-ghost"
              type="button"
              onClick={fillSampleTasks}
              disabled={phase === 'organizing'}
            >
              Fill sample
            </button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
          {phase === 'organizing' ? <p className="status-text">{cleanupStep}</p> : null}

          {phase === 'planned' ? (
            <section className="timetable-shell">
              <h3 className="timetable-title">Your Timetable</h3>
              <ol className="timetable-list">
                {timetable.map((item) => (
                  <li
                    className={`timetable-item ${item.type === 'break' ? 'timetable-break' : 'timetable-task'}`}
                    key={`${item.type}-${item.label}-${item.start}`}
                  >
                    <p className="slot-time">
                      {toClockLabel(item.start)} - {toClockLabel(item.end)}
                    </p>
                    <p className="slot-task">{item.label}</p>
                    <p className="slot-duration">{item.minutes} min</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </SketchBoard>
      </div>
    </main>
  )
}

export default App
