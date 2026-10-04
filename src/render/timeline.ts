import { Message } from '../types';
export interface Timeline { evs: { t: number; m: Message }[]; dur: number; }
export function buildTimeline(messages: Message[], introGap: number): Timeline {
  let time = Math.max(0, Number(introGap) || 0); const evs = [] as Timeline['evs'];
  for (const message of messages) { time += Math.max(0.2, Number(message.gap) || 1.4); evs.push({ t: time, m: message }); }
  return { evs, dur: (evs.at(-1)?.t ?? time) + 2 };
}
