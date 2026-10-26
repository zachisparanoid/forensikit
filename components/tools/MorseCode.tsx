'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Play, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Slider } from '@/components/ui/Slider';
import { Tabs } from '@/components/ui/Tabs';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { Field, Panel } from '@/components/ui/ToolShell';
import { morseToText, textToMorse } from '@/lib/crypto/classical';
import { useDebouncedValue, useReducedMotion } from '@/lib/hooks';

type Tab = 'encode' | 'decode';

const SAMPLE_TEXT = 'SOS HELLO';
const SAMPLE_MORSE = '... --- ... / .... . .-.. .-.. ---';

interface WebAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Schedule oscillator beeps for a morse string. Timing units:
 * dot = 1, dash = 3, intra-letter gap = 1, letter gap = 3, word gap = 7.
 */
function buildSchedule(
  morse: string,
  unitSec: number,
): { start: number; dur: number }[] {
  const beeps: { start: number; dur: number }[] = [];
  let t = 0;
  for (let i = 0; i < morse.length; i++) {
    const ch = morse[i];
    if (ch === '.') {
      beeps.push({ start: t, dur: unitSec });
      t += unitSec + unitSec; // symbol + intra-letter gap
    } else if (ch === '-') {
      beeps.push({ start: t, dur: unitSec * 3 });
      t += unitSec * 3 + unitSec;
    } else if (ch === ' ') {
      t += unitSec * 2; // already added 1 unit after prev symbol -> total 3 (letter gap)
    } else if (ch === '/') {
      t += unitSec * 6; // already added 1 unit after prev symbol -> total 7 (word gap)
    }
  }
  return beeps;
}

export default function MorseCode() {
  const [tab, setTab] = useState<Tab>('encode');
  const [input, setInput] = useState('');
  const [wpm, setWpm] = useState(15);
  const [playing, setPlaying] = useState(false);
  const debounced = useDebouncedValue(input, 150);
  const reducedMotion = useReducedMotion();

  const audioRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const stopTimerRef = useRef<number | null>(null);

  const output = useMemo(
    () => (tab === 'encode' ? textToMorse(debounced) : morseToText(debounced)),
    [tab, debounced],
  );

  // The morse string to render / play: the output when encoding, the input when decoding.
  const morse = tab === 'encode' ? output : debounced.trim();

  function stop() {
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    for (const { osc, gain } of nodesRef.current) {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
      osc.disconnect();
      gain.disconnect();
    }
    nodesRef.current = [];
    if (audioRef.current) {
      audioRef.current.close().catch(() => undefined);
      audioRef.current = null;
    }
    setPlaying(false);
  }

  // Cleanup on unmount.
  useEffect(() => stop, []);

  function play() {
    if (!morse) return;
    stop();
    const unitSec = 1200 / wpm / 1000;
    const schedule = buildSchedule(morse, unitSec);
    if (schedule.length === 0) return;

    const Ctor =
      window.AudioContext || (window as WebAudioWindow).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    audioRef.current = ctx;
    const t0 = ctx.currentTime + 0.05;
    let endTime = t0;

    for (const { start, dur } of schedule) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 600;
      // Short ramps to avoid clicks.
      const on = t0 + start;
      const off = on + dur;
      gain.gain.setValueAtTime(0, on);
      gain.gain.linearRampToValueAtTime(0.25, on + 0.005);
      gain.gain.setValueAtTime(0.25, Math.max(on + 0.005, off - 0.005));
      gain.gain.linearRampToValueAtTime(0, off);
      osc.connect(gain).connect(ctx.destination);
      osc.start(on);
      osc.stop(off + 0.01);
      nodesRef.current.push({ osc, gain });
      endTime = Math.max(endTime, off);
    }

    setPlaying(true);
    stopTimerRef.current = window.setTimeout(
      () => stop(),
      (endTime - ctx.currentTime + 0.1) * 1000,
    );
  }

  function clear() {
    stop();
    setInput('');
  }

  function loadSample() {
    stop();
    setInput(tab === 'encode' ? SAMPLE_TEXT : SAMPLE_MORSE);
  }

  return (
    <div className="space-y-4">
      <Tabs
        tabs={[
          { value: 'encode', label: 'Text → Morse' },
          { value: 'decode', label: 'Morse → Text' },
        ]}
        value={tab}
        onChange={(v) => {
          stop();
          setTab(v);
        }}
      />

      <Panel
        title="Input"
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={loadSample}>
              <FileText className="h-3.5 w-3.5" /> Load sample
            </Button>
            <Button size="sm" variant="ghost" onClick={clear} disabled={!input}>
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </>
        }
      >
        <Field
          label={tab === 'encode' ? 'Text' : 'Morse code'}
          htmlFor="morse-input"
          hint={
            tab === 'decode'
              ? 'use spaces between letters and / between words'
              : undefined
          }
        >
          <TextArea
            id="morse-input"
            mono={tab === 'decode'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              tab === 'encode'
                ? 'Type text to convert to Morse…'
                : 'e.g. ... --- ... / .... . .-.. .-.. ---'
            }
          />
        </Field>
      </Panel>

      <Panel title={tab === 'encode' ? 'Morse code' : 'Decoded text'}>
        {output ? (
          <ResultBlock
            label={tab === 'encode' ? 'Morse' : 'Text'}
            value={output}
            copy
          />
        ) : (
          <p className="text-sm text-muted">
            {tab === 'encode'
              ? 'Enter text to generate Morse code.'
              : 'Enter Morse code (dots, dashes, spaces, /) to decode.'}
          </p>
        )}
      </Panel>

      {morse && (
        <Panel
          title="Signal"
          actions={
            <div className="flex items-center gap-2">
              {playing ? (
                <Button size="sm" variant="danger" onClick={stop}>
                  <Square className="h-3.5 w-3.5" /> Stop
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={play}>
                  <Play className="h-3.5 w-3.5" /> Play
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-1 gap-y-2 font-mono text-text">
              {Array.from(morse).map((ch, i) => {
                if (ch === '.') {
                  return (
                    <span key={i} className="text-lg leading-none text-accent">
                      ●
                    </span>
                  );
                }
                if (ch === '-') {
                  return (
                    <span
                      key={i}
                      className="text-lg leading-none text-indigo"
                      aria-hidden
                    >
                      ▬
                    </span>
                  );
                }
                if (ch === '/') {
                  return (
                    <span key={i} className="px-1 text-muted">
                      /
                    </span>
                  );
                }
                return (
                  <span key={i} className="inline-block w-2" aria-hidden />
                );
              })}
            </div>

            <Slider
              id="morse-wpm"
              label="Speed (WPM)"
              valueLabel={`${wpm} wpm · ${Math.round(1200 / wpm)} ms/unit`}
              min={5}
              max={40}
              value={wpm}
              onChange={(n) => {
                if (playing) stop();
                setWpm(n);
              }}
            />

            <p className="text-xs text-muted">
              {reducedMotion
                ? 'Reduced-motion is on — the signal is shown statically. Press Play to hear it.'
                : 'Press Play to hear the Morse beeps (600 Hz). Audio never plays on its own.'}
            </p>
          </div>
        </Panel>
      )}
    </div>
  );
}
