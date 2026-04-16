import './App.css'

const days = [
  {
    label: 'Day 1',
    date: 'Apr 30',
    title: 'Arrival + Montmartre',
    items: ['Land at CDG', 'Check in', 'Sacré-Cœur sunset'],
  },
  {
    label: 'Day 2',
    date: 'May 1',
    title: 'Louvre + Seine',
    items: ['Louvre highlights', 'Tuileries stroll', 'Evening cruise'],
  },
  {
    label: 'Day 3',
    date: 'May 2',
    title: 'Le Marais',
    items: ['Café hop', 'Vintage shops', 'Picasso Museum'],
  },
  {
    label: 'Day 4',
    date: 'May 3',
    title: 'Latin Quarter',
    items: ['Panthéon', 'Bookstores', 'Luxembourg Gardens'],
  },
  {
    label: 'Day 5',
    date: 'May 4',
    title: 'Wrap + Depart',
    items: ['Pastries run', 'Souvenirs', 'Flight home'],
  },
]

function App() {
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

      <section className="days" aria-label="Trip days">
        {days.map((day) => (
          <article className="day-card" key={day.label}>
            <div className="day-meta">
              <span className="day-pill">{day.label}</span>
              <span className="day-date">{day.date}</span>
            </div>
            <h2>{day.title}</h2>
            <ul className="day-list">
              {day.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  )
}

export default App
