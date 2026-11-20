// Chapter 2. Flag and reward IDs already include the chapter prefix.
window.Story = window.Story || {};
window.Story[2] = {
  title: 'Harbor Nine',
  tagline: 'Three ships are waiting for a light in the nebula.',
  intro: 'The Veil’s chart leads you to Harbor Nine, a waystation at the edge of a nebula. Three lost ships are calling for help. ORI keeps their text channels open while you go in to find the controls.',
  introVariants: [
    { needFlag: 'c1_ending_quiet', text: 'Following the bearing you took from the Veil’s pulses, you reach Harbor Nine. Three lost ships are calling for help from the edge of the nebula. ORI keeps their text channels open while you go in to find the controls.' }
  ],
  image: 'assets/ch2/title.webp',
  imageAlt: 'A waystation’s docking ring in a purple nebula with three approaching ships.',
  nextStop: 'As the last ship settles in, the waystation relays a distress call from the ark ship Verdant.',
  endings: [
    {
      flag: 'c2_ending_all',
      text: 'Three beacons, three bays. The ships dock together. Through the tower glass you can see three bright rectangles where the crews have opened their hatches.',
      epilogue: 'At Harbor Nine, three lights still shine together over the bays you opened.'
    },
    {
      flag: 'c2_ending_medic',
      text: 'The Halcyon’s injured crew reach the infirmary first. The other two ships wait at the beacon until their turn, then ask if the infirmary needs a hand.',
      epilogue: 'At Harbor Nine, the Halcyon’s crew recovers while the other captains keep them company.'
    },
    {
      flag: 'c2_ending_fair',
      text: 'One by one, in the order they arrived, the ships dock. Each captain leaves a light on. The Reed’s light is the last one you see as you leave.',
      epilogue: 'At Harbor Nine, the captains still remember how you brought them home one by one.'
    }
  ],
  companion: {
    id: 'tamsin',
    name: 'Pilot Tamsin',
    joins: 'The Reed finds the ring lights and Tamsin stays on the text channel to help you guide the other ships.',
    needFlag: 'c2_ring_lit',
    aid: [
      { choice: 'c2_cap_all', bonus: 1, text: 'Tamsin repeats each ship’s assigned bay back to the channel.' },
      { choice: 'c2_cap_all', advantage: true, needFlag: 'c2_tamsin_calm', text: 'Tamsin uses the one-step-at-a-time cadence you agreed on at the ring.' }
    ]
  },
  items: [
    { id: 'cargo_manifest', name: 'Cargo manifest', text: 'Pip’s cargo list, including a pencilled question mark beside crate seven.', needFlag: 'c2_manifest' },
    { id: 'verdant_relay', name: 'Verdant’s relay message', text: 'A distress message from the ark ship Verdant, with the coordinates of its seed vault entrance.', needFlag: 'c2_contacted' }
  ],
  levels: [
    {
      id: 4,
      title: 'Docking Ring',
      intro: 'The docking ring is dark. On the control desk, four coloured pads carry four different shapes. A line of text breaks up on the radio display. Outside the glass, the Reed turns slowly in the nebula light.',
      afterIntro: 'The ring lights hold steady. Across the glass, the Reed has a clear approach.',
      goals: [{ text: 'Light the docking ring', needFlag: 'c2_ring_lit' }],
      banter: [
        { companion: 'ori', text: 'I can put each ship on its own line of text. The one that keeps repeating is the Reed.' },
        { companion: 'tamsin', text: 'I can hold on the lit approach now. If you need me, leave my channel open.' }
      ],
      hotspots: [
        { id: 'c2_look1', label: 'Look out the window', xp: 5,
          text: 'Three ships hover at the edge of the nebula. Each is a faint dot of running lights. The nearest drifts a little, then corrects its course.' },
        {
          id: 'c2_radio1', label: 'Answer the Reed',
          notFlag: 'c2_radio1_heard', afterText: '“The Reed is holding on your channel. Tell me when you have instructions.”',
          dialogue: {
            start: 'a',
            nodes: {
              a: { speaker: 'Pilot Tamsin', text: 'Harbor Nine, this is the Reed. Hull intact, fuel low, static across the display. I cannot see your docking lights. Is anyone there?', choices: [
                { text: '“I am here, Tamsin. We will do this one step at a time.”', id: 'c2_tamsin_calm', check: { stat: 'emp', dc: 13, onPass: 'calm', onFail: 'uncertain' }, setFlag: 'c2_tamsin_calm', xp: 15 },
                { text: '“Hold position. How much fuel do you have?”', next: 'fuel' },
                { text: '“The lights are out. Give me a minute.”', next: 'fuel' }
              ] },
              calm: { speaker: 'Pilot Tamsin', text: 'One step at a time. Yes. My computer recognises the ring by the order its pads light up. Play the pattern and enter it again at the desk.', choices: [
                { text: '“I’ll watch the pads.”', next: 'end' }
              ] },
              uncertain: { speaker: 'Pilot Tamsin', text: 'Part of that came through. Let’s stick to short messages until the ring is lit.', choices: [
                { text: '“Fuel reading?”', next: 'fuel' }
              ] },
              fuel: { speaker: 'Pilot Tamsin', text: 'Ten percent, maybe less. My computer recognises the ring by the order its pads light up. Watch the pattern, then repeat it on the pads.', choices: [
                { text: '“On it.”', next: 'end' }
              ] },
              end: { speaker: 'Pilot Tamsin', text: 'Holding position. Tell me when you see the first light.', choices: [{ id: 'done', text: 'Done', setFlag: 'c2_radio1_heard' }] }
            }
          }
        },
        { id: 'c2_p_memory', label: 'Light the docking ring', puzzle: 'memory', setFlag: 'c2_ring_lit', xp: 30,
          text: 'The ring wakes in a slow circle of light. Beyond the window the Reed answers with one blink.',
          bypassText: 'You run the ring’s maintenance sequence. One light after another comes on, and the Reed blinks in reply.' },
        { id: 'c2_door1', label: 'Head down to the cargo bay', needFlag: 'c2_ring_lit', exit: true,
          blockedText: 'The waystation keeps the lower hatch sealed until the docking ring is lit.' }
      ]
    },
    {
      id: 5,
      title: 'Cargo Bay',
      intro: 'Nine grey crates sit in three rows. Pip waits by the manifest terminal. The tower lift checks both the weight test and the cargo list.',
      afterIntro: 'The lifting rig has the heavy crate. The tower lift checks the weight and Pip’s manifest separately.',
      goals: [
        { text: 'Find the heavy crate', needFlag: 'c2_cargo_ok' },
        { text: 'Get Pip to unlock the manifest', needFlag: 'c2_manifest' }
      ],
      banter: [
        { companion: 'ori', text: 'Pip has counted the front row three times. You could ask whether Pip would like company.' },
        { companion: 'tamsin', text: 'Everything on my ship has a label and a place. In somebody else’s cargo bay I can never find a thing.' }
      ],
      hotspots: [
        { id: 'c2_look2', label: 'Look at the crates', xp: 5,
          text: 'Nine crates, the same size and colour. The numbers distinguish them. Use the balance scale to compare their weight.' },
        {
          id: 'c2_pip', label: 'Talk to Pip', notFlag: 'c2_manifest',
          dialogue: {
            start: 'a',
            nodes: {
              a: { speaker: 'Pip', text: 'Manifest is locked. Pip is guarding the cargo list. A crate fell once. Pip counts them every time now.', choices: [
                { text: '“One dropped crate tells me very little about you, Pip.”', id: 'c2_pip_emp', check: { stat: 'emp', dc: 12, onPass: 'win', onFail: 'ask' }, setFlag: 'c2_manifest', xp: 20 },
                { text: '“This lock code belonged to the last owner. Let’s look at the log.”', id: 'c2_pip_sci', check: { stat: 'sci', dc: 12, onPass: 'win', onFail: 'ask' }, setFlag: 'c2_manifest', xp: 20 },
                { text: '“May I recalibrate your grip sensor?”', id: 'c2_pip_eng', check: { stat: 'eng', dc: 12, onPass: 'win', onFail: 'ask' }, setFlag: 'c2_manifest', xp: 20 },
                { text: '“Please, Pip. People are waiting.”', next: 'ask' }
              ] },
              ask: { speaker: 'Pip', text: 'Pip would like to finish the count. People are waiting. If you count crates with Pip, Pip will share.', choices: [
                { text: 'Count the rows with Pip.', id: 'c2_pip_count', next: 'win', setFlag: 'c2_manifest', xp: 10 }
              ] },
              win: { speaker: 'Pip', text: 'Pip will share the list. Thank you for asking first.', choices: [
                { text: '“Thank you, Pip.”', next: 'done' }
              ] },
              done: { speaker: 'Pip', text: 'Manifest unlocked. Crate seven is on the heavy side. Pip thinks.' }
            }
          }
        },
        { id: 'c2_p_scales', label: 'Use the balance scale', puzzle: 'scales', setFlag: 'c2_cargo_ok', xp: 30,
          text: 'The heavy crate rolls onto the lifting rig. The tower lift’s weight indicator turns green.',
          bypassText: 'You let the lifting rig weigh the crates one by one. It keeps the heaviest, and the lift’s weight indicator turns green.' },
        { id: 'c2_door2', label: 'Take the lift to the tower', needAll: ['c2_cargo_ok', 'c2_manifest'], exit: true,
          blockedText: 'The lift needs both the confirmed crate weight and Pip’s manifest clearance.' }
      ]
    },
    {
      id: 6,
      title: 'Beacon Tower',
      intro: 'From the glass tower you can see the ends of all three docking bays. The beacon desk has two dials, frequency and phase. Their readings change the narrow stripe of static on the monitor.',
      afterIntro: 'The beacon carries a clean signal to all three ships. Their captains can read your docking instructions.',
      goals: [
        { text: 'Tune the beacon', needFlag: 'c2_beacon_tuned' },
        { text: 'Guide the lost ships in', needFlag: 'c2_contacted' }
      ],
      banter: [
        { companion: 'ori', text: 'The Halcyon’s message is still on the screen. I’ll keep it pinned while you tune the dials.' },
        { companion: 'tamsin', text: 'If we use three bays, give each ship its own number and let me read them back. That way nobody follows the wrong light.' }
      ],
      hotspots: [
        { id: 'c2_look3', label: 'Study the static', xp: 5,
          text: 'A thin stripe keeps resurfacing on the monitor. The strength meter rises as the dials bring that stripe into focus.' },
        { id: 'c2_p_tuner', label: 'Tune the beacon', puzzle: 'tuner', setFlag: 'c2_beacon_tuned', xp: 30,
          text: 'The stripe holds steady. On the tower display, the beacon reaches all three ships.',
          bypassText: 'You let the tower scan both dials automatically. The stripe holds steady and three acknowledgements appear.' },
        {
          id: 'c2_talk3', label: 'Speak to the captains', needFlag: 'c2_beacon_tuned', notFlag: 'c2_contacted',
          blockedText: 'Tune the beacon before sending docking instructions.',
          dialogue: {
            start: 'a',
            nodes: {
              a: { speaker: 'Game Master', text: 'Three messages arrive together. The Reed, the Halcyon and the Marigold are all low on fuel and ask to dock first. The Halcyon adds a line about injured crew. All three wait for your instructions.', choices: [
                { text: '“We will dock in arrival order. Tamsin, you have waited longest.”', next: 'fair' },
                { text: '“Halcyon, your crew need the infirmary. You dock first.”', next: 'medic' },
                { text: '“Three bays, three approaches. Tamsin, help me guide everyone in together.”', id: 'c2_cap_all', check: { stat: 'emp', dc: 15, onPass: 'all', onFail: 'overlap' }, xp: 25 },
                { text: '“Everyone hold while I look at the arrivals.”', next: 'hold' }
              ] },
              hold: { speaker: 'ORI', text: 'The Reed arrived first. The Halcyon requests medical help. The Marigold confirms it can hold. I have put the three reports side by side.', choices: [
                { text: 'Return to the channel.', next: 'a' }
              ] },
              overlap: { speaker: 'Pilot Tamsin', text: 'Two of us confirmed the same approach. Let’s use one at a time so we can keep the instructions clear.', choices: [
                { text: 'Use arrival order.', next: 'fair' },
                { text: 'Give the Halcyon priority.', next: 'medic' }
              ] },
              fair: { speaker: 'Pilot Tamsin', text: 'The Reed is ready. I’ll confirm when I’m clear of the approach. The others can follow the same light.', choices: [
                { text: 'Guide them in, one by one.', next: 'fin', setFlag: 'c2_ending_fair' },
                { text: 'Review the reports again.', next: 'hold' }
              ] },
              medic: { speaker: 'Halcyon captain', text: 'Our medics are standing by at the airlock. Thank you. We’ll keep the approach clear once we’re in.', choices: [
                { text: 'Guide the Halcyon in first.', next: 'fin', setFlag: 'c2_ending_medic' },
                { text: 'Review the reports again.', next: 'hold' }
              ] },
              all: { speaker: 'Game Master', text: 'Three acknowledgements print on separate lines. Each ship repeats a different bay number. Tamsin marks the approaches clear.', choices: [
                { text: 'Open every bay.', next: 'fin', setFlag: 'c2_ending_all' },
                { text: 'Review the reports again.', next: 'hold' }
              ] },
              fin: { speaker: 'Harbor Nine', text: 'All ships responding. Docking sequence underway.', choices: [
                { text: 'Close the channel.', setFlag: 'c2_contacted' }
              ] }
            }
          }
        },
        { id: 'c2_finish3', label: 'Send the all-clear', needFlag: 'c2_contacted', exit: true,
          blockedText: 'The all-clear can go out once the captains have their docking instructions and the channel is closed.' }
      ]
    }
  ]
};
