import { useEffect, useRef, useState } from 'react'
import './App.css'

type Item = { id: string; text: string }
type DaySlot = 'items' | 'lunch' | 'dinner'
type DragSource = 'todo' | { dayIndex: number; slot: DaySlot }
type TripState = { days: Day[]; todoItems: Item[] }

const STORAGE_KEY = 'trip-planner-state-v1'
const mkId = () => globalThis.crypto?.randomUUID() ?? `${Date.now()}-${Math.random()}`
const mkItem = (text: string): Item => ({ id: mkId(), text })

type Day = {
  label: string
  date: string
  title: string
  items: Item[]
  lunch: Item | null
  dinner: Item | null
}

const initialDays: Day[] = [
  {
    label: 'Day 1',
    date: 'Apr 30',
    title: 'Arrival + Montmartre',
    items: ['Land at CDG', 'Check in', 'Sacré-Cœur sunset'].map(mkItem),
    lunch: null,
    dinner: null,
  },
  {
    label: 'Day 2',
    date: 'May 1',
    title: 'Louvre + Seine',
    items: ['Louvre highlights', 'Tuileries stroll', 'Evening cruise'].map(mkItem),
    lunch: null,
    dinner: null,
  },
  {
    label: 'Day 3',
    date: 'May 2',
    title: 'Le Marais',
    items: ['Café hop', 'Vintage shops', 'Picasso Museum'].map(mkItem),
    lunch: null,
    dinner: null,
  },
  {
    label: 'Day 4',
    date: 'May 3',
    title: 'Latin Quarter',
    items: ['Panthéon', 'Bookstores', 'Luxembourg Gardens'].map(mkItem),
    lunch: null,
    dinner: null,
  },
  {
    label: 'Day 5',
    date: 'May 4',
    title: 'Wrap + Depart',
    items: ['Pastries run', 'Souvenirs', 'Flight home'].map(mkItem),
    lunch: null,
    dinner: null,
  },
]

const isItem = (value: unknown): value is Item => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'string' && typeof candidate.text === 'string'
}

const isDay = (value: unknown): value is Day => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>
  const lunch = candidate.lunch
  const dinner = candidate.dinner

  return (
    typeof candidate.label === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.items) &&
    candidate.items.every(isItem) &&
    (lunch === null || isItem(lunch)) &&
    (dinner === null || isItem(dinner))
  )
}

const loadTripState = (): TripState => {
  if (typeof window === 'undefined') {
    return { days: initialDays, todoItems: [] }
  }

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY)
    if (!rawState) {
      return { days: initialDays, todoItems: [] }
    }

    const parsedState = JSON.parse(rawState) as Partial<TripState>
    if (
      Array.isArray(parsedState.days) &&
      parsedState.days.every(isDay) &&
      Array.isArray(parsedState.todoItems) &&
      parsedState.todoItems.every(isItem)
    ) {
      return {
        days: parsedState.days,
        todoItems: parsedState.todoItems,
      }
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return { days: initialDays, todoItems: [] }
}

