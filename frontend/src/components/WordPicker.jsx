export default function WordPicker({ isDrawer, choices, drawerName, onPick }) {
  if (isDrawer) {
    return (
      <div className="word-picker-overlay">
        <div className="word-picker-card">
          <p className="picker-label">Choose your word to draw</p>
          <div className="word-choices">
            {choices.length === 0 ? (
              <div className="spinner" />
            ) : (
              choices.map(word => (
                <button key={word} className="word-choice-btn" onClick={() => onPick(word)}>
                  {word}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="word-picker-overlay">
      <div className="word-picker-card word-picker-waiting">
        <div className="spinner" />
        <p><strong>{drawerName}</strong> is choosing a word…</p>
      </div>
    </div>
  )
}
