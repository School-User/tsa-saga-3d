import { themes } from './themes.js';

export const MUSIC_KEY = 'driftSignal3d.music.v1';
const DEFAULT_SETTINGS = { enabled: true, volume: 25 };
const MAX_GAIN = .22;
const PAUSE_GAIN = .2;
const FADE_RATE = .3;
const FADE_TAIL = 2.4;
const LOOK_AHEAD = .2;
const START_DELAY = .04;
const TICK_MS = 60;

export function noteFrequency(note) {
  // Twelve semitones double the frequency, measured from A4 (440 Hz).
  return 440 * 2 ** ((note - 69) / 12);
}

function normalizeSettings(settings) {
  return {
    enabled: typeof settings?.enabled === 'boolean' ? settings.enabled : DEFAULT_SETTINGS.enabled,
    volume: Number.isFinite(settings?.volume)
      ? Math.max(0, Math.min(100, Math.round(settings.volume))) : DEFAULT_SETTINGS.volume
  };
}

export function loadMusicSettings(storage) {
  try {
    return normalizeSettings(JSON.parse(storage.getItem(MUSIC_KEY)));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveMusicSettings(storage, settings) {
  try {
    storage.setItem(MUSIC_KEY, JSON.stringify(normalizeSettings(settings)));
    return true;
  } catch {
    return false;
  }
}

function playNote(context, output, note, waveform, start, length, { attack, release, level, sustain }) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = waveform;
  oscillator.frequency.value = noteFrequency(note);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(level, start + attack);
  envelope.gain.linearRampToValueAtTime(level * sustain, start + length);
  envelope.gain.linearRampToValueAtTime(0, start + length + release);
  oscillator.connect(envelope).connect(output);
  oscillator.start(start);
  oscillator.stop(start + length + release);
  oscillator.onended = () => {
    oscillator.disconnect();
    envelope.disconnect();
  };
}

const PAD = { attack: 1.5, release: 1.7, level: .21, sustain: .75 };
const ACCENT = { attack: .07, release: .55, level: .15, sustain: .3 };

function makeTrack(context, master, theme, start) {
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = theme.cutoff;
  filter.Q.value = .3;
  const fader = context.createGain();
  fader.gain.value = 0;
  filter.connect(fader).connect(master);
  const beat = 60 / theme.bpm;
  const barLength = beat * theme.beatsPerBar;
  let barStart = start;
  let bar = 0;
  let accent = 0;
  let chordPending = true;

  function schedule(until, now) {
    // A timer wakes the sequencer, but the audio clock plays each note on time.
    // After a long timer delay, restart the phrase instead of playing missed notes.
    if (barStart + barLength < now) {
      barStart = now + START_DELAY;
      bar = 0;
      accent = 0;
      chordPending = true;
    }
    while (barStart < until) {
      const { chord, accents } = theme.bars[bar];
      if (chordPending && barStart >= now) {
        for (const note of chord) {
          playNote(context, filter, note, theme.pad, barStart, barLength * .89, PAD);
        }
      }
      chordPending = false;
      for (; accent < accents.length; accent++) {
        const [offset, note] = accents[accent];
        const at = barStart + offset * beat;
        if (at >= until) return;
        if (at >= now) {
          playNote(context, filter, note, theme.accent, at, theme.accentBeats * beat, ACCENT);
        }
      }
      barStart += barLength;
      bar = (bar + 1) % theme.bars.length;
      accent = 0;
      chordPending = true;
    }
  }

  return {
    schedule, endsAt: Infinity,
    fade(level, at) { fader.gain.setTargetAtTime(level, at, FADE_RATE); },
    disconnect() { fader.disconnect(); }
  };
}

export function createMusic({ storage, test = false }) {
  let settings = loadMusicSettings(storage);
  if (test) settings.enabled = false;
  let context;
  let master;
  let timer;
  let themeName = 'title';
  let playingName;
  let current;
  let paused = false;
  const tracks = new Set();

  function setLevel() {
    if (!master) return;
    const level = settings.enabled ? settings.volume / 100 * MAX_GAIN : 0;
    master.gain.setTargetAtTime(level * (paused ? PAUSE_GAIN : 1), context.currentTime, .08);
  }

  function tick() {
    if (context.state !== 'running') return;
    const now = context.currentTime;
    for (const track of tracks) {
      if (track.endsAt <= now) {
        track.disconnect();
        tracks.delete(track);
      } else {
        track.schedule(Math.min(now + LOOK_AHEAD, track.endsAt), now);
      }
    }
    if (tracks.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  }

  function updatePlayback() {
    if (context?.state !== 'running') return;
    const next = settings.enabled ? themeName : null;
    if (next === playingName) return;
    const now = context.currentTime;
    // Let both themes play during the fade so notes can ring through a screen change.
    if (current) {
      current.fade(0, now);
      current.endsAt = now + FADE_TAIL;
    }
    current = null;
    playingName = next;
    if (next) {
      current = makeTrack(context, master, themes[next], now + START_DELAY);
      current.fade(1, now);
      tracks.add(current);
      timer ??= setInterval(tick, TICK_MS);
    }
    tick();
  }

  return {
    get settings() { return { ...settings }; },
    get locked() { return test; },
    unlock(event) {
      if (test || !settings.enabled || !event.isTrusted
        || navigator.userActivation?.isActive === false) return;
      try {
        if (!context) {
          const Audio = window.AudioContext || window.webkitAudioContext;
          if (!Audio) return;
          context = new Audio();
          master = context.createGain();
          master.gain.value = 0;
          master.connect(context.destination);
          setLevel();
        }
        if (context.state === 'running') updatePlayback();
        else context.resume().then(updatePlayback).catch(() => {});
      } catch {
        // Audio availability never blocks play.
      }
    },
    setTheme(name) {
      themeName = name;
      updatePlayback();
    },
    setPaused(value) {
      if (paused === value) return;
      paused = value;
      setLevel();
    },
    setSettings(changes) {
      if (test) return;
      settings = normalizeSettings({ ...settings, ...changes });
      saveMusicSettings(storage, settings);
      setLevel();
      updatePlayback();
    }
  };
}
