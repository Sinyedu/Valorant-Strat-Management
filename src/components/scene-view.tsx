import { abilityIconSrc } from "@/lib/abilities";
import { agentColor } from "@/lib/agent-colors";
import { agentIconSrc } from "@/lib/agents";
import { MAP_BACKGROUNDS, type MapBackground } from "@/lib/map-backgrounds";
import { DEFAULT_DRAW_SCALE, type SceneDto, type SceneElement, type ScenePoint } from "@/types/scene";

const PAD = 40;
const INK = "#e5e7eb";
const CHAR_R = 15 * DEFAULT_DRAW_SCALE; // character size 15, drawn at Wingman's default scale

function bounds(els: SceneElement[]) {
  const pts: ScenePoint[] = els.flatMap((e) => {
    if ("points" in e) return e.points;
    if (e.type === "ability") {
      const r = (e.radius ?? 0) * (e.scale ?? DEFAULT_DRAW_SCALE);
      const own = [{ x: e.x, y: e.y }, ...(e.line ?? [])];
      return r > 0 ? [...own, { x: e.x - r, y: e.y - r }, { x: e.x + r, y: e.y + r }] : own;
    }
    return [{ x: e.x, y: e.y }];
  });
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

const DEFAULT_ABILITY_COLOR = "#7a9cff";
const outlineId = (c: string) => `ability-outline-${c.replace("#", "")}`;
const outlineColors = (els: SceneElement[]) => [
  ...new Set(els.flatMap((e) => (e.type === "ability" ? [e.color ?? DEFAULT_ABILITY_COLOR] : []))),
];

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
      const accent = agentColor(e.characterId) ?? INK;
      return (
        <g>
          <circle cx={e.x} cy={e.y} r={CHAR_R} fill="#1f2937" />
          {icon ? (
            <image href={icon} x={e.x - CHAR_R} y={e.y - CHAR_R} width={CHAR_R * 2} height={CHAR_R * 2} clipPath="url(#agent-clip)" />
          ) : (
            <text x={e.x} y={e.y + 4} textAnchor="middle" fontSize={11} fill={INK}>
              {e.characterId.slice(0, 2).toUpperCase()}
            </text>
          )}
          <circle cx={e.x} cy={e.y} r={CHAR_R} fill="none" stroke={accent} strokeWidth={3} />
          <line x1={e.x + CHAR_R * Math.cos(rad)} y1={e.y + CHAR_R * Math.sin(rad)} x2={e.x + (CHAR_R + 7) * Math.cos(rad)} y2={e.y + (CHAR_R + 7) * Math.sin(rad)} stroke={accent} strokeWidth={3} />
        </g>
      );
    }
    case "ability": {
      const c = e.color ?? DEFAULT_ABILITY_COLOR;
      const k = e.scale ?? DEFAULT_DRAW_SCALE;
      const size = (e.iconSize ?? 24) * k; // icon diameter
      const t = e.iconT ?? 0.5;
      const [a, b] = e.line ? [e.line[0], e.line[e.line.length - 1]] : [null, null];
      const ix = a && b ? a.x + (b.x - a.x) * t : e.x;
      const iy = a && b ? a.y + (b.y - a.y) * t : e.y;
      const half = size / 2 / Math.SQRT2;
      const icon = abilityIconSrc(e.characterId, e.abilityId, e.altIcon);
      const name = (e.abilityId ?? e.characterId).replaceAll("_", " ");
      return (
        <g className="group">
          <title>{name}</title>
          {e.radiusHover ? (
            <circle cx={e.x} cy={e.y} r={e.radiusHover * k} fill={c} fillOpacity={0.06} stroke={c} strokeWidth={2} className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100" />
          ) : null}
          {e.radius ? (
            <circle cx={e.x} cy={e.y} r={e.radius * k} fill={c} fillOpacity={0.1} stroke={c} strokeWidth={2} />
          ) : null}
          {e.line ? (
            <path d={path(e.line, false)} fill="none" stroke={c} strokeWidth={4} strokeOpacity={0.7} strokeLinecap="round" />
          ) : null}
          {icon ? (
            <image href={icon} x={ix - size / 2} y={iy - size / 2} width={size} height={size} filter={`url(#${outlineId(c)})`} />
          ) : (
            <>
              <rect x={ix - half} y={iy - half} width={half * 2} height={half * 2} transform={`rotate(45 ${ix} ${iy})`} fill={c} fillOpacity={0.35} stroke={c} strokeWidth={2} />
              <text x={ix} y={iy + size / 2 + 10} textAnchor="middle" fontSize={10} fill={INK}>
                {name}
              </text>
            </>
          )}
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
      return <image href="/game/spike.webp" x={e.x - 14} y={e.y - 14} width={28} height={28} />;
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
          {/* Ability glyphs are white; Wingman outlines them in the ability's own color. */}
          {outlineColors(scene.elements).map((c) => (
            <filter key={c} id={outlineId(c)} x="-20%" y="-20%" width="140%" height="140%">
              <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="grown" />
              <feFlood floodColor={c} />
              <feComposite in2="grown" operator="in" result="ring" />
              <feMerge>
                <feMergeNode in="ring" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
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
