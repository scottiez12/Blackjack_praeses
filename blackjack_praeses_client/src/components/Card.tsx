interface CardProps {
  rank: string;
  suit: string;
  isHidden?: boolean;
}

export default function Card({ rank, suit, isHidden }: CardProps) {
  if (isHidden) {
    return (
      <div className="w-20 h-28 bg-gray-700 rounded-xl border-2 border-gray-500 flex items-center justify-center shadow-xl animate-[fadeIn_0.3s_ease-in]">
        <span className="text-3xl text-white">🂠</span>
      </div>
    );
  }

  const isRed = suit === "♥" || suit === "♦";

  return (
    <div className="w-20 h-28 bg-white rounded-xl border-2 border-gray-300 flex flex-col justify-between p-2 shadow-xl animate-[fadeIn_0.3s_ease-in]">
      <div
        className={`text-lg font-bold ${isRed ? "text-red-600" : "text-black"}`}
      >
        {rank}
      </div>
      <div
        className={`text-3xl text-center ${
          isRed ? "text-red-600" : "text-black"
        }`}
      >
        {suit}
      </div>
      <div
        className={`text-lg font-bold text-right ${
          isRed ? "text-red-600" : "text-black"
        }`}
      >
        {rank}
      </div>
    </div>
  );
}
