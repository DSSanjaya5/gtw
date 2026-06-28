export default function WordDisplay({ isDrawer, word, wordHint }) {
  if (isDrawer) {
    return (
      <div className="word-display-container">
        <span className="wd-label">YOUR SECRET WORD</span>
        <span className="wd-value wd-drawer">{word || 'CHOOSING...'}</span>
      </div>
    )
  }

  // Guessers see blanks
  const length = wordHint?.word_length || 0
  const blanks = Array.from({ length }).map((_, i) => (
    <span key={i} className="wd-blank-char">_</span>
  ))

  return (
    <div className="word-display-container">
      <span className="wd-label">GUESS THE WORD</span>
      <div className="wd-blanks-container">
        {length > 0 ? (
          <>
            <div className="wd-blanks">{blanks}</div>
            <span className="wd-hint-len">({length} letters)</span>
          </>
        ) : (
          <span className="wd-waiting">Waiting for word selection...</span>
        )}
      </div>
    </div>
  )
}
