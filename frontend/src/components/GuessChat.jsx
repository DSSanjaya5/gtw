import { useEffect, useRef, useState } from 'react'

export default function GuessChat({ chatLog, isDrawer, hasGuessed, onSendGuess }) {
  const [guessText, setGuessText] = useState('')
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatLog])

  function handleSubmit(e) {
    e.preventDefault()
    const text = guessText.trim()
    if (!text) return
    onSendGuess(text)
    setGuessText('')
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {chatLog.map((msg, i) => {
          let msgClass = 'chat-msg'
          if (msg.system) {
            msgClass += ' msg-system'
            if (msg.correct) msgClass += ' msg-correct-alert'
          } else if (msg.correct) {
            msgClass += ' msg-correct'
          } else {
            msgClass += ' msg-wrong'
          }

          return (
            <div key={i} className={msgClass}>
              {msg.system ? (
                <span className="msg-text">{msg.text}</span>
              ) : (
                <>
                  <strong className="msg-author">{msg.playerName}: </strong>
                  <span className="msg-text">{msg.text}</span>
                </>
              )}
            </div>
          )
        })}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          placeholder={
            isDrawer
              ? "You are drawing, you cannot guess!"
              : hasGuessed
              ? "You guessed correctly! Shh..."
              : "Type your guess here..."
          }
          value={guessText}
          onChange={e => setGuessText(e.target.value)}
          disabled={isDrawer || hasGuessed}
          maxLength={40}
          autoComplete="off"
        />
        <button type="submit" disabled={isDrawer || hasGuessed || !guessText.trim()} className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  )
}
