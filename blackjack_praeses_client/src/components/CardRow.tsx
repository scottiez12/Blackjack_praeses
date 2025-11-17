import Card from "./Card";

interface CardData {
  rank: string;
  suit: string;
  isHidden?: boolean;
}

interface CardRowProps {
  cards: CardData[];
}

export default function CardRow({ cards }: CardRowProps) {
  return (
    <div className="flex gap-4 justify-center flex-wrap">
      {cards.map((c: CardData, i: number) => (
        <Card key={i} rank={c.rank} suit={c.suit} isHidden={c.isHidden} />
      ))}
    </div>
  );
}
