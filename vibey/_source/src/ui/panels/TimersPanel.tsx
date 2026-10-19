import { useState } from "react";
import { BANDS } from "../../data/music";
import { CATEGORIES } from "../../data/scenes";
import { clocks } from "../../state/controllers";
import { randomAtmosphere, setState, useStore } from "../../state/store";
import { Panel, Section, Seg, Toggle } from "../controls";
import { fmtLeft, useNow } from "../hooks";
import { Dice } from "../icons";

const SLEEP = [15, 30, 45, 60, 90, 120];

export function TimersPanel() {
  const now = useNow(1000);
  const sleep = useStore((s) => s.sleep);
  const focus = useStore((s) => s.focus);
  const sc = useStore((s) => s.sceneCycle);
  const mc = useStore((s) => s.musicCycle);
  const [fade, setFade] = useState(10);
  const [dim, setDim] = useState(true);
  const [custom, setCustom] = useState("");

  const startSleep = (minutes: number) => {
    if (!(minutes > 0)) return;
    setState({ sleep: { endsAt: Date.now() + minutes * 60000, minutes, fade: Math.min(fade, minutes), dim } });
  };

  const [rhythm, setRhythm] = useState(focus ? `${focus.focus}/${focus.short}` : "25/5");
  const lengths = (r: string) => {
    const [a, b] = r.split("/").map(Number);
    return { focus: a, short: b, long: b * 3 };
  };
  const startFocus = () => {
    const l = lengths(rhythm);
    setState({ focus: { phase: "focus", endsAt: Date.now() + l.focus * 60000, pausedLeft: null, ...l, round: 0, rounds: 4, chime: true } });
  };
  const changeRhythm = (r: string) => {
    setRhythm(r);
    if (!focus) return;
    const l = lengths(r);
    const mins = focus.phase === "focus" ? l.focus : focus.phase === "long" ? l.long : l.short;
    setState({ focus: { ...focus, ...l, endsAt: Date.now() + mins * 60000, pausedLeft: null } });
  };

  const focusLeft = focus ? (focus.pausedLeft ?? focus.endsAt - now) : 0;

  return (
    <Panel title="Sleep & timers" wide>
      <Section title="Sleep" aside={sleep ? <span className="countdown tnum">{fmtLeft(sleep.endsAt - now)}</span> : null}>
        <p className="fine">Fades the music and the room out gently, then lets the picture go dark.</p>
        <div className="chips">
          {SLEEP.map((m) => (
            <button key={m} className={`chip${sleep?.minutes === m ? " on" : ""}`} onClick={() => startSleep(m)}>
              {m < 60 ? `${m} min` : `${m / 60} h${m % 60 ? ` ${m % 60}` : ""}`}
            </button>
          ))}
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              startSleep(Number(custom));
            }}
          >
            <input inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="min" aria-label="Custom minutes" />
            <button className="btn small">Set</button>
          </form>
        </div>
        <Seg label="Fade over" value={fade} options={[1, 5, 10, 20].map((m) => ({ value: m, label: `${m} min` }))} onChange={setFade} />
        <Toggle label="Dim the picture too" checked={dim} onChange={setDim} />
        {sleep ? (
          <button className="btn" onClick={() => setState({ sleep: null })}>
            Cancel the sleep timer
          </button>
        ) : null}
      </Section>

      <Section
        title="Focus"
        aside={focus ? <span className="countdown tnum">{`${focus.phase === "focus" ? "Focus" : focus.phase === "long" ? "Long break" : "Break"} · ${fmtLeft(focusLeft)}`}</span> : null}
      >
        <p className="fine">Pomodoro rounds with a soft bell between them: 25 minutes on, 5 off, a longer rest after four.</p>
        <div className="row-buttons">
          {!focus ? (
            <button className="btn lit" onClick={startFocus}>
              Start focusing
            </button>
          ) : (
            <>
              <button
                className="btn"
                onClick={() =>
                  setState({
                    focus:
                      focus.pausedLeft == null
                        ? { ...focus, pausedLeft: Math.max(0, focus.endsAt - Date.now()) }
                        : { ...focus, endsAt: Date.now() + focus.pausedLeft, pausedLeft: null },
                  })
                }
              >
                {focus.pausedLeft == null ? "Pause" : "Resume"}
              </button>
              <button className="btn" onClick={() => setState({ focus: null })}>
                Stop
              </button>
              <span className="fine tnum">Round {focus.round + 1}</span>
            </>
          )}
        </div>
        <Seg
          label="Rhythm"
          value={rhythm}
          options={[
            { value: "25/5", label: "25 / 5" },
            { value: "50/10", label: "50 / 10" },
            { value: "90/20", label: "90 / 20" },
          ]}
          onChange={changeRhythm}
        />
      </Section>

      <Section title="Change places" aside={sc.on ? <span className="countdown tnum">{fmtLeft(clocks.scene + sc.minutes * 60000 - now)}</span> : null}>
        <Toggle label="Move to a new place on a timer" checked={sc.on} onChange={(on) => setState((s) => ({ sceneCycle: { ...s.sceneCycle, on } }))} />
        <Seg
          label="Every"
          value={sc.minutes}
          options={[5, 10, 15, 30, 60].map((m) => ({ value: m, label: m < 60 ? `${m} min` : "1 h" }))}
          onChange={(minutes) => setState((s) => ({ sceneCycle: { ...s.sceneCycle, minutes } }))}
        />
        <Seg
          label="From"
          value={sc.scope}
          options={[{ value: "all", label: "Everywhere" }, { value: "favorites", label: "Starred" }, ...CATEGORIES.map((c) => ({ value: c.id as string, label: c.label }))]}
          onChange={(scope) => setState((s) => ({ sceneCycle: { ...s.sceneCycle, scope } }))}
        />
        <Seg
          label="Order"
          value={sc.order}
          options={[
            { value: "next", label: "Along the dial" },
            { value: "random", label: "Shuffled" },
          ]}
          onChange={(order) => setState((s) => ({ sceneCycle: { ...s.sceneCycle, order } }))}
        />
        <Toggle label="Visit each place's variations first" checked={sc.variations} onChange={(variations) => setState((s) => ({ sceneCycle: { ...s.sceneCycle, variations } }))} />
      </Section>

      <Section title="Change music" aside={mc.on ? <span className="countdown tnum">{fmtLeft(clocks.music + mc.minutes * 60000 - now)}</span> : null}>
        <Toggle label="Move to the next band on a timer" checked={mc.on} onChange={(on) => setState((s) => ({ musicCycle: { ...s.musicCycle, on } }))} />
        <Seg
          label="Every"
          value={mc.minutes}
          options={[15, 30, 45, 60, 120].map((m) => ({ value: m, label: m < 60 ? `${m} min` : `${m / 60} h` }))}
          onChange={(minutes) => setState((s) => ({ musicCycle: { ...s.musicCycle, minutes } }))}
        />
        <div className="checks">
          {BANDS.map((b) => (
            <label key={b.id} className="check">
              <input
                type="checkbox"
                checked={mc.bands.includes(b.id)}
                onChange={(e) =>
                  setState((s) => ({
                    musicCycle: { ...s.musicCycle, bands: e.target.checked ? [...s.musicCycle.bands, b.id] : s.musicCycle.bands.filter((x) => x !== b.id) },
                  }))
                }
              />
              <span>{b.name}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Anywhere">
        <button className="btn lit" onClick={randomAtmosphere}>
          <Dice size={16} /> A random atmosphere
        </button>
      </Section>
    </Panel>
  );
}
