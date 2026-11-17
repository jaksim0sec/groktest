import { BookOpen, X } from "lucide-react";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { CHAPTERS, ENTRIES, ORDER } from "@/game/content";
import { gameApi, useGame } from "@/game/store";

export function NeulbamApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useGame();
  const [fine, setFine] = useState(false);

  useEffect(() => {
    setFine(window.matchMedia("(pointer: fine)").matches);
    const canvas = canvasRef.current;
    if (!canvas) return;
    let game: { start: () => Promise<void>; dispose: () => void } | null = null;
    let dead = false;
    void import("@/game/engine").then(({ Game: G }) => {
      if (dead || !canvasRef.current) return;
      game = new G(canvasRef.current);
      void game.start();
    });
    return () => {
      dead = true;
      game?.dispose();
    };
  }, []);

  const showTouch = !state.sheet && !state.log;
  return (
    <div className="nb-root">
      <canvas ref={canvasRef} className="nb-canvas" />
      <div className="nb-vignette" />
      {showTouch && <Touch playing={state.playing} />}
      {state.playing && !state.sheet && !state.log && (
        <>
          <header className="nb-top">
            <div className="nb-place">{state.place}</div>
            <div className="nb-meta">
              {state.clock}
              <span> · 마감 메모 · {state.hint}</span>
            </div>
          </header>
          <button type="button" className="nb-logbtn" onClick={() => gameApi.current?.openLog()} aria-label="기록">
            <BookOpen size={20} />
            {state.found.length > 0 && <span>{state.found.length}</span>}
          </button>
          {state.prompt && (
            <button type="button" className="nb-act" onClick={() => gameApi.current?.interact()}>
              {state.prompt}
            </button>
          )}
        </>
      )}
      {state.toast && state.playing && <div className="nb-toast">{state.toast}</div>}
      {state.sheet && <Sheet />}
      {state.log && <Logbook />}
      {!state.playing && (
        <div className={state.ready ? "nb-boot is-live" : "nb-boot"}>
          <div className="nb-boot-panel">
            <p className="nb-kicker">서림역 지하상가 · B1</p>
            <h1>늘밤</h1>
            <p className="nb-lead">폐점 이후의 당직. 사람은 없고, 매장만 켜져 있다.</p>
            {state.error ? (
              <p className="nb-err">{state.error}</p>
            ) : (
              <button type="button" className="nb-start" disabled={!state.ready} onClick={() => gameApi.current?.begin()}>
                {state.ready ? "마감 시작" : "조명을 켜는 중"}
              </button>
            )}
            <p className="nb-fine">
              {fine ? "WASD로 걷고, 드래그로 둘러보고, E로 집어 봅니다." : "왼쪽에서 걷고, 화면을 밀어 둘러봅니다."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Touch({ playing }: { playing: boolean }) {
  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const stickId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const last = useRef({ x: 0, y: 0 });

  const setKnob = (x: number, y: number) => {
    if (knobRef.current) knobRef.current.style.transform = `translate(${x}px, ${y}px)`;
  };

  return (
    <div
      className="nb-touch"
      onPointerDown={(e) => {
        const stick = stickRef.current;
        if (playing && stick && (e.target === stick || stick.contains(e.target as Node))) {
          stickId.current = e.pointerId;
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          moveStick(e.clientX, e.clientY, stick, setKnob);
          return;
        }
        lookId.current = e.pointerId;
        last.current = { x: e.clientX, y: e.clientY };
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (e.pointerId === stickId.current && stickRef.current) {
          moveStick(e.clientX, e.clientY, stickRef.current, setKnob);
        } else if (e.pointerId === lookId.current) {
          const dx = e.clientX - last.current.x;
          const dy = e.clientY - last.current.y;
          last.current = { x: e.clientX, y: e.clientY };
          gameApi.current?.setLook(dx, dy);
        }
      }}
      onPointerUp={(e) => endPointer(e.pointerId, stickId, lookId, setKnob)}
      onPointerCancel={(e) => endPointer(e.pointerId, stickId, lookId, setKnob)}
    >
      {playing && (
        <div className="nb-stick" ref={stickRef}>
          <div className="nb-knob" ref={knobRef} />
        </div>
      )}
    </div>
  );
}

function moveStick(cx: number, cy: number, stick: HTMLDivElement, setKnob: (x: number, y: number) => void) {
  const rect = stick.getBoundingClientRect();
  const ox = rect.left + rect.width / 2;
  const oy = rect.top + rect.height / 2;
  let x = cx - ox;
  let y = cy - oy;
  const max = 42;
  const m = Math.hypot(x, y) || 1;
  if (m > max) {
    x = (x / m) * max;
    y = (y / m) * max;
  }
  setKnob(x, y);
  const mag = Math.hypot(x, y) / max;
  if (mag < 0.14) gameApi.current?.setStick(0, 0, true);
  else gameApi.current?.setStick(x / max, -y / max, true);
}

function endPointer(
  id: number,
  stickId: MutableRefObject<number | null>,
  lookId: MutableRefObject<number | null>,
  setKnob: (x: number, y: number) => void,
) {
  if (stickId.current === id) {
    stickId.current = null;
    setKnob(0, 0);
    gameApi.current?.setStick(0, 0, false);
  }
  if (lookId.current === id) lookId.current = null;
}

function Sheet() {
  const sheet = useGame((s) => s.sheet);
  const [name, setName] = useState("");
  if (!sheet) return null;
  return (
    <article className="nb-sheet">
      <div className="nb-sheet-top">
        <div>
          <p className="nb-chapter">{sheet.chapter}</p>
          <h2>{sheet.title}</h2>
        </div>
        <button type="button" className="nb-x" onClick={() => gameApi.current?.closeOverlay()} aria-label="닫기">
          <X size={18} />
        </button>
      </div>
      <p className="nb-where">{sheet.place}</p>
      {sheet.id === "photostrip" && <img className="nb-strip" src="/textures/strip.jpg" alt="사람이 없는 네 컷" />}
      {sheet.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {sheet.terminal && (
        <>
          <input
            className="nb-field"
            maxLength={12}
            placeholder="당직자 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            enterKeyHint="done"
          />
          <button type="button" className="nb-choice primary" onClick={() => gameApi.current?.choose("name", name)}>
            이 이름으로 남긴다
          </button>
          <button type="button" className="nb-choice" onClick={() => gameApi.current?.choose("1842", "")}>
            1842로 둔다
          </button>
          <button type="button" className="nb-choice" onClick={() => gameApi.current?.choose("blank", "")}>
            칸을 비운다
          </button>
        </>
      )}
    </article>
  );
}

function Logbook() {
  const found = useGame((s) => s.found);
  const sens = useGame((s) => s.sens);
  const [arm, setArm] = useState(false);
  const ids = ORDER.filter((id) => found.includes(id));
  return (
    <div className="nb-log">
      <div className="nb-log-top">
        <div>
          <p className="nb-chapter">마감 기록</p>
          <h2>{ids.length === 0 ? "아직 비어 있다" : `${ids.length}장`}</h2>
        </div>
        <button type="button" className="nb-x" onClick={() => gameApi.current?.closeOverlay()} aria-label="닫기">
          <X size={18} />
        </button>
      </div>
      {CHAPTERS.map((ch) => {
        const rows = ids.filter((id) => ENTRIES[id]?.chapter === ch.id);
        if (!rows.length) return null;
        return (
          <section key={ch.id}>
            <h3>{ch.title}</h3>
            {rows.map((id) => (
              <button type="button" className="nb-row" key={id} onClick={() => gameApi.current?.reread(id)}>
                {ENTRIES[id]?.title}
              </button>
            ))}
          </section>
        );
      })}
      <label className="nb-sens">
        시선 감도
        <input
          type="range"
          min={0.6}
          max={1.6}
          step={0.05}
          value={sens}
          onChange={(e) => gameApi.current?.setSens(Number(e.target.value))}
        />
      </label>
      {arm ? (
        <button type="button" className="nb-reset" onClick={() => gameApi.current?.reset()}>
          정말 지운다
        </button>
      ) : (
        <button type="button" className="nb-reset" onClick={() => setArm(true)}>
          기록을 지운다
        </button>
      )}
    </div>
  );
}
