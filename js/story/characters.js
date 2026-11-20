// Each portrait shares its colors with the corresponding figure in the room.
export const characters = {
  navigator: { name: 'Navigator', shell: 0xffbd75, face: 0x203746, light: 0x99f0ff },
  ori: { name: 'ORI', shell: 0x98d9f8, face: 0x182e56, light: 0x91edff },
  tamsin: { name: 'Pilot Tamsin', shell: 0xcb7255, face: 0xa86b52, light: 0xffdf97 },
  fern: { name: 'Fern', shell: 0x82ca75, face: 0x2a5340, light: 0xd7ff9b },
  veil: { name: 'The Veil', shell: 0xba9beb, face: 0x362653, light: 0xffcfe9 }
};

export function characterId(name) {
  return Object.keys(characters).find(key => characters[key].name === name);
}