function App() {
  const [{ days: initialStoredDays, todoItems: initialStoredTodoItems }] = useState(loadTripState)
  const [days, setDays] = useState<Day[]>(initialStoredDays)
  const [todoItems, setTodoItems] = useState<Item[]>(initialStoredTodoItems)
  const [newItemText, setNewItemText] = useState('')
  const [draggingOver, setDraggingOver] = useState<string | null>(null)
  const dragRef = useRef<{ item: Item; source: DragSource } | null>(null)

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        days,
        todoItems,
      } satisfies TripState),
    )
  }, [days, todoItems])

  const addItem = () => {
    const text = newItemText.trim()
    if (!text) return
    setTodoItems(prev => [...prev, mkItem(text)])
    setNewItemText('')
  }

  const getDropId = (dayIndex: number, slot: DaySlot) => `${dayIndex}-${slot}`

  const handleDragStart = (item: Item, source: DragSource) => {
    dragRef.current = { item, source }
  }

  const handleDragOver = (e: React.DragEvent, dayIndex: number, slot: DaySlot) => {
    e.preventDefault()
    setDraggingOver(getDropId(dayIndex, slot))
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDraggingOver(null)
    }
  }

  const handleDragEnd = () => {
    dragRef.current = null
    setDraggingOver(null)
  }

  const removeItemFromSource = (item: Item, source: DragSource) => {
    if (source === 'todo') {
      setTodoItems(prev => prev.filter(i => i.id !== item.id))
      return
    }

    setDays(prev =>
      prev.map((day, i) => {
        if (i !== source.dayIndex) return day
        if (source.slot === 'items') {
          return { ...day, items: day.items.filter(it => it.id !== item.id) }
        }
        return { ...day, [source.slot]: day[source.slot]?.id === item.id ? null : day[source.slot] }
      })
    )
  }

  const addItemToTarget = (item: Item, dayIndex: number, slot: DaySlot) => {
    setDays(prev =>
      prev.map((day, i) => {
        if (i !== dayIndex) return day
        if (slot === 'items') {
          return { ...day, items: [...day.items, item] }
        }
        return { ...day, [slot]: item }
      })
    )
  }

  const handleDrop = (dayIndex: number, slot: DaySlot) => {
    if (!dragRef.current) return
    const { item, source } = dragRef.current

    if (
      source !== 'todo' &&
      source.dayIndex === dayIndex &&
      source.slot === slot
    ) {
      dragRef.current = null
      setDraggingOver(null)
      return
    }

    const existingMealItem =
      slot === 'items' ? null : days[dayIndex][slot]

    removeItemFromSource(item, source)

    if (existingMealItem && existingMealItem.id !== item.id) {
      setTodoItems(prev => [...prev, existingMealItem])
    }

    addItemToTarget(item, dayIndex, slot)

    dragRef.current = null
    setDraggingOver(null)
  }

  const removeFromDay = (item: Item, dayIndex: number, slot: DaySlot) => {
    removeItemFromSource(item, { dayIndex, slot })
    setTodoItems(prev => [...prev, item])
  }

  return (
    <div className="app">
      <header className="trip-header">
        <div>
          <p className="eyebrow">Trip</p>
          <h1>Paris</h1>
        </div>
        <div className="trip-dates">
          <span>April 30</span>
          <span className="dot">•</span>
          <span>May 5</span>
        </div>
      </header>

      <section className="todo-section" aria-label="Ideas pool">
        <div className="todo-header">
          <h3 className="todo-title">Ideas</h3>
          <div className="todo-add">
            <input
              className="todo-input"
              value={newItemText}
              onChange={e => setNewItemText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="New activity…"
              aria-label="New activity"
            />
            <button className="todo-add-btn" onClick={addItem}>
              Add
            </button>
          </div>
        </div>
        <div className="todo-items">
          {todoItems.length === 0 ? (
            <p className="todo-empty">Add ideas above, then drag them onto a day</p>
          ) : (
            todoItems.map(item => (
              <div
                key={item.id}
                className="todo-item"
                draggable
                onDragStart={() => handleDragStart(item, 'todo')}
                onDragEnd={handleDragEnd}
              >
                <span className="drag-handle" aria-hidden="true">⠿</span>
                {item.text}
                <button
                  className="todo-remove-btn"
                  onClick={() => setTodoItems(prev => prev.filter(i => i.id !== item.id))}
                  aria-label={`Remove "${item.text}"`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="days" aria-label="Trip days">
        {days.map((day, dayIndex) => (
          <article key={day.label} className="day-card">
            <div className="day-meta">
              <span className="day-pill">{day.label}</span>
              <span className="day-date">{day.date}</span>
            </div>
            <h2>{day.title}</h2>
            <div className="meal-section">
              {(['lunch', 'dinner'] as const).map(slot => (
                <div
                  key={slot}
                  className={`meal-slot${
                    draggingOver === getDropId(dayIndex, slot) ? ' drop-over' : ''
                  }`}
                  onDragOver={e => handleDragOver(e, dayIndex, slot)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(dayIndex, slot)}
                >
                  <span className="meal-label">{slot}</span>
                  {day[slot] ? (
                    <div
                      className="meal-item"
                      draggable
                      onDragStart={() =>
                        handleDragStart(day[slot] as Item, { dayIndex, slot })
                      }
                      onDragEnd={handleDragEnd}
                    >
                      <span>{day[slot]?.text}</span>
                      <button
                        className="remove-btn visible"
                        onClick={() => removeFromDay(day[slot] as Item, dayIndex, slot)}
                        aria-label={`Return "${day[slot]?.text}" to ideas`}
                        title="Return to ideas"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <p className="meal-empty">Drop a meal idea here</p>
                  )}
                </div>
              ))}
            </div>
            <ul
              className={`day-list${
                draggingOver === getDropId(dayIndex, 'items') ? ' drop-over' : ''
              }`}
              onDragOver={e => handleDragOver(e, dayIndex, 'items')}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(dayIndex, 'items')}
            >
              {day.items.map(item => (
                <li
                  key={item.id}
                  className="day-list-item"
                  draggable
                  onDragStart={() => handleDragStart(item, { dayIndex, slot: 'items' })}
                  onDragEnd={handleDragEnd}
                >
                  <span>{item.text}</span>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromDay(item, dayIndex, 'items')}
                    aria-label={`Return "${item.text}" to ideas`}
                    title="Return to ideas"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  )
}

export default App
