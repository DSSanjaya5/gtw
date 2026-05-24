export default function PageContainer({
  children,
  className = "",
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      
      <div
        className={`
          max-w-7xl
          mx-auto
          px-4
          md:px-6
          py-6
          ${className}
        `}
      >
        {children}
      </div>

    </div>
  );
}