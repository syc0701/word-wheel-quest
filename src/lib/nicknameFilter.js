import { Filter } from 'bad-words';

const filter = new Filter();

export function nicknameHasBadWords(name) {
  const value = String(name || '').trim();
  if (!value) return false;
  return filter.isProfane(value);
}
