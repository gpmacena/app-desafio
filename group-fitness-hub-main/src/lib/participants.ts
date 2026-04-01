import { Participant } from "./types";

export const PARTICIPANTS: Participant[] = [
  { id: "gabriel", name: "Gabriel", color: "#22c55e", waterGoal: 3 },
  { id: "debora", name: "Débora", color: "#a855f7", waterGoal: 2.5 },
  { id: "ezequiel", name: "Ezequiel", color: "#3b82f6", waterGoal: 3 },
];

export function getParticipant(id: string): Participant | undefined {
  return PARTICIPANTS.find(p => p.id === id);
}

export function getParticipantColor(id: string): string {
  return getParticipant(id)?.color ?? "#888";
}
