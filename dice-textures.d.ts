declare module "dice-textures" {
  export interface DiceTexturesOptions {
    size?: number;
    color?: string;
    strokeColor?: string;
    strokeLineWidth?: number;
    cornerRadius?: number;
    padding?: number;
    pipColor?: string;
    pipStrokeColor?: string;
    pipStrokeLineWidth?: number;
    pipRadius?: number;
  }

  export interface DiceOutputOptions {
    type?: string;
    quality?: number;
  }

  export default function createDiceTextures(
    texturesOptions?: DiceTexturesOptions,
    outputOptions?: DiceOutputOptions
  ): string[];
}
