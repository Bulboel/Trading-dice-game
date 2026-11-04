/* Jewel-toned panels, pale edges and light keyed to the discovered creature. */
const palettes={
 eau:{body:0x19486b,edge:0x9ac9df,glow:0x4ab8df},
 feu:{body:0x853e29,edge:0xe8c18b,glow:0xf28a50},
 terre:{body:0x4b6137,edge:0xd5c69b,glow:0xacc875},
 vent:{body:0x4a7e72,edge:0xd8e7ce,glow:0xa2dcc7},
 glace:{body:0x36718e,edge:0xd1edf3,glow:0x9adce9},
 foudre:{body:0x604581,edge:0xd6bfe5,glow:0xbf98e4},
 arcane:{body:0x594169,edge:0xd1b4dc,glow:0xc29bd7}
};
export function invocationPalette(element){return palettes[element]||palettes.arcane}
