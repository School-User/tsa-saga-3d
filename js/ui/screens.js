import { chapters, classes, chapterAt, journalSize } from '../story/data.js';
import { meetsFlags, rankFor, modifier, signed, reachedChapter } from '../state.js';
import { finaleCaption } from '../world/finale.js';
import { el, button, title, statsText } from './dom.js';

function art(chapter) {
  const figure = el('figure', 'card-art');
  const image = el('img');
  image.src = chapter.image;
  image.alt = chapter.imageAlt;
  figure.append(image);
  return figure;
}

function card(root, { label, heading, tagline, image }) {
  const frame = el('section', 'story-card');
  const brand = el('div', 'brand');
  brand.append(el('span', 'signal'), ' Drift Signal');
  const body = el('div', 'card-body');
  if (label) body.append(el('p', 'eyebrow', label));
  const headline = el('h1', '', heading);
  body.append(headline);
  if (tagline) body.append(el('p', 'tagline', tagline));
  frame.append(brand, body);
  if (image) frame.append(art(image));
  root.replaceChildren(frame);
  title(headline);
  return body;
}

function menu(body, ...buttons) {
  const row = el('div', 'card-actions');
  row.append(...buttons);
  body.append(row);
  return row;
}

function rankLine(run) {
  return el('p', 'rank-line', `Rank ${rankFor(run.xp)} · ${run.xp} XP · ${statsText(run.stats)}`);
}

export function showTitle(root, run, actions) {
  const body = card(root, { heading: 'The Long Quiet',
    tagline: 'A fleet Navigator follows a signal across three ships.', image: chapters[0] });
  const play = menu(body);
  if (run) play.append(button('Continue', actions.resume, 'btn primary'));
  play.append(button('New game', actions.newGame, run ? 'btn ghost' : 'btn primary'));
  if (run) {
    body.append(el('h2', 'eyebrow chapter-select', 'Chapter select'));
    const row = menu(body);
    chapters.slice(0, reachedChapter(run)).forEach((chapter, index) =>
      row.append(button(chapter.title, () => actions.select(index + 1))));
  }
  body.append(actions.musicControls());
}

export function showClasses(root, actions) {
  const body = card(root, { label: 'Character creation', heading: 'Choose your background',
    tagline: 'Your background shapes your d20 checks and the clues you notice.' });
  const grid = el('div', 'classes');
  const confirm = button('Confirm background', () => actions.start(selected), 'btn primary');
  const choices = [];
  let selected = null;
  confirm.disabled = true;
  for (const background of classes) {
    const choice = button('', () => {
      selected = background;
      confirm.disabled = false;
      choices.forEach(node => node.setAttribute('aria-pressed', String(node === choice)));
    }, 'class-choice');
    choice.setAttribute('aria-pressed', 'false');
    const scores = Object.entries(background.stats)
      .map(([stat, score]) => `${stat.toUpperCase()} ${score} (${signed(modifier(score))})`).join(' · ');
    choice.append(el('strong', '', background.name), el('span', 'eyebrow', background.background),
      el('span', '', background.description), el('span', 'class-scores', scores));
    choices.push(choice);
    grid.append(choice);
  }
  body.append(grid);
  body.append(el('p', 'story-copy', 'On a check, roll a twenty-sided die and add your modifier and any companion aid. Match or beat the difficulty class (DC). A failed check leads to another way forward.'));
  menu(body, confirm, button('Back', actions.title));
}

export function showChapter(root, run, actions) {
  const chapter = chapterAt(run.chapter);
  const ending = chapter.endings.find(entry => run.flags[entry.flag]);
  const label = `Chapter ${run.chapter} of 3`;
  if (run.screen === 'intro') {
    const body = card(root, { label, heading: chapter.title, tagline: chapter.tagline, image: chapter });
    const intro = chapter.introVariants?.find(entry => meetsFlags(run, entry))?.text ?? chapter.intro;
    body.append(el('p', 'story-copy', intro));
    menu(body, button('Begin chapter', actions.begin, 'btn primary'), button('Title', actions.title));
  } else {
    const body = card(root, { label: `${label} complete`, heading: chapter.title, image: chapter });
    body.append(el('p', 'story-copy', ending.text), el('p', 'route-copy', ending.nextStop ?? chapter.nextStop), rankLine(run));
    menu(body, button('Continue', actions.next, 'btn primary'), button('Title', actions.title));
  }
}

export function showFinale(root, run, actions, canvas) {
  const body = card(root, { label: 'Voyage complete', heading: chapters[2].finale.title, image: chapters[2] });
  const figure = root.querySelector('.card-art');
  figure.classList.add('finale-art');
  if (canvas) {
    figure.querySelector('img').hidden = true;
    canvas.setAttribute('aria-label', '3D exterior view of Verdant');
    canvas.removeAttribute('aria-describedby');
    figure.prepend(canvas);
  }
  figure.append(el('figcaption', '', finaleCaption(run.flags)));
  const epilogue = el('div', 'epilogue');
  chapters.forEach(chapter => {
    const ending = chapter.endings.find(entry => run.flags[entry.flag]);
    if (ending) epilogue.append(el('p', '', ending.epilogue));
  });
  body.append(epilogue, rankLine(run), el('p', 'journal-coverage',
    `Journal coverage ${Object.keys(run.journal).length} of ${journalSize}`));
  menu(body, button('Play again', actions.newGame, 'btn primary'), button('Title', actions.title));
}
