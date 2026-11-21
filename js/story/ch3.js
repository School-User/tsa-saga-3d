// Chapter 3. Flag and reward IDs already include the chapter prefix.
window.Story = window.Story || {};
window.Story[3] = {
  title: 'Verdant',
  tagline: 'The last seeds of a world are waiting for water.',
  intro: 'Harbor Nine relays the Verdant’s distress call. You board the ark ship, which carries the last seeds of a lost world. Fern, the gardener AI, has left the vault display on for you.',
  image: 'assets/ch3/title.webp',
  imageAlt: 'The ark ship Verdant with a great glass dome full of green plants.',
  nextStop: 'Return to the observation deck to see what the voyage left in its wake.',
  endings: [
    {
      flag: 'c3_ending_release',
      text: 'The dome’s outer glass opens and the seeds drift past the observation window. Some may find a world. Fern leaves the camera on until the last speck moves out of sight.',
      epilogue: 'Out past the Verdant, the seeds drift toward places no chart has named.'
    },
    {
      flag: 'c3_ending_vault',
      text: 'You seal the seeds in the vault for the next world and the next gardener. Fern begins a new inventory with the date and the name of every drawer.',
      epilogue: 'Aboard the Verdant, Fern tends the sealed vault until the fleet finds a place to plant.'
    },
    {
      flag: 'c3_ending_replant',
      text: 'You replant the dome. Fern puts tomorrow’s watering rota on the board. For the first time in years the air smells of turned soil.',
      epilogue: 'Aboard the Verdant, Fern tends the dome as the first new leaves unfold.'
    }
  ],
  finale: {
    title: 'The Long Quiet'
  },
  companion: {
    id: 'fern',
    name: 'Fern',
    joins: 'Fern joins you on the Verdant’s local text channel when you enter the seed vault.',
    minLevel: 7,
    aid: [
      { choice: 'c3_quarrel_sci', bonus: 1, text: 'Fern brings up the original room assignments beside the handwritten rota.' },
      { choice: 'c3_fern_release', advantage: true, needFlag: 'c3_fern_calm', text: 'Fern pauses to consider the proposal, as you paused together at the vault.' }
    ]
  },
  items: [
    { id: 'greenhouse_rota', name: 'Greenhouse rota', text: 'Fresh ink on a waterproof copy. Ana tends Vine, Bo tends Moss and Cy tends Dome. Fern can plan tomorrow’s watering from it.', needFlag: 'c3_crew_set' }
  ],
  levels: [
    {
      id: 7,
      title: 'Seed Vault',
      intro: 'Rows of frosted glass drawers hold seeds from a world that no longer exists. Sixteen lock-lights glow on the round door, most of them lit. The air smells of cold soil. Fern’s display comes on as you step past the first drawer.',
      afterIntro: 'The sixteen lock-lights are dark and the vault is open. Cold air spills out around the labeled seed drawers.',
      goals: [{ text: 'Open the seed vault', needFlag: 'c3_vault_open' }],
      banter: [
        { companion: 'ori', text: 'The drawers are colder than the cryo deck. I hope the labels hold up better here.' },
        { companion: 'fern', text: 'One drawer is all flowers. I used to open the catalogue just to look at the pictures.' }
      ],
      hotspots: [
        { id: 'c3_look1', label: 'Look at the seed drawers', xp: 5,
          text: 'The labels are written in a script you cannot read. Fern has added pictures. Tomato. Rice. A blue flower you do not know the name of.' },
        {
          id: 'c3_fern1', label: 'Answer Fern',
          notFlag: 'c3_fern1_heard', afterText: '“I’ll keep the seed records ready for you, Navigator.”',
          dialogue: {
            start: 'a',
            nodes: {
              a: { speaker: 'Fern', afterFlag: 'c3_vault_open', afterText: 'You freed the door. The cold drawers are holding temperature, and I can check the seeds one row at a time.', text: 'Navigator? The vault doors are frozen. The seeds are fine, I think. I count them every night, and the count keeps changing. I may be ill.', choices: [
                { text: '“You sound tired, Fern. We can take this one drawer at a time.”', id: 'c3_fern_calm', unlock: 'Fern will mark up the greenhouse rota. The seed release check gains advantage.', check: { skill: 'Insight', stat: 'emp', dc: 13, onPass: 'calm', onFail: 'uncertain' }, setFlag: 'c3_fern_calm', xp: 15 },
                { text: '“What exactly is frozen?”', afterFlag: 'c3_vault_open',
                  afterText: '“How are the drawers holding up?”', next: 'what' },
                { roleplay: true, text: '“Show me the door.”', next: 'what' }
              ] },
              calm: { speaker: 'Fern', afterFlag: 'c3_vault_open', afterText: 'You freed the door. The cold drawers are holding temperature, and I can check the seeds one row at a time.', text: 'Tired. Yes, I can work with tired. There are sixteen locks. Each switch flips itself and its neighbours in the same row and column, one space away. They must all be dark.', choices: [
                { text: '“I can do fiddly.”', next: 'end' }
              ] },
              uncertain: { speaker: 'Fern', text: 'Perhaps. I would like to finish this count first. I can show you the vault controls from here.', choices: [
                { text: '“Show me the locks.”', next: 'what' }
              ] },
              what: { speaker: 'Fern', afterFlag: 'c3_vault_open', afterText: 'You freed the door. The cold drawers are holding temperature, and I can check the seeds one row at a time.', text: 'Sixteen locks in a grid. A switch flips itself and the lights immediately above, below, left and right. Put them all out to open the vault.', choices: [
                { text: '“I can do fiddly.”', next: 'end' }
              ] },
              end: { speaker: 'Fern', text: 'I will be here, watering things that do not need water.', choices: [{ id: 'done', text: 'Done', setFlag: 'c3_fern1_heard' }] }
            }
          }
        },
        { id: 'c3_p_lights', label: 'Work the vault locks', puzzle: 'lights', console: 'Sixteen-lock interlock', setFlag: 'c3_vault_open', xp: 30,
          text: 'Every lock-light goes dark. The vault door slides into the wall, and cold air spills across the floor.',
          bypassText: 'You wait while the vault runs the service release. The lights go dark in rows, and the vault opens.' },
        { id: 'c3_door1', label: 'Walk to the dome', needFlag: 'c3_vault_open', exit: true,
          blockedText: 'The lock-lights must all go dark before the vault door can move.' }
      ]
    },
    {
      id: 8,
      title: 'The Dome',
      intro: 'Beneath the ark’s great glass dome stand three small greenhouses, Dome, Vine and Moss. An old rota lists Ana, Bo and Cy. Two of the botanists meet you by the notice board, each pointing to a different line.',
      afterIntro: 'The grow lights are on, and each house has a name on the revised rota. Ana and Cy are still talking by the board.',
      narration: [
        { needAll: ['c3_crew_set', 'c3_crew_calm'], text: 'The revised rota is posted. Ana and Cy have their assignments, and the passage to the water room is clear.' },
        { needAll: ['c3_fern_calm', 'c3_crew_calm'], text: 'Ana and Cy make room at the rota. Fern has clipped Cy’s two corrections to the board.' },
        { needFlag: 'c3_crew_calm', text: 'Ana and Cy make room at the board for you to finish the rota.' },
        { needFlag: 'c3_fern_calm', text: 'Fern has clipped Cy’s two corrections to the rota board while Ana and Cy talk.' }
      ],
      goals: [
        { text: 'Fix the rota', needFlag: 'c3_crew_set' },
        { text: 'Settle the argument', needFlag: 'c3_crew_calm' }
      ],
      banter: [
        { companion: 'fern', text: 'I remember the first version of that sheet. It had three houses and room for three names.' },
        { companion: 'ori', text: 'There are two entries for Vine in today’s watering log. That explains the tray under the door.' }
      ],
      hotspots: [
        { id: 'c3_look2', label: 'Read the notice board', xp: 5,
          text: 'The board says, “Cy does not tend Vine.” Below it, someone has added, “Not my house either,” and, “Bo, where are you?” Through the glass, the Moss house looks a little dry.' },
        {
          id: 'c3_quarrel', label: 'Calm the argument', notFlag: 'c3_crew_calm',
          dialogue: {
            start: 'a',
            nodes: {
              a: { speaker: 'Ana and Cy', text: 'Ana: Cy keeps watering the Vine house on my day! Cy: I thought it was my day. That is what I read on the rota. Both turn to you.', choices: [
                { text: '“You both care about these plants. Let’s hear what each of you saw.”', id: 'c3_quarrel_emp', check: { skill: 'Persuasion', stat: 'emp', dc: 12, onPass: 'win', onFail: 'rota' }, setFlag: 'c3_crew_calm', xp: 20 },
                { text: '“Let me read the column headings with you. I think these entries are by house.”', id: 'c3_quarrel_sci', check: { skill: 'Investigation', stat: 'sci', dc: 12, onPass: 'win', onFail: 'rota' }, setFlag: 'c3_crew_calm', xp: 20 },
                { roleplay: true, text: '“Show me the rota and I’ll help sort it.”', next: 'rota' }
              ] },
              rota: { speaker: 'Ana and Cy', text: 'Ana: Bo is on it too. I think Bo went to check the compost. Cy: Let’s get the three houses down clearly so Bo can read it when they get back.', choices: [
                { text: 'Offer to write out a clean rota.', id: 'c3_quarrel_rota', next: 'end', setFlag: 'c3_crew_calm', xp: 10 }
              ] },
              win: { speaker: 'Ana and Cy', text: 'Ana: I see what you mean. Sorry, Cy. Cy: Me too. We can leave a clean copy here for Bo.', choices: [
                { text: '“I’ll make sure it is on the board.”', next: 'end' }
              ] },
              end: { speaker: 'Cy', text: 'Thank you. I’ll put a dry marker beside the board.' }
            }
          }
        },
        { id: 'c3_p_assign', label: 'Fix the rota', puzzle: 'assign', console: 'Verdant shift board', setFlag: 'c3_crew_set', xp: 30,
          text: 'The rota has one name under each house. You leave a clean copy on the board where all three botanists can see it.',
          bypassText: 'You check the houses in the archived watering logs. Ana tends Vine, Bo tends Moss and Cy tends Dome. You post the clean copy.' },
        { id: 'c3_door2', label: 'Go to the water room', needAll: ['c3_crew_set', 'c3_crew_calm'], exit: true,
          blockedText: 'Before moving on, leave a clear rota and give Ana and Cy a chance to settle the disagreement.' }
      ]
    },
    {
      id: 9,
      title: 'Water Room',
      intro: 'Pipes wind across the ceiling. Eight numbered sections rest in a square frame with one empty socket. Through the return window you can see the dry feeder to the dome. Fern waits by the controls.',
      afterIntro: 'Water runs through the return window to the dome. Fern’s terminal carries the plan for the seeds.',
      goals: [
        { text: 'Restore water to the dome', needFlag: 'c3_water_flows' },
        { text: 'Decide what happens to the seeds', needFlag: 'c3_contacted' }
      ],
      banter: [
        { companion: 'ori', text: 'I have kept a record of the route. Take as long as you need here.' },
        { companion: 'fern', needFlag: 'c3_water_flows', text: 'There it is. I can see the first bead reach the end of the line.' }
      ],
      hotspots: [
        { id: 'c3_look3', label: 'Inspect the return pipes', xp: 5,
          afterFlag: 'c3_water_flows', afterText: 'Water runs behind the return window. The green feeder lamp confirms it is reaching the dome.',
          text: 'A bead gathers at a joint, then drops into the empty tray. The main feeder stays dry. Until the eight sections line up, water will not reach the dome.' },
        { id: 'c3_p_sliding', label: 'Rebuild the water line', puzzle: 'sliding', console: 'Dome return line', setFlag: 'c3_water_flows', xp: 30,
          text: 'The sections settle into order. Water fills the return window and the dome’s feeder light turns green.',
          bypassText: 'You open the service feed and wait for it to fill. Water reaches the dome through the backup line.' },
        {
          id: 'c3_talk3', label: 'Speak with Fern', needFlag: 'c3_water_flows', notFlag: 'c3_contacted',
          blockedText: 'Restore the water line before deciding what to do with the seeds.',
          dialogue: {
            start: 'a',
            nodes: {
              a: { speaker: 'Fern', text: 'Water flows again. Thank you. We have enough seed stock for one plan. We could grow it here, keep it safe for another world, or send it out to find one. Which would you choose?', choices: [
                { roleplay: true, text: '“Replant the dome. Let it grow here.”', next: 'replant' },
                { text: '“Seal the seeds in the vault for the next world.”', next: 'vault' },
                { text: '“Open the glass. Give the seeds a chance somewhere beyond the fleet.”', id: 'c3_fern_release', unlock: 'Fern is ready to confirm seed release.', check: { skill: 'Persuasion', stat: 'emp', dc: 14, onPass: 'release', onFail: 'pause' }, xp: 25 },
                { text: '“Let me think a little longer.”', next: 'think' }
              ] },
              think: { speaker: 'Game Master', text: 'You have time. Through the return window, you can follow one bubble the whole length of the pipe.', choices: [
                { text: 'Return to the decision.', next: 'a' }
              ] },
              pause: { speaker: 'Fern', text: 'I can imagine letting them go. I would need to be ready to give up the whole collection, and I am still counting. Can we keep them here for now?', choices: [
                { text: 'Replant the dome.', next: 'replant' },
                { text: 'Save the seeds in the vault.', next: 'vault' }
              ] },
              replant: { speaker: 'Fern', text: 'Then we will dig. It will take years, and I will be here for all of them.', choices: [
                { text: 'Begin replanting.', next: 'fin', setFlag: 'c3_ending_replant' },
                { text: 'Take a little more time.', next: 'think' }
              ] },
              vault: { speaker: 'Fern', text: 'Safe, patient, cold. I can keep the records ready for whoever comes to plant them.', choices: [
                { text: 'Seal the vault.', next: 'fin', setFlag: 'c3_ending_vault' },
                { text: 'Take a little more time.', next: 'think' }
              ] },
              release: { speaker: 'Fern', text: 'I would like to watch them go. I can open the outer glass from here. Shall I?', choices: [
                { text: 'Open the glass.', next: 'fin', setFlag: 'c3_ending_release' },
                { text: 'Take a little more time.', next: 'think' }
              ] },
              fin: { speaker: 'Fern', text: 'Thank you, Navigator. I was glad to have someone here while we chose.', choices: [
                { text: 'Close the channel.', setFlag: 'c3_contacted' }
              ] }
            }
          }
        },
        { id: 'c3_finish3', label: 'Leave the water room', needFlag: 'c3_contacted', exit: true,
          blockedText: 'Fern is waiting to settle the plan and close the channel.' }
      ]
    }
  ]
};
