import type { DieValue, Roll, Declaration } from "@/types/game";

export function rollDie(): DieValue {
  return (Math.floor(Math.random() * 6) + 1) as DieValue;
}

export function rollDice(): Roll {
  const a = rollDie();
  const b = rollDie();
  return a >= b ? [a, b] : [b, a];
}

export function rollToDeclaration(roll: Roll): Declaration {
  return roll[0] * 10 + roll[1];
}
