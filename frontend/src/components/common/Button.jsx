export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
}) {
  const variants = {
    primary:
      "bg-white text-black hover:bg-zinc-200",
    secondary:
      "bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800",
    danger:
      "bg-red-500 text-white hover:bg-red-400",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-5
        py-3
        rounded-2xl
        font-medium
        transition
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}