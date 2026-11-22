export const threshold = 180;
export const seconds = value => (value / 1000).toFixed(2);
export const readingDelay = (words, wpm) => wpm && words ? Math.max(1500, words * 60000 / wpm) : 0;
const number = value => value.toFixed(2);

export function formatReport(results) {
  const lines = ['| Pace | Segment | Paced seconds | Cumulative seconds | Browser seconds | Words | Actions | Puzzle moves |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |'];
  const totals = entries => entries.reduce((out, entry) => ({
    model: out.model + entry.model, wall: out.wall + entry.wall, words: out.words + entry.words,
    actions: out.actions + entry.actions, moves: out.moves + entry.moves
  }), { model: 0, wall: 0, words: 0, actions: 0, moves: 0 });
  const row = (title, name, entry, cumulative) =>
    `| ${title} | ${name} | ${seconds(entry.model)} | ${seconds(cumulative)} | ${seconds(entry.wall)} | ${entry.words} | ${entry.actions} | ${entry.moves} |`;
  for (const { title, segments } of results) {
    lines.push(row(title, 'Setup', segments[0], segments[0].model));
    let cumulative = 0;
    for (const segment of segments.slice(1)) {
      cumulative += segment.model;
      lines.push(row(title, segment.name, segment, cumulative));
    }
    lines.push(row(title, 'Rooms 1–3 total', totals(segments.slice(1)), cumulative));
    const full = totals(segments);
    lines.push(row(title, 'New game to chapter complete', full, full.model));
  }
  const [average, fast, careful] = results;
  const averageRooms = average.segments.slice(1);
  const baseline = totals(averageRooms).model;
  const fastRooms = totals(fast.segments.slice(1));
  const carefulRooms = totals(careful.segments.slice(1));
  const baselineAt180 = baseline + averageRooms.flatMap(room => room.reading).reduce((sum, { words, overlap }) =>
    sum + Math.max(readingDelay(words, 180), overlap) - Math.max(readingDelay(words, 230), overlap), 0);
  const extra = carefulRooms.model - baselineAt180;
  const verdict = value => value >= threshold * 1000 ? 'PASS' : 'FAIL';
  lines.push('', `**230-wpm rooms 1–3 result — ${verdict(baseline)} at ${seconds(baseline)} s against ${number(threshold)} s.**`,
    `The speedrunner paced total was ${seconds(fastRooms.model)} s. The careful reader paced total was ${seconds(carefulRooms.model)} s.`,
    `The speedrunner reached chapter complete after ${seconds(fastRooms.wall)} browser seconds from room 1. ` +
      (fastRooms.wall < threshold * 1000 ? 'That run falsifies a hard 180-second minimum.' :
        'The browser run did not demonstrate a sub-180-second completion.'),
    '', `Six optional objects and three chatter panels added ${seconds(extra)} s at 180 wpm, with the required route repriced at the same reading rate. The delta includes changed text and walking on the optional route.`,
    '', `The completion card contained ${average.endingWords} new words and added ${seconds(average.endingReading)} s of reading after arrival at 230 wpm.`);
  return lines.join('\n') + '\n';
}

export function additions() {
  return `## Story-driven additions if the paced route falls short

- Cryo Deck, **+20–30 s**. Recover a wake-cycle record from the pods and use it with ORI to identify which conduit branch the pressure spike damaged.
- Life Support, **+20–35 s**. Diagnose the pressure fault by comparing the gauge with the log. Let engineering, science, or a manual valve isolation reach the same repair through different actions.
- Life Support, **+15–25 s**. Ask ORI to weigh two conflicting entries in protocol nine. A successful check can identify the misplaced entry, while a failed check leads to checking the original log together.
- Signal Laboratory, **+25–40 s**. Use the decoded header to align a reply with the gaps in the Veil’s pulse, then confirm the timing through its reply before choosing what to do with its memories.`;
}

export function formatWalkthrough(results) {
  const sum = segments => segments.reduce((total, { model, wall }) =>
    ({ model: total.model + model, wall: total.wall + wall }), { model: 0, wall: 0 });
  const duration = ms => {
    const rounded = Math.round(ms / 1000);
    const minutes = String(Math.floor(rounded / 60)).padStart(2, '0');
    const remainder = String(rounded % 60).padStart(2, '0');
    return `${seconds(ms)} s (${minutes}:${remainder})`;
  };
  const verdict = ms => ms > threshold * 1000 ? 'PASS'
    : ms < threshold * 1000 ? 'FAIL (−5 points)' : 'AT LIMIT (must exceed 3:00)';
  const segmentNames = results[0].segments.map(segment => segment.name);
  const room1 = segmentNames.indexOf('Room 1');
  const chapter1Card = segmentNames.indexOf('Chapter 1 completion card');
  const lines = [
    '| Segment | Average paced | Average browser | Speedrunner paced | Speedrunner browser | Careful paced | Careful browser |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |'
  ];
  const row = (label, from, to) => {
    const cells = results.flatMap(({ segments }) => {
      const elapsed = sum(segments.slice(from, to));
      return [duration(elapsed.model), duration(elapsed.wall)];
    });
    lines.push(`| ${label} | ${cells.join(' | ')} |`);
  };
  for (const [index, name] of segmentNames.entries()) {
    const chapter = name.match(/^Chapter ([123]) completion card$/)?.[1];
    if (chapter) {
      const firstRoom = Number(chapter) * 3 - 2;
      row(`**Chapter ${chapter} subtotal (rooms ${firstRoom}–${firstRoom + 2})**`,
        segmentNames.indexOf(`Room ${firstRoom}`), index);
    }
    row(name, index, index + 1);
  }
  row('**Total from first image**', 0);
  row('**Total from room 1**', room1);

  lines.push('', '### TSA three-minute check', '',
    '| Pace | First image to Chapter 1 complete (paced) | From first image (browser) | Rooms 1–3 alone (browser) |',
    '| --- | --- | --- | ---: |');
  for (const { title, segments } of results) {
    const firstImage = sum(segments.slice(0, chapter1Card));
    const rooms = sum(segments.slice(room1, chapter1Card));
    lines.push(`| ${title} | ${duration(firstImage.model)} · ${verdict(firstImage.model)} | ` +
      `${duration(firstImage.wall)} · ${verdict(firstImage.wall)} | ${duration(rooms.wall)} |`);
  }
  return lines.join('\n') + '\n';
}
