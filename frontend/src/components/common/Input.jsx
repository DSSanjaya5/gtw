export default function Input({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  disabled = false,
  className = "",
}) {
  return (
    <div className="w-full">

      {label && (
        <label className="block text-sm text-zinc-300 mb-2">
          {label}
        </label>
      )}

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full
          bg-zinc-900
          border
          border-zinc-800
          rounded-2xl
          px-4
          py-3
          outline-none
          focus:border-zinc-600
          transition
          ${className}
        `}
      />

    </div>
  );
}