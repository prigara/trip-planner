import { useEffect, useRef, useState, type ReactNode } from 'react'
import './App.css'

type Item = { id: string; text: string }
type DaySlot = 'items' | 'lunch' | 'dinner'
type DragSource = 'todo' | { dayIndex: number; slot: DaySlot }
type TripState = { days: Day[]; todoItems: Item[] }

const STORAGE_KEY = 'trip-planner-state-v1'
const THEME_STORAGE_KEY = 'trip-planner-theme-v1'

type ThemeChoice = 'light' | 'dark' | 'system'

const isThemeChoice = (value: unknown): value is ThemeChoice =>
  value === 'light' || value === 'dark' || value === 'system'

const loadThemeChoice = (): ThemeChoice => {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isThemeChoice(stored) ? stored : 'system'
}

const resolveTheme = (choice: ThemeChoice): 'light' | 'dark' => {
  if (choice !== 'system') return choice
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
const mkId = () => globalThis.crypto?.randomUUID() ?? `${Date.now()}-${Math.random()}`
const mkItem = (text: string): Item => ({ id: mkId(), text })
const DATE_DISPLAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})
const HEADER_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})
const dayFiveItems = ['Pastries run', 'Souvenirs', 'Pack for departure']
const daySixItems = ['Check out', 'Station transfer', 'Midday train departure']

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
    title: 'Final Paris Day',
    items: dayFiveItems.map(mkItem),
    lunch: null,
    dinner: null,
  },
  {
    label: 'Day 6',
    date: 'May 5',
    title: 'Midday Train Departure',
    items: daySixItems.map(mkItem),
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

const parseDayDate = (dateLabel: string) => {
  const parsedDate = new Date(`${dateLabel}, 2026 00:00:00 UTC`)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

const formatDayDate = (date: Date) => DATE_DISPLAY_FORMATTER.format(date)
const formatHeaderDate = (date: Date) => HEADER_DATE_FORMATTER.format(date)

const getTripRangeLabel = (days: Day[]) => {
  const firstDay = days[0]
  const lastDay = days[days.length - 1]

  if (!firstDay || !lastDay) return ''

  const firstDate = parseDayDate(firstDay.date)
  const lastDate = parseDayDate(lastDay.date)

  if (!firstDate || !lastDate) {
    return `${firstDay.date} • ${lastDay.date}`
  }

  return `${formatHeaderDate(firstDate)} • ${formatHeaderDate(lastDate)}`
}

const THEME_OPTIONS: { value: ThemeChoice; label: string; icon: ReactNode }[] = [
  {
    value: 'light',
    label: 'Light theme',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark theme',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'System theme',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
]

function ThemeChooser({
  value,
  onChange,
}: {
  value: ThemeChoice
  onChange: (next: ThemeChoice) => void
}) {
  return (
    <div className="theme-chooser" role="group" aria-label="Theme">
      {THEME_OPTIONS.map(option => (
        <button
          key={option.value}
          type="button"
          className="theme-chooser-btn"
          aria-label={option.label}
          aria-pressed={value === option.value}
          title={option.label}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
        </button>
      ))}
    </div>
  )
}

function App() {
  const [{ days: initialStoredDays, todoItems: initialStoredTodoItems }] = useState(loadTripState)
  const [days, setDays] = useState<Day[]>(initialStoredDays)
  const [todoItems, setTodoItems] = useState<Item[]>(initialStoredTodoItems)
  const [newItemText, setNewItemText] = useState('')
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(loadThemeChoice)
  const [draggingOver, setDraggingOver] = useState<string | null>(null)
  const dragRef = useRef<{ item: Item; source: DragSource } | null>(null)
  const dayTitleRefs = useRef<Array<HTMLTextAreaElement | null>>([])

  const autoSizeDayTitle = (element: HTMLTextAreaElement | null) => {
    if (!element) return
    element.style.height = '0px'
    element.style.height = `${element.scrollHeight}px`
  }

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        days,
        todoItems,
      } satisfies TripState),
    )
  }, [days, todoItems])

  useEffect(() => {
    dayTitleRefs.current.forEach(autoSizeDayTitle)
  }, [days])

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeChoice)

    const applyTheme = () => {
      document.documentElement.dataset.theme = resolveTheme(themeChoice)
    }
    applyTheme()

    if (themeChoice !== 'system' || !window.matchMedia) return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [themeChoice])

  const addItem = () => {
    const text = newItemText.trim()
    if (!text) return
    setTodoItems(prev => [...prev, mkItem(text)])
    setNewItemText('')
  }

  const getDropId = (dayIndex: number, slot: DaySlot) => `${dayIndex}-${slot}`
  const getItemDropId = (dayIndex: number, itemIndex: number) => `${dayIndex}-items-${itemIndex}`

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

  const updateDayTitle = (dayIndex: number, title: string) => {
    setDays(prev =>
      prev.map((day, i) => (i === dayIndex ? { ...day, title } : day))
    )
  }

  const addExtraDay = () => {
    setDays(prev => {
      const lastDay = prev[prev.length - 1]
      const nextDayNumber = prev.length + 1
      const lastDayDate = lastDay ? parseDayDate(lastDay.date) : null
      const nextDate = lastDayDate
        ? new Date(lastDayDate.getTime() + 24 * 60 * 60 * 1000)
        : null

      return [
        ...prev,
        {
          label: `Day ${nextDayNumber}`,
          date: nextDate ? formatDayDate(nextDate) : `Day ${nextDayNumber}`,
          title: 'Extra day',
          items: [],
          lunch: null,
          dinner: null,
        },
      ]
    })
  }

  const removeDay = (dayIndex: number) => {
    const dayToRemove = days[dayIndex]
    const itemsToReturn = [
      ...dayToRemove.items,
      ...(dayToRemove.lunch ? [dayToRemove.lunch] : []),
      ...(dayToRemove.dinner ? [dayToRemove.dinner] : []),
    ]

    if (itemsToReturn.length > 0) {
      setTodoItems(todo => [...todo, ...itemsToReturn])
    }

    setDays(prev => {
      const remainingDays = prev.filter((_, i) => i !== dayIndex)
      if (remainingDays.length === 0) return []

      const firstDay = prev[0]
      const firstDate = parseDayDate(firstDay.date)

      return remainingDays.map((day, i) => {
        const nextDate = firstDate
          ? new Date(firstDate.getTime() + i * 24 * 60 * 60 * 1000)
          : null

        return {
          ...day,
          label: `Day ${i + 1}`,
          date: nextDate ? formatDayDate(nextDate) : day.date,
        }
      })
    })
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

  const moveItemIntoDayList = (dayIndex: number, targetIndex: number) => {
    if (!dragRef.current) return
    const { item, source } = dragRef.current

    const sourceIndex =
      source !== 'todo' && source.slot === 'items'
        ? days[source.dayIndex].items.findIndex(currentItem => currentItem.id === item.id)
        : -1

    const adjustedTargetIndex =
      source !== 'todo' &&
      source.slot === 'items' &&
      source.dayIndex === dayIndex &&
      sourceIndex !== -1 &&
      sourceIndex < targetIndex
        ? targetIndex - 1
        : targetIndex

    if (
      source !== 'todo' &&
      source.slot === 'items' &&
      source.dayIndex === dayIndex &&
      sourceIndex === adjustedTargetIndex
    ) {
      dragRef.current = null
      setDraggingOver(null)
      return
    }

    let nextDays = days
    let nextTodoItems = todoItems

    if (source === 'todo') {
      nextTodoItems = todoItems.filter(todoItem => todoItem.id !== item.id)
    } else {
      nextDays = days.map((day, i) => {
        if (i !== source.dayIndex) return day
        if (source.slot === 'items') {
          return { ...day, items: day.items.filter(currentItem => currentItem.id !== item.id) }
        }
        return { ...day, [source.slot]: day[source.slot]?.id === item.id ? null : day[source.slot] }
      })
    }

    nextDays = nextDays.map((day, i) => {
      if (i !== dayIndex) return day

      const clampedTargetIndex = Math.max(0, Math.min(adjustedTargetIndex, day.items.length))
      return {
        ...day,
        items: [
          ...day.items.slice(0, clampedTargetIndex),
          item,
          ...day.items.slice(clampedTargetIndex),
        ],
      }
    })

    setDays(nextDays)
    setTodoItems(nextTodoItems)
    dragRef.current = null
    setDraggingOver(null)
  }

  const handleListDragOver = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault()
    setDraggingOver(getItemDropId(dayIndex, days[dayIndex].items.length))
  }

  const handleListItemDragOver = (e: React.DragEvent, dayIndex: number, itemIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const insertAfter = e.clientY > bounds.top + bounds.height / 2
    const targetIndex = insertAfter ? itemIndex + 1 : itemIndex

    setDraggingOver(getItemDropId(dayIndex, targetIndex))
  }

  const handleListItemDrop = (e: React.DragEvent, dayIndex: number, itemIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const insertAfter = e.clientY > bounds.top + bounds.height / 2
    const targetIndex = insertAfter ? itemIndex + 1 : itemIndex

    moveItemIntoDayList(dayIndex, targetIndex)
  }

  return (
    <div className="app">
      <header className="trip-header">
        <div>
          <p className="eyebrow">Trip</p>
          <h1>Paris</h1>
        </div>
        <div className="trip-actions">
          <div className="trip-dates">
            {getTripRangeLabel(days)}
          </div>
          <ThemeChooser value={themeChoice} onChange={setThemeChoice} />
          <button className="trip-action-btn" onClick={addExtraDay}>
            Add day
          </button>
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
          <article key={`${day.label}-${day.date}`} className="day-card">
            <div className="day-meta">
              <span className="day-pill">{day.label}</span>
              <div className="day-meta-actions">
                <span className="day-date">{day.date}</span>
                <button
                  className="remove-day-btn"
                  onClick={() => removeDay(dayIndex)}
                  aria-label={`Remove ${day.label}`}
                  title="Remove day"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
            <textarea
              className="day-title-input"
              ref={element => {
                dayTitleRefs.current[dayIndex] = element
                autoSizeDayTitle(element)
              }}
              value={day.title}
              onChange={e => {
                autoSizeDayTitle(e.currentTarget)
                updateDayTitle(dayIndex, e.target.value)
              }}
              aria-label={`${day.label} title`}
              rows={1}
            />
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
                draggingOver === getItemDropId(dayIndex, day.items.length) ? ' insert-end' : ''
              }`}
              onDragOver={e => handleListDragOver(e, dayIndex)}
              onDragLeave={handleDragLeave}
              onDrop={() => moveItemIntoDayList(dayIndex, day.items.length)}
            >
              {day.items.map((item, itemIndex) => (
                <li
                  key={item.id}
                  className={`day-list-item${
                    draggingOver === getItemDropId(dayIndex, itemIndex) ? ' insert-before' : ''
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(item, { dayIndex, slot: 'items' })}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => handleListItemDragOver(e, dayIndex, itemIndex)}
                  onDrop={e => handleListItemDrop(e, dayIndex, itemIndex)}
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
