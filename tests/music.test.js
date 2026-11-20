import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chapterThemes, themes } from '../js/audio/themes.js';
import { loadMusicSettings, MUSIC_KEY, noteFrequency, saveMusicSettings } from '../js/audio/music.js';

test('all five themes have playable chords and ordered accents', () => {
  assert.deepEqual(chapterThemes, ['meridian', 'harbor', 'verdant']);
  assert.deepEqual(Object.keys(themes), ['title', ...chapterThemes, 'finale']);
  const isNote = note => Number.isInteger(note) && note >= 0 && note <= 127;

  for (const [name, theme] of Object.entries(themes)) {
    assert.ok(Number.isFinite(theme.bpm) && theme.bpm > 0, name);
    assert.ok(Number.isInteger(theme.beatsPerBar) && theme.beatsPerBar > 0, name);
    assert.ok(Number.isFinite(theme.cutoff) && theme.cutoff > 0, name);
    assert.ok(['sine', 'triangle'].includes(theme.pad), name);
    assert.ok(['sine', 'triangle'].includes(theme.accent), name);
    assert.ok(Number.isFinite(theme.accentBeats) && theme.accentBeats > 0, name);
    assert.ok(theme.bars.length > 1, name);
    for (const { chord, accents } of theme.bars) {
      assert.ok(chord.length > 1 && chord.every(isNote), name);
      assert.ok(accents.length > 0, name);
      let previousBeat = -1;
      for (const [beat, note] of accents) {
        assert.ok(beat >= 0 && beat >= previousBeat && beat < theme.beatsPerBar, name);
        assert.ok(isNote(note), name);
        previousBeat = beat;
      }
    }
  }
});

test('MIDI notes map to equal-tempered frequencies', () => {
  assert.equal(noteFrequency(69), 440);
  assert.equal(noteFrequency(57), 220);
  assert.equal(noteFrequency(81), 880);
  assert.ok(Math.abs(noteFrequency(60) - 261.625565) < .000001);
  assert.ok(Math.abs(noteFrequency(70) / noteFrequency(69) - 2 ** (1 / 12)) < 1e-12);
});

test('the music preference and volume survive a reload', () => {
  const entries = new Map([['run-save', 'keep']]);
  const storage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value)
  };
  assert.deepEqual(loadMusicSettings(storage), { enabled: true, volume: 25 });
  assert.equal(saveMusicSettings(storage, { enabled: false, volume: 37 }), true);
  assert.deepEqual(loadMusicSettings(storage), { enabled: false, volume: 37 });
  assert.equal(entries.get('run-save'), 'keep');
  assert.equal(saveMusicSettings(storage, { enabled: true, volume: 0 }), true);
  assert.deepEqual(loadMusicSettings(storage), { enabled: true, volume: 0 });
});

test('settings recover from invalid values and unavailable storage', () => {
  const stored = value => ({ getItem: key => key === MUSIC_KEY ? value : null });
  assert.deepEqual(loadMusicSettings(stored('{')), { enabled: true, volume: 25 });
  assert.deepEqual(loadMusicSettings(stored('{"enabled":"false","volume":null}')), { enabled: true, volume: 25 });
  assert.deepEqual(loadMusicSettings(stored('{"enabled":false,"volume":-5}')), { enabled: false, volume: 0 });
  assert.deepEqual(loadMusicSettings(stored('{"volume":105}')), { enabled: true, volume: 100 });
  assert.deepEqual(loadMusicSettings(stored('{"volume":23.6}')), { enabled: true, volume: 24 });
  assert.deepEqual(loadMusicSettings(null), { enabled: true, volume: 25 });
  assert.equal(saveMusicSettings({ setItem() { throw new Error('Storage is blocked'); } }, {}), false);
});
