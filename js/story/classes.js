// One background per Navigator. Scores are also used by the original puzzle hints.
window.StoryClasses = [
  {
    id: 'engineer',
    name: 'Engineer',
    background: 'Survey Fleet Mechanic',
    description: 'You kept old survey ships running between ports. When a system jams, you trace the fault and work from there.',
    stats: { eng: 5, sci: 2, emp: 2 }
  },
  {
    id: 'diplomat',
    name: 'Diplomat',
    background: 'Waystation Liaison',
    description: 'You helped crews agree on docking, repairs and the use of shared space. You know when to ask a question and when to wait.',
    stats: { eng: 2, sci: 2, emp: 5 }
  },
  {
    id: 'scientist',
    name: 'Scientist',
    background: 'Field Researcher',
    description: 'You catalogued signals and kept field records on distant worlds. You look for a pattern and check it against the evidence.',
    stats: { eng: 2, sci: 5, emp: 2 }
  }
];
