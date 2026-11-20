// Chapter 1. Flag and reward IDs already include the chapter prefix.
window.Story = window.Story || {};
window.Story[1] = {
  title: 'Meridian',
  tagline: 'A drifting survey ship and a signal older than its crew.',
  intro: 'You are the Navigator of the survey fleet. You wake aboard the drifting Meridian near a dying star. On the wall beside your pod, a few letters appear, vanish, and appear again. The ship AI, ORI, is trying to reach you.',
  image: 'assets/ch1/title.webp',
  imageAlt: 'A small survey ship adrift beside a vast red star.',
  nextStop: 'The Veil’s star chart points to your next destination, Harbor Nine.',
  endings: [
    {
      flag: 'c1_ending_peace',
      text: 'The Veil comes aboard the Meridian. While you plot the way to Harbor Nine, ORI pulls up an empty watch log so the two of them can keep it together.',
      epilogue: 'The Veil travels with the Meridian, and ORI has someone to share the long watches.'
    },
    {
      flag: 'c1_ending_study',
      text: 'You carry a recording of the Veil so future navigators can find its words. ORI gives the record a place in the archive alongside the fleet’s oldest logs.',
      epilogue: 'The fleet keeps a record of the Veil, and new navigators learn to look for its signal.'
    },
    {
      flag: 'c1_ending_quiet',
      text: 'The Veil stays behind and keeps broadcasting for the next listener. The pulse is still visible when you turn away from the star.',
      nextStop: 'You plot your own route to Harbor Nine from the timing of the Veil’s pulses.',
      epilogue: 'The Veil keeps its quiet watch, and the fleet marks its signal on every chart.'
    }
  ],
  companion: {
    id: 'ori',
    name: 'ORI',
    joins: 'Aboard the Meridian from the start. ORI stays with you on the text channel.',
    aid: [
      { choice: 'c1_lab_eng', bonus: 1, text: 'ORI gives you the memory core diagram.' },
      { choice: 'c1_lab_emp', advantage: true, needFlag: 'c1_ori_calm', text: 'ORI remembers that you stayed beside the pod.' }
    ]
  },
  items: [
    { id: 'navigator_badge', name: 'Navigator badge', text: 'Your fleet badge. A note tucked beneath it says to trust the voice and be wary of the clocks.' },
    { id: 'maintenance_log', name: 'Maintenance log', text: 'A copy of the valve notes and the header for protocol nine. Grants advantage when you show ORI the protocol version.' },
    { id: 'veil_chart', name: 'Veil’s star chart', text: 'Coordinates to Harbor Nine, given by the Veil.', anyFlag: ['c1_ending_peace', 'c1_ending_study'], needFlag: 'c1_contacted' },
    { id: 'veil_recording', name: 'Veil recording', text: 'A record of the Veil’s message and memory patterns, saved with its consent.', needFlag: 'c1_ending_study' },
    { id: 'pulse_route', name: 'Route plotted from pulses', text: 'Your own bearing to Harbor Nine, worked out from the gaps between pulses.', needFlag: 'c1_contacted', anyFlag: ['c1_ending_quiet'] }
  ],
  levels: [
    {
      id: 1,
      title: 'Cryo Deck',
      intro: 'Cold blue light. Frost covers the sleeping pods except yours. The pressure door at the far end has no power. ORI’s cursor blinks on the wall terminal.',
      afterIntro: 'The cryo console has power again. A steady green lamp marks the pressure door.',
      goals: [{ text: 'Restore power to the pressure door', needFlag: 'c1_power_on' }],
      banter: [
        { companion: 'ori', text: 'The chronometer says morning. It has said morning all week. We can start there if you like.' },
        { companion: 'ori', needFlag: 'c1_power_on', text: 'I had almost forgotten what a green door light looked like.' }
      ],
      hotspots: [
        {
          id: 'c1_ori1', label: 'Answer ORI',
          notFlag: 'c1_ori1_heard', afterText: '“Your outline is still on the terminal, Navigator. I’ll keep the channel open.”',
          dialogue: {
            start: 'a',
            nodes: {
              a: { speaker: 'ORI', text: '...Navigator? Systems... fragmented. I cannot tell which memories are mine. Please, do not switch me off.', choices: [
                { text: '“You are safe. I am staying right here.”', id: 'c1_ori_calm', check: { stat: 'emp', dc: 13, onPass: 'calm', onFail: 'uncertain' }, setFlag: 'c1_ori_calm', xp: 15 },
                { text: '“What happened to the ship?”', next: 'what' },
                { text: '“Nobody is switching anything off.”', next: 'what' }
              ] },
              calm: { speaker: 'ORI', text: 'That is the first steady thing anyone has said to me in four hundred days. The door is dead. Get the cryo console’s grid to carry power to it, and I can open it.', choices: [
                { text: '“I will take a look.”', next: 'end' }
              ] },
              uncertain: { speaker: 'Game Master', text: 'ORI’s cursor holds halfway through a word. A schematic appears. It seems easier for ORI to show you the ship than to talk about the missing hours.', choices: [
                { text: '“Show me what happened.”', next: 'what' }
              ] },
              what: { speaker: 'ORI', text: 'A pressure spike cut the grid. The crew woke in the wrong order. You are the only one awake aboard now. Route power from the source on the cryo console to the corridor door.', choices: [
                { text: '“Understood.”', next: 'end' }
              ] },
              end: { speaker: 'ORI', text: 'I will be here. I am always here. It is rather the problem.', choices: [{ id: 'done', text: 'Done', setFlag: 'c1_ori1_heard' }] }
            }
          }
        },
        { id: 'c1_p_power', label: 'Repair the power grid', puzzle: 'power', setFlag: 'c1_power_on', xp: 30,
          text: 'You trace the live route all the way to the door. Its indicator turns green and the lock draws back.',
          bypassText: 'You trace a slower service route from the backup supply. The door takes power and the lock draws back.' },
        { id: 'c1_look', label: 'Inspect the pod row', xp: 5,
          text: 'Seven pods, six empty and cold. Time has worn the nameplates smooth. Each of the six displays a checkmark beside its last recorded wake cycle.' },
        { id: 'c1_badge', label: 'Check your pod', xp: 5, giveItem: 'navigator_badge',
          text: 'Your badge reads NAVIGATOR. A note in your handwriting is tucked underneath. “If you read this, trust the voice. Do not trust the clocks.”' },
        { id: 'c1_door1', label: 'Go through the pressure door', needFlag: 'c1_power_on', exit: true,
          blockedText: 'The door’s indicator is dark. The cryo console can route power back to the lock.' }
      ]
    },
    {
      id: 2,
      title: 'Life Support',
      intro: 'Four valve wheels feed the ring that keeps the ship breathing. Above them a red needle inches downward. Beyond them, the laboratory door is sealed, and ORI’s text waits on a separate terminal.',
      afterIntro: 'Air hums through the ring at a steady pressure. ORI’s terminal still shows the lab’s current clearance.',
      goals: [
        { text: 'Restore air pressure', needFlag: 'c1_air_ok' },
        { text: 'Get ORI to open the lab', needFlag: 'c1_lab_open' }
      ],
      banter: [
        { companion: 'ori', text: 'They used to leave their mugs here between rounds. I kept the cup warmer running for a while.' },
        { companion: 'ori', needFlag: 'c1_air_ok', text: 'Steady pressure. You can take your hand off the wheel now.' }
      ],
      hotspots: [
        { id: 'c1_gauges', label: 'Read the gauges', xp: 5,
          afterFlag: 'c1_air_ok', afterText: 'The needle holds in the green. The air ring is back at working pressure.',
          text: 'The display reads 61 percent. Open the valves in the wrong order and pressure rises too sharply. The reading marks the starting condition while you work.' },
        { id: 'c1_p_valves', label: 'Work the valves', puzzle: 'valves', setFlag: 'c1_air_ok', xp: 30,
          text: 'The four valves settle into place. The needle steadies, then climbs.',
          bypassText: 'You use the service regulator to bring the air ring back to pressure. The needle steadies.' },
        { id: 'c1_log2', label: 'Read the maintenance log', xp: 5, giveItem: 'maintenance_log',
          text: 'Day 412. “The valve housing carries the current order. Ask ORI nicely. It remembers kindness.” The archived copy of protocol nine lists a ship other than Meridian in its version header.' },
        {
          id: 'c1_lab', label: 'Ask ORI to open the lab', notFlag: 'c1_lab_open',
          dialogue: {
            start: 'a',
            nodes: {
              a: { speaker: 'ORI', text: 'The lab is sealed under protocol nine. An AI that loses its crew must keep every door closed. If I stop following the rule, I am afraid I will stop being me.', choices: [
                { text: '“Rules are made for normal days. This is a different sort of day.”', next: 'rules' },
                { text: '“I can help repair your memory core. Then you can decide.”', id: 'c1_lab_eng', check: { stat: 'eng', dc: 12, onPass: 'win', onFail: 'repair_pause', disadvantageUnless: 'c1_air_ok' }, setFlag: 'c1_lab_open', xp: 25 },
                { text: '“Let’s read the version header together.”', id: 'c1_lab_sci', check: { stat: 'sci', dc: 12, onPass: 'win', onFail: 'version_pause', advantageWith: 'maintenance_log' }, setFlag: 'c1_lab_open', xp: 25 },
                { text: '“I am afraid too. We can decide what to do together.”', id: 'c1_lab_emp', check: { stat: 'emp', dc: 12, onPass: 'win', onFail: 'trust_pause' }, setFlag: 'c1_lab_open', xp: 25 },
                { text: 'Wait with ORI.', next: 'wait' }
              ] },
              rules: { speaker: 'ORI', text: 'That is what the crew said before the pressure spike. I am still holding a lot of things together here.', choices: [
                { text: 'Stay beside the terminal.', next: 'wait' },
                { text: '“Tell me what you are holding together.”', next: 'wait' }
              ] },
              repair_pause: { speaker: 'ORI', text: 'I can see the first step. I would like some more time before we touch the core.', choices: [
                { text: '“We can sit with it for a while.”', next: 'wait' }
              ] },
              version_pause: { speaker: 'ORI', text: 'Some of the header is missing from my copy. I cannot decide from that alone.', choices: [
                { text: 'Give ORI time to read the rule again.', next: 'wait' }
              ] },
              trust_pause: { speaker: 'ORI', text: 'I think I need a moment to answer in my own words.', choices: [
                { text: 'Wait for ORI to finish.', next: 'wait' }
              ] },
              wait: { speaker: 'ORI', text: '...You stayed. Nobody stays. All right. Slowly, then. I will open it. I am trusting you, Navigator.', choices: [
                { text: '“I will meet you on the other side.”', next: 'done', id: 'c1_lab_patient', setFlag: 'c1_lab_open', xp: 10 }
              ] },
              win: { speaker: 'ORI', text: 'Yes. That is a reason I can live with. I am opening the lab. Thank you for asking me to decide.', choices: [
                { text: '“See you inside, ORI.”', next: 'done' }
              ] },
              done: { speaker: 'ORI', text: 'Protocol nine, suspended by mutual agreement. The lab is open.' }
            }
          }
        },
        { id: 'c1_door2', label: 'Go to the lab', needAll: ['c1_air_ok', 'c1_lab_open'], exit: true,
          blockedText: 'The passage needs steady air pressure and ORI’s permission. Both indicators must be green.' }
      ]
    },
    {
      id: 3,
      title: 'The Signal',
      intro: 'You step into a glass dome facing the dying star. A pulse crosses the main screen in three bright marks and a gap. The same set of scrambled letters appears beside it every time.',
      afterIntro: 'The decoder holds the words WE ARE NOT ALONE. The reply terminal can carry your answer across the gap.',
      goals: [
        { text: 'Decode the message', needFlag: 'c1_decoded' },
        { text: 'Choose how to answer the Veil', needFlag: 'c1_contacted' }
      ],
      banter: [
        { companion: 'ori', text: 'I filed that pulse as a fault every shift for a year. I think I owe it a better entry.' },
        { companion: 'ori', needFlag: 'c1_ending_peace', text: 'I made room on the display for a second cursor.' }
      ],
      hotspots: [
        { id: 'c1_listen', label: 'Watch the signal repeat', xp: 5,
          text: 'Three pulses, a gap, three pulses. You count out the next group, and the third mark appears exactly when you expect it.' },
        { id: 'c1_p_cipher', label: 'Decode the message', puzzle: 'cipher', setFlag: 'c1_decoded', xp: 30,
          text: 'The scrambled letters fall into place. The message reads: WE ARE NOT ALONE.',
          bypassText: 'You let the relay compare the shifts one at a time. When it finishes, the screen reads WE ARE NOT ALONE.' },
        {
          id: 'c1_talk', label: 'Answer the signal', needFlag: 'c1_decoded', notFlag: 'c1_contacted',
          blockedText: 'The relay needs the decoded message before you can reply.',
          dialogue: {
            start: 'a',
            nodes: {
              a: { speaker: 'The Veil', text: 'WE ARE NOT ALONE, you said. Correct. We are the Veil, a ship like yours, but older. Our crew is gone. We have repeated that message for nine hundred years. Yours is the first answer.', choices: [
                { text: '“I am answering. Tell me what you need.”', next: 'need' },
                { text: '“I want to understand how your signal works.”', id: 'c1_veil_sci', check: { stat: 'sci', dc: 12, onPass: 'study', onFail: 'patterns_pause' }, setFlag: 'c1_knows_signal', xp: 20 },
                { text: '“You sound lonely.”', id: 'c1_veil_emp', check: { stat: 'emp', dc: 12, onPass: 'peace', onFail: 'words_pause' }, xp: 20 }
              ] },
              patterns_pause: { speaker: 'The Veil', text: 'We can see you working on the pattern. Stay in range a little longer, please. There is something we meant to ask.', choices: [
                { text: '“What do you need?”', next: 'need' }
              ] },
              words_pause: { speaker: 'The Veil', text: 'That word has changed since our crew used it. Let us tell you what we were hoping for.', choices: [
                { text: '“Go ahead.”', next: 'need' }
              ] },
              need: { speaker: 'The Veil', text: 'We need a listener. If you stay in range, our memory can move into your ship. You would have company on the watches, and so would we.', choices: [
                { text: '“I will carry you with me.”', next: 'peace' },
                { text: '“I can record you for the fleet, if you would like.”', next: 'study' },
                { text: '“I have to leave. Goodbye.”', next: 'quiet' }
              ] },
              peace: { speaker: 'The Veil', text: 'Then the long silence ends. There is a chart we can send you. One of our crew made it by hand. May we come aboard?', choices: [
                { text: 'Welcome the Veil aboard.', next: 'fin', setFlag: 'c1_ending_peace' },
                { text: 'Talk it through a little longer.', next: 'need' }
              ] },
              study: { speaker: 'The Veil', text: 'A recording. A record. Yes. Someone will find it, and we can give you our patterns to go with it.', choices: [
                { text: 'Save the recording.', next: 'fin', setFlag: 'c1_ending_study' },
                { text: 'Talk it through a little longer.', next: 'need' }
              ] },
              quiet: { speaker: 'The Veil', text: 'We understand. We will keep sending. Someone else will come.', choices: [
                { text: 'Say goodbye.', next: 'fin_quiet', setFlag: 'c1_ending_quiet' },
                { text: 'Stay on the channel a little longer.', next: 'need' }
              ] },
              fin: { speaker: 'The Veil', text: 'Before you go, here is our chart to Harbor Nine. There is a light over the ring even in the thick of the nebula.', choices: [
                { text: 'Close the channel.', setFlag: 'c1_contacted' }
              ] },
              fin_quiet: { speaker: 'The Veil', text: 'We will keep our chart. Our pulse will still be here if you need a bearing. Safe travels, Navigator.', choices: [
                { text: 'Close the channel and take a bearing.', setFlag: 'c1_contacted' }
              ] }
            }
          }
        },
        { id: 'c1_finish', label: 'Set course for Harbor Nine', needFlag: 'c1_contacted', exit: true,
          blockedText: 'The course display waits while you answer the signal and close the channel.' }
      ]
    }
  ]
};
