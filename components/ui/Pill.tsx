interface PillProps {
  label: string;
  onClick?: () => void;
}

export default function Pill({ label, onClick }: PillProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 text-sm hover:bg-blue-600 hover:text-white transition"
    >
      {label}
    </button>
  );
}
