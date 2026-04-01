// Storage: escreve em localStorage (leitura síncrona) + Firebase (sync em tempo real)
import { db, ref, set, push, remove } from './firebase';

const PREFIX = 'fitchallenge_';

function lsKey(...parts: string[]): string {
  return PREFIX + parts.join('_');
}

// Firebase não aceita '/' nem '.' em chaves
function fbKey(k: string): string {
  return k.replace(/\//g, '-').replace(/\./g, '_');
}

// ── Dados gerais ────────────────────────────────────────

export function getData(userId: string, field: string): any {
  const raw = localStorage.getItem(lsKey('data', userId, field));
  if (raw === null) return undefined;
  try { return JSON.parse(raw); } catch { return raw; }
}

export function setData(userId: string, field: string, value: any): void {
  localStorage.setItem(lsKey('data', userId, field), JSON.stringify(value));
  set(ref(db, `data/${userId}/${fbKey(field)}`), value).catch(console.error);
}

// ── Desafios ─────────────────────────────────────────────

export function getChallengeValue(userId: string, dateKey: string, challengeId: string): any {
  return getData(userId, `ch_${dateKey}_${challengeId}`);
}

export function setChallengeValue(userId: string, dateKey: string, challengeId: string, value: any): void {
  setData(userId, `ch_${dateKey}_${challengeId}`, value);
}

// ── Diário ───────────────────────────────────────────────

export function getDiaryValue(userId: string, dateKey: string, field: string): any {
  return getData(userId, `tr_${dateKey}_${field}`);
}

export function setDiaryValue(userId: string, dateKey: string, field: string, value: any): void {
  setData(userId, `tr_${dateKey}_${field}`, value);
}

// ── Corrida ──────────────────────────────────────────────

export function getRunningValue(userId: string, dateKey: string, field: string): any {
  return getData(userId, `cor_${dateKey}_${field}`);
}

export function setRunningValue(userId: string, dateKey: string, field: string, value: any): void {
  setData(userId, `cor_${dateKey}_${field}`, value);
}

// ── Peso ─────────────────────────────────────────────────

export function getWeightValue(userId: string, dateKey: string, field: string): any {
  return getData(userId, `peso_${dateKey}_${field}`);
}

export function setWeightValue(userId: string, dateKey: string, field: string, value: any): void {
  setData(userId, `peso_${dateKey}_${field}`, value);
}

// ── Feed (Firebase direto) ───────────────────────────────

export function getFeedPosts(): any[] {
  const raw = localStorage.getItem(lsKey('feed'));
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function saveFeedPosts(posts: any[]): void {
  localStorage.setItem(lsKey('feed'), JSON.stringify(posts));
}

export function addFeedPost(post: any): void {
  push(ref(db, 'feed'), post).catch(console.error);
}

export function deleteFeedPost(postId: string): void {
  remove(ref(db, `feed/${postId}`)).catch(console.error);
}

export function toggleReaction(postId: string, type: 'fire' | 'like', userId: string, hasReacted: boolean): void {
  const path = `feed/${postId}/reactions/${type}/${userId}`;
  if (hasReacted) {
    remove(ref(db, path)).catch(console.error);
  } else {
    set(ref(db, path), true).catch(console.error);
  }
}
