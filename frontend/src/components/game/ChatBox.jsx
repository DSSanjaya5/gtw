export default function ChatBox({
  messages = [],
}) {

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 h-[420px] flex flex-col">

      <div className="mb-4">

        <h2 className="text-xl font-semibold">
          Chat
        </h2>

      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">

        {messages.length === 0 ? (

          <div className="text-zinc-500 text-sm">
            No messages yet
          </div>

        ) : (

          messages.map(
            (msg, index) => (

              <div
                key={index}
                className="bg-zinc-800 rounded-2xl px-4 py-3"
              >

                <div className="text-sm font-semibold text-zinc-300 mb-1">
                  {msg.username}
                </div>

                <div className="text-sm text-zinc-100 break-words">
                  {msg.message}
                </div>

              </div>
            )
          )

        )}

      </div>

    </div>
  );
}