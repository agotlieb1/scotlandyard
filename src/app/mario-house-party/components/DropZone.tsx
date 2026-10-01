import { useDroppable } from "@dnd-kit/core";
import { Box, Stack, Typography } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import type { CardWithId } from "../types";
import { CardDisplay } from "./CardDisplay";

interface DropZoneProps {
  id: string;
  cards: CardWithId[];
  onCardTap?: (cardId: string) => void;
}

interface DraggableCardProps {
  card: CardWithId;
  onTap?: (cardId: string) => void;
}

function DraggableCard({ card, onTap }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card: card.card },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger tap if not dragging
    if (!isDragging && onTap) {
      e.preventDefault();
      e.stopPropagation();
      onTap(card.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
    >
      <CardDisplay card={card.card} size="small" />
    </div>
  );
}

export function DropZone({ id, cards, onCardTap }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight: 200,
        p: 2,
        borderRadius: 2,
        bgcolor: isOver ? "rgba(111, 209, 255, 0.15)" : "rgba(111, 209, 255, 0.05)",
        border: "2px dashed",
        borderColor: isOver ? "rgba(111, 209, 255, 0.6)" : "rgba(111, 209, 255, 0.3)",
        transition: "all 0.2s",
      }}
    >
      {cards.length === 0 ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ minHeight: 180, color: "rgba(253, 247, 238, 0.4)" }}
        >
          <Typography variant="body2">
            Tap or drag cards to add them to your hand
          </Typography>
        </Stack>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          {cards.map((card) => (
            <DraggableCard key={card.id} card={card} onTap={onCardTap} />
          ))}
        </Box>
      )}
    </Box>
  );
}
