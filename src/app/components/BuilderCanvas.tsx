"use client";

import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import { Rnd } from "react-rnd";
import { getCanvasSize } from "@/lib/floorLayout";
import {
  updateTemplateTablePosition,
  updateTemplateTableSize,
  updateTemplateTableRotation,
  updateTemplateLabelPosition,
  updateTemplateLabelSize,
  updateTemplateLabelRotation
} from "../templateActions";

type Item = {
  id: string;
  tableNumber: number;
  seats: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotDeg: number;
};

type LabelItem = {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotDeg: number;
};

type BuilderCanvasProps = {
  templateId: string;
  items: Item[];
  labels: LabelItem[];
  selectedId: string | null;
  selectedLabelId: string | null;
  onSelect: (id: string | null) => void;
  onSelectLabel: (id: string | null) => void;
};

function normalizeDeg(deg: number): number {
  let d = Math.round(deg) % 360;
  if (d < 0) d += 360;
  return d;
}

function RotateHandle({
  getContainer,
  rotDeg,
  onRotateEnd
}: {
  getContainer: () => HTMLDivElement | null;
  rotDeg: number;
  onRotateEnd: (deg: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [liveDeg, setLiveDeg] = useState<number | null>(null);
  const lastDegRef = useRef(rotDeg);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const el = getContainer();
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let angle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      angle = (angle + 90 + 360) % 360;
      if (e.shiftKey) angle = (Math.round(angle / 15) * 15) % 360;
      const norm = normalizeDeg(angle);
      lastDegRef.current = norm;
      setLiveDeg(norm);
    };
    const onUp = () => {
      setDragging(false);
      onRotateEnd(lastDegRef.current);
      setLiveDeg(null);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [dragging, getContainer, onRotateEnd]);

  return (
    <div
      className="absolute -top-8 left-1/2 -translate-x-1/2 cursor-grab rounded-full border-2 border-[var(--primary-action)] bg-[var(--panel)] p-1.5 text-[var(--primary-action)] shadow active:cursor-grabbing"
      style={{ boxShadow: "var(--shadow)" }}
      title="Drag to rotate (hold Shift for 15° snap)"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        lastDegRef.current = liveDeg !== null ? liveDeg : rotDeg;
        setDragging(true);
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    </div>
  );
}

export function BuilderCanvas({
  templateId,
  items: initialItems,
  labels: initialLabels,
  selectedId,
  selectedLabelId,
  onSelect,
  onSelectLabel
}: BuilderCanvasProps) {
  const safeInitialItems = initialItems ?? [];
  const safeInitialLabels = initialLabels ?? [];
  const [items, setItems] = useState(safeInitialItems);
  const [labels, setLabels] = useState<LabelItem[]>(safeInitialLabels);
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Sync from server when template, list identity, or rotation/position changes (so panel rotation buttons update canvas)
  const itemsKey = `${templateId}-${safeInitialItems.length}-${safeInitialItems.map((i) => i.id).sort().join(",")}-${safeInitialItems.map((i) => `${i.rotDeg}`).join(",")}`;
  const labelsKey = `${templateId}-${safeInitialLabels.length}-${safeInitialLabels.map((l) => l.id).sort().join(",")}-${safeInitialLabels.map((l) => `${l.rotDeg}`).join(",")}`;
  useEffect(() => {
    setItems(safeInitialItems);
  }, [itemsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: sync only when key changes
  useEffect(() => {
    setLabels(safeInitialLabels);
  }, [labelsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: sync only when key changes

  // Fire-and-forget server updates so UI stays responsive (no await)
  const handleDragStop = useCallback(
    (id: string, x: number, y: number) => {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, x, y } : i))
      );
      void updateTemplateTablePosition(templateId, id, x, y);
    },
    [templateId]
  );

  const handleResizeStop = useCallback(
    (id: string, x: number, y: number, w: number, h: number) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, x, y, w, h } : i
        )
      );
      void updateTemplateTableSize(templateId, id, x, y, w, h);
    },
    [templateId]
  );

  const handleRotateEnd = useCallback((id: string, deg: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, rotDeg: deg } : i))
    );
    void updateTemplateTableRotation(templateId, id, deg);
  }, [templateId]);

  const handleLabelDragStop = useCallback(
    (id: string, x: number, y: number) => {
      setLabels((prev) =>
        prev.map((l) => (l.id === id ? { ...l, x, y } : l))
      );
      void updateTemplateLabelPosition(templateId, id, x, y);
    },
    [templateId]
  );

  const handleLabelResizeStop = useCallback(
    (id: string, x: number, y: number, w: number, h: number) => {
      setLabels((prev) =>
        prev.map((l) => (l.id === id ? { ...l, x, y, w, h } : l))
      );
      void updateTemplateLabelSize(templateId, id, x, y, w, h);
    },
    [templateId]
  );

  const handleLabelRotateEnd = useCallback((id: string, deg: number) => {
    setLabels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, rotDeg: deg } : l))
    );
    void updateTemplateLabelRotation(templateId, id, deg);
  }, [templateId]);

  const combinedBounds = useMemo(
    () => [
      ...items.map((i) => ({ x: i.x, y: i.y, w: i.w, h: i.h })),
      ...labels.map((l) => ({ x: l.x, y: l.y, w: l.w, h: l.h }))
    ],
    [items, labels]
  );
  const { width: canvasWidth, height: canvasHeight } = useMemo(
    () =>
      getCanvasSize(
        combinedBounds.length > 0 ? combinedBounds : [{ x: 0, y: 0, w: 900, h: 650 }]
      ),
    [combinedBounds]
  );

  return (
    <div
      className="relative select-none rounded-lg border border-[var(--floor-border)] bg-[var(--floor-bg)] outline-none"
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        minWidth: `${canvasWidth}px`,
        minHeight: `${canvasHeight}px`,
        boxShadow: "var(--shadow)",
        backgroundImage: "linear-gradient(rgba(0,0,0,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.04) 1px, transparent 1px)",
        backgroundSize: "12px 12px"
      }}
      tabIndex={-1}
    >
      <p className="absolute right-2 top-2 z-10 text-xs text-[var(--muted)]">
        Hold Shift while dragging rotate handle for 15° snap
      </p>
      {/* Labels: light gray only, never green/orange/red; selected = neutral gray border only, no glow */}
      {labels.map((label) => (
        <Rnd
          key={label.id}
          size={{ width: label.w, height: label.h }}
          position={{ x: label.x, y: label.y }}
          dragHandleClassName="drag-handle"
          onDragStop={(_e, d) => void handleLabelDragStop(label.id, d.x, d.y)}
          onResizeStop={(_e, _dir, ref, _delta, position) => {
            const w = parseInt(ref.style.width, 10) || label.w;
            const h = parseInt(ref.style.height, 10) || label.h;
            handleLabelResizeStop(label.id, position.x, position.y, w, h);
          }}
          bounds="parent"
          enableResizing={{ top: true, right: true, bottom: true, left: true, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true }}
          dragGrid={[10, 10]}
          resizeGrid={[10, 10]}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onSelect(null);
            onSelectLabel(label.id);
          }}
          style={{ zIndex: selectedLabelId === label.id ? 20 : 5, outline: "none" }}
          className={`rounded-none border outline-none shadow-none ${
            selectedLabelId === label.id
              ? "border-[var(--label-border)] border-2 bg-[var(--label-bg)]"
              : "border-[var(--label-border)] bg-[var(--label-bg)]"
          }`}
        >
          <div
            ref={(el) => {
              labelRefs.current[label.id] = el;
            }}
            className="relative h-full w-full"
            style={{ transform: `rotate(${label.rotDeg}deg)` }}
          >
            <div className="drag-handle flex h-full w-full cursor-move items-center justify-center px-1 py-0.5 text-center">
              <span className="text-[0.65rem] font-medium uppercase tracking-wide text-[var(--label-text)]">
                {label.text}
              </span>
            </div>
            {selectedLabelId === label.id && (
              <RotateHandle
                getContainer={() => labelRefs.current[label.id] ?? null}
                rotDeg={label.rotDeg}
                onRotateEnd={(deg) => handleLabelRotateEnd(label.id, deg)}
              />
            )}
          </div>
        </Rnd>
      ))}
      {items.map((item) => (
        <Rnd
          key={item.id}
          size={{ width: item.w, height: item.h }}
          position={{ x: item.x, y: item.y }}
          dragHandleClassName="drag-handle"
          onDragStop={(_e, d) => void handleDragStop(item.id, d.x, d.y)}
          onResizeStop={(_e, _dir, ref, _delta, position) => {
            const w = parseInt(ref.style.width, 10) || item.w;
            const h = parseInt(ref.style.height, 10) || item.h;
            handleResizeStop(item.id, position.x, position.y, w, h);
          }}
          bounds="parent"
          enableResizing={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true
          }}
          dragGrid={[10, 10]}
          resizeGrid={[10, 10]}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectLabel(null);
            onSelect(item.id);
          }}
          style={{ zIndex: 10, outline: "none" }}
          className={`rounded-lg border shadow outline-none ${
            selectedId === item.id
              ? "border-[var(--primary-action)] bg-[var(--panel)] ring-2 ring-[var(--primary-action)]/30 ring-inset"
              : "border-[var(--border)] bg-[var(--panel)]"
          }`}
        >
          <div
            ref={(el) => {
              containerRefs.current[item.id] = el;
            }}
            className="relative h-full w-full"
            style={{ transform: `rotate(${item.rotDeg}deg)` }}
          >
            <div className="drag-handle flex h-full cursor-move flex-col items-center justify-center p-2 text-center">
              <span className="table-number text-[var(--text)]">
                {item.tableNumber}
              </span>
              <span className="mt-1 meta-text rounded-sm bg-[var(--panel-2)] px-2 py-0.5 text-[var(--muted)] border border-[var(--border)]">
                {item.seats} seats
              </span>
            </div>
            {selectedId === item.id && (
              <RotateHandle
                getContainer={() => containerRefs.current[item.id] ?? null}
                rotDeg={item.rotDeg}
                onRotateEnd={(deg) => handleRotateEnd(item.id, deg)}
              />
            )}
          </div>
        </Rnd>
      ))}
    </div>
  );
}
