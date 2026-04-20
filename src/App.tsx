import { useState, useRef } from 'react'
import './App.css'

type Item = { id: string; text: string }

let _id = 0
const mkId = () => String(++_id)
const mkItem = (text: string): Item => ({ id: mkId(), text })

type Day = { label: string; date: string; title: string; items: Item[] }

const initialDays: Day[] = [
  {
    label: 'Day 1',
    date: 'Apr 30',
    title: 'Arrival + Montmartre',
    items: ['Land at CDG', 'Check in', 'Sacré-Cœur sunset'].map(mkItem),
  },
  {
    label: 'Day 2',
    date: 'May 1',
    title: 'Louvre + Seine',
    items: ['Louvre highlights', 'Tuileries stroll', 'Evening cruise'].map(mkItem),
  },
  {
    label: 'Day 3',
    date: 'May 2',
    title: 'Le Marais',
    items: ['Café hop', 'Vintage shops', 'Picasso Museum'].map(mkItem),
  },
  {
    label: 'Day 4',
    date: 'May 3',
    title: 'Latin Quarter',
    items: ['Panthéon', 'Bookstores', 'Luxembourg Gardens'].map(mkItem),
  },
  {
    label: 'Day 5',
    date: 'May 4',
    title: 'Wrap + Depart',
    items: ['Pastries run', 'Souvenirs', 'Flight home'].map(mkItem),
  },
]

function App() {
  const [days, setDays] = useState<Day[]>(initialDays)
  const [todoItems, setTodoItems] = useState<Item[]>([])
  const [newItemText, setNewItemText] = useState('')
  const [draggingOver, setDraggingOver] = useState<number | null>(null)
  const dragRef = useRef<{ item: Item; source: 'todo' | number } | null>(null)

  const addItem = () => {
    const text = newItemText.trim()
    if (!text) return
    setTodoItems(prev => [...prev, mkItem(text)])
    setNewItemText('')
  }

  const handleDragStart = (item: Item, source: 'todo' | number) => {
    dragRef.current = { item, source }
  }

  const handleDragOver = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault()
    setDraggingOver(dayIndex)
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

  const handleDrop = (dayIndex: number) => {
    if (!dragRef.current) return
    const { item, source } = dragRef.current

    if (source === 'todo') {
      setTodoItems(prev => prev.filter(i => i.id !== item.id))
    } else {
      setDays(prev =>
        prev.map((day, i) =>
          i === source ? { ...day, items: day.items.filter(it => it.id !== item.id) } : day
        )
      )
    }

    setDays(prev =>
      prev.map((day, i) =>
        i === dayIndex ? { ...day, items: [...day.items, item] } : day
      )
    )

    dragRef.current = null
    setDraggingOver(null)
  }

  const removeFromDay = (item: Item, dayIndex: number) => {
    setDays(prev =>
      prev.map((day, i) =>
        i === dayIndex ? { ...day, items: day.items.filter(it => it.id !== item.id) } : day
      )
    )
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
          <article
            key={day.label}
            className={`day-card${draggingOver === dayIndex ? ' drop-over' : ''}`}
            onDragOver={e => handleDragOver(e, dayIndex)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(dayIndex)}
          >
            <div className="day-meta">
              <span className="day-pill">{day.label}</span>
              <span className="day-date">{day.date}</span>
            </div>
            <h2>{day.title}</h2>
            <ul className="day-list">
              {day.items.map(item => (
                <li key={item.id} className="day-list-item">
                  <span>{item.text}</span>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromDay(item, dayIndex)}
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
