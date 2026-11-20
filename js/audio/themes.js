// Notes use MIDI numbers: 60 is middle C and 69 is A above it.
// Each bar starts with a held chord. Accent pairs are [beat within the bar, note].
export const themes = {
  title: {
    bpm: 58, beatsPerBar: 8, cutoff: 850, pad: 'sine', accent: 'sine', accentBeats: 1.8,
    bars: [
      { chord: [45, 52, 59, 60], accents: [[2, 64], [6, 59]] },
      { chord: [41, 48, 55, 57], accents: [[4, 60]] },
      { chord: [48, 55, 62, 64], accents: [[2, 67], [6, 62]] },
      { chord: [43, 50, 57, 59], accents: [[4, 64]] }
    ]
  },
  meridian: {
    bpm: 52, beatsPerBar: 8, cutoff: 620, pad: 'sine', accent: 'sine', accentBeats: .7,
    bars: [
      { chord: [38, 45, 52], accents: [[3, 69], [5.5, 69]] },
      { chord: [38, 48, 55], accents: [[5.5, 67]] },
      { chord: [34, 41, 53], accents: [[3, 69], [5.5, 65]] },
      { chord: [36, 43, 50], accents: [[5.5, 64]] }
    ]
  },
  harbor: {
    bpm: 72, beatsPerBar: 8, cutoff: 780, pad: 'triangle', accent: 'sine', accentBeats: .85,
    bars: [
      { chord: [43, 50, 57, 59], accents: [[0, 55], [2.5, 62], [4, 59], [6, 57]] },
      { chord: [40, 47, 55, 59], accents: [[0, 52], [2.5, 59], [4, 55], [6, 59]] },
      { chord: [48, 55, 59, 64], accents: [[0, 55], [2.5, 64], [4, 59], [6, 57]] },
      { chord: [45, 52, 57, 62], accents: [[0, 57], [2.5, 62], [4, 60], [6, 55]] }
    ]
  },
  verdant: {
    bpm: 66, beatsPerBar: 8, cutoff: 1200, pad: 'sine', accent: 'triangle', accentBeats: 1.2,
    bars: [
      { chord: [41, 48, 55, 57], accents: [[1, 60], [3, 65], [4.5, 67], [6.5, 69]] },
      { chord: [45, 52, 60, 64], accents: [[.5, 67], [3, 64], [6, 60]] },
      { chord: [46, 53, 60, 62], accents: [[1, 65], [2.5, 69], [5, 74], [6.5, 72]] },
      { chord: [41, 48, 57, 64], accents: [[1, 69], [3.5, 67], [6, 65]] }
    ]
  },
  finale: {
    bpm: 56, beatsPerBar: 8, cutoff: 1050, pad: 'triangle', accent: 'sine', accentBeats: 2.1,
    bars: [
      { chord: [41, 48, 55, 57], accents: [[1, 60], [4, 65]] },
      { chord: [43, 50, 58, 62], accents: [[1, 67], [4, 69]] },
      { chord: [46, 53, 60, 62], accents: [[1, 74], [4, 72]] },
      { chord: [41, 48, 57, 65], accents: [[1, 69], [4, 65]] }
    ]
  }
};

export const chapterThemes = ['meridian', 'harbor', 'verdant'];
