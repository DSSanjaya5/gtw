import { useEffect, useRef, useState } from "react";

export default function CanvasBoard({
  isDrawer = false,
  socket,
}) {
  const canvasRef = useRef(null);

  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ffffff";

    const handleDrawEvent = (event) => {
      const payload = JSON.parse(event.data);

      if (payload.event !== "draw") return;

      const frame = payload.data.frame;

      ctx.beginPath();
      ctx.moveTo(frame.prevX, frame.prevY);
      ctx.lineTo(frame.x, frame.y);
      ctx.stroke();
    };

    socket?.addEventListener(
      "message",
      handleDrawEvent
    );

    return () => {
      socket?.removeEventListener(
        "message",
        handleDrawEvent
      );
    };
  }, [socket]);

  const getCoords = (e) => {
    const rect =
      canvasRef.current.getBoundingClientRect();

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = () => {
    if (!isDrawer) return;
    setDrawing(true);
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const draw = (e) => {
    if (!drawing || !isDrawer) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const { x, y } = getCoords(e);

    const prevX = x - 1;
    const prevY = y - 1;

    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();

    socket?.send(
      JSON.stringify({
        event: "draw",
        data: {
          prevX,
          prevY,
          x,
          y,
        },
      })
    );
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4">

      <canvas
        ref={canvasRef}
        width={900}
        height={500}
        className="w-full bg-zinc-950 rounded-2xl cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onMouseMove={draw}
      />

    </div>
  );
}