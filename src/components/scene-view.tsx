import { agentIconSrc } from "@/lib/agents";
import { MAP_BACKGROUNDS, type MapBackground } from "@/lib/map-backgrounds";
import type { SceneDto, SceneElement, ScenePoint } from "@/types/scene";

const PAD = 40;
const INK = "#e5e7eb";

function bounds(els: SceneElement[]) {
  const pts: ScenePoint[] = els.flatMap((e) => ("points" in e ? e.points : [{ x: e.x, y: e.y }]));
  if (pts.length === 0) return { x: 0, y: 0, w: 400, h: 300 };
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs) - PAD;
  const y = Math.min(...ys) - PAD;
  return { x, y, w: Math.max(...xs) + PAD - x, h: Math.max(...ys) + PAD - y };
}

/** The map's crop, grown if needed so elements placed off the map stay visible. */
function fitToBackground(bg: MapBackground, els: SceneElement[]) {
  const e = bounds(els); // file units, already padded
  const x0 = Math.min(bg.crop.x, bg.scale * e.x + bg.offsetX);
  const y0 = Math.min(bg.crop.y, bg.scale * e.y + bg.offsetY);
  const x1 = Math.max(bg.crop.x + bg.crop.w, bg.scale * (e.x + e.w) + bg.offsetX);
  const y1 = Math.max(bg.crop.y + bg.crop.h, bg.scale * (e.y + e.h) + bg.offsetY);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

const path = (pts: ScenePoint[], closed: boolean) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + (closed ? " Z" : "");

/** Last-segment arrowhead, drawn as a small filled triangle. */
function arrow(pts: ScenePoint[], c: string) {
  if (pts.length < 2) return null;
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const s = 12;
  const p = (d: number) => `${b.x - s * Math.cos(ang + d)},${b.y - s * Math.sin(ang + d)}`;
  return <polygon points={`${b.x},${b.y} ${p(0.45)} ${p(-0.45)}`} fill={c} />;
}

function Element({ e }: { e: SceneElement }) {
  switch (e.type) {
    case "pen":
    case "freehand": {
      const c = e.color ?? INK;
      return (
        <g>
          <path
            d={path(e.points, e.closed)}
            fill="none"
            stroke={c}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={e.dotted ? "2 8" : undefined}
          />
          {e.arrowEnd && arrow(e.points, c)}
        </g>
      );
    }
    case "character": {
      const rad = ((e.rotation - 90) * Math.PI) / 180;
      const icon = agentIconSrc(e.characterId);
      return (
        <g>
          <circle cx={e.x} cy={e.y} r={15} fill="#1f2937" />
          {icon ? (
            <image href={icon} x={e.x - 15} y={e.y - 15} width={30} height={30} clipPath="url(#agent-clip)" />
          ) : (
            <text x={e.x} y={e.y + 4} textAnchor="middle" fontSize={11} fill={INK}>
              {e.characterId.slice(0, 2).toUpperCase()}
            </text>
          )}
          <circle cx={e.x} cy={e.y} r={15} fill="none" stroke={INK} strokeWidth={2} />
          <line x1={e.x + 15 * Math.cos(rad)} y1={e.y + 15 * Math.sin(rad)} x2={e.x + 22 * Math.cos(rad)} y2={e.y + 22 * Math.sin(rad)} stroke={INK} strokeWidth={2} />
        </g>
      );
    }
    case "ability": {
      const c = e.color ?? "#7a9cff";
      return (
        <g>
          <rect x={e.x - 9} y={e.y - 9} width={18} height={18} transform={`rotate(45 ${e.x} ${e.y})`} fill={c} fillOpacity={0.35} stroke={c} strokeWidth={2} />
          <text x={e.x} y={e.y + 26} textAnchor="middle" fontSize={10} fill={INK}>
            {(e.abilityId ?? e.characterId).replaceAll("_", " ")}
          </text>
        </g>
      );
    }
    case "text":
      return (
        <text x={e.x} y={e.y} fontSize={e.fontSize} fill={e.color ?? INK}>
          {e.content}
        </text>
      );
    case "bomb":
      return <rect x={e.x - 8} y={e.y - 8} width={16} height={16} fill="#facc15" stroke="#000" strokeWidth={2} />;
  }
}

/**
 * Static SVG of the supported Wingman primitives. The map artwork and Wingman's
 * canvas calibration are not verified, so no map is drawn: positions are relative
 * to each other, fitted to the scene's bounds.
 */
export function SceneView({ scene, label }: { scene: SceneDto; label: string }) {
  const bg = scene.mapId ? MAP_BACKGROUNDS[scene.mapId] : undefined;
  const skipped = scene.unsupported.reduce((n, u) => n + u.count, 0);
  const view = bg ? fitToBackground(bg, scene.elements) : bounds(scene.elements);
  return (
    <figure className="m-0">
      <svg role="img" aria-label={label} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} className="mx-auto max-h-[75vh] w-full bg-[#0d1822]">
        <defs>
          <clipPath id="agent-clip" clipPathUnits="objectBoundingBox">
            <circle cx={0.5} cy={0.5} r={0.5} />
          </clipPath>
        </defs>
        {bg && <image href={bg.src} x={0} y={0} width={bg.width} height={bg.height} />}
        <g transform={bg ? `translate(${bg.offsetX} ${bg.offsetY}) scale(${bg.scale})` : undefined}>
          {scene.elements.map((e, i) => (
            <Element key={i} e={e} />
          ))}
        </g>
      </svg>
      <figcaption className="space-y-1 border-t border-border bg-surface p-2 text-xs text-muted">
        <p>
          Map: {scene.mapId ?? "unknown"} · {scene.elements.length} elements shown.{" "}
          {bg
            ? `Drawn on the ${scene.mapId} map (${bg.note}).`
            : "No verified background for this map yet, so positions are relative."}
        </p>
        {skipped > 0 && (
          <p>Not shown (unsupported): {scene.unsupported.map((u) => `${u.type} ×${u.count}`).join(", ")}</p>
        )}
      </figcaption>
    </figure>
  );
}
