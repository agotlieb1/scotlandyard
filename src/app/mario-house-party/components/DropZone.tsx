import { useDroppable } from "@dnd-kit/core";
import { Box, Stack, Typography } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import type { CardWithId } from "../types";
import { CardDisplay } from "./CardDisplay";
import { TABLE } from "../theme";

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

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
    // Quick taps pass straight through; a press and hold starts the drag.
    touchAction: "manipulation" as const,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger tap if not dragging
    if (!isDragging && onTap) {
      e.preventDefault();
      e.stopPropagation();
      onTap(card.id);
    }
  };

  return (
    // dnd-kit adds aria-describedby only once it is running in the browser, so
    // the server's markup is deliberately an attribute short of the client's.
    <div
      ref={setNodeRef}
      style={style}
      suppressHydrationWarning
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
        borderRadius: 3,
        // An inlay cut into the felt: darker, lit from the top edge, with a
        // brass line that brightens when a card is held over it.
        background: isOver
          ? "radial-gradient(ellipse at 50% 0%, rgba(111,209,255,0.22), rgba(4,20,28,0.6) 70%)"
          : "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.18), rgba(4,20,28,0.42) 70%)",
        border: "1px dashed",
        borderColor: isOver ? TABLE.cyan : "rgba(217, 182, 95, 0.35)",
        boxShadow: isOver
          ? `inset 0 2px 14px rgba(0,0,0,0.5), 0 0 0 3px rgba(111,209,255,0.25)`
          : "inset 0 2px 14px rgba(0,0,0,0.5)",
        transition: "background 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
      }}
    >
      {cards.length === 0 ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={0.5}
          sx={{ minHeight: 180, textAlign: "center", px: 2 }}
        >
          <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.72)" }}>
            {isOver ? "Drop it here" : "Tap a card to deal it in"}
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.42)" }}>
            On a desktop you can drag instead — on a phone, press and hold
          </Typography>
        </Stack>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.25,
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
