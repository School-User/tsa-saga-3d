import './classes.js';
import './ch1.js';
import './ch2.js';
import './ch3.js';

export const chapters = Object.values(window.Story);
export const classes = window.StoryClasses;
export const rooms = chapters.flatMap((chapter, index) =>
  chapter.levels.map(room => ({ ...room, chapter: index + 1 })));
export const items = chapters.flatMap(chapter => chapter.items);
export const companions = chapters.map(chapter => chapter.companion);
export const journalSize = 20;

export const chapterAt = number => chapters[number - 1];
export const roomAt = id => rooms[id - 1];
