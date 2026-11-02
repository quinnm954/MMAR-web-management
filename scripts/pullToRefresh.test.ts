import { expect, test } from 'bun:test';
import { canStartPullToRefresh } from '../src/lib/pullToRefresh';

test('message details and nested thread lists never start swipe refresh', () => {
  const previous = { Element: globalThis.Element, document: globalThis.document, getComputedStyle: globalThis.getComputedStyle };
  class Node {
    parentElement: Node | null = null;
    scrollHeight = 500;
    clientHeight = 500;
    blocked = false;
    closest() { return this.blocked ? this : null; }
  }
  Object.assign(globalThis, { Element: Node, document: { body: new Node() }, getComputedStyle: () => ({ overflowY: 'auto' }) });
  try {
    const target = new Node();
    target.blocked = true;
    expect(canStartPullToRefresh(target as unknown as EventTarget, 0)).toBe(false);
    target.blocked = false;
    const list = new Node();
    list.scrollHeight = 1500;
    target.parentElement = list;
    expect(canStartPullToRefresh(target as unknown as EventTarget, 0)).toBe(false);
    target.parentElement = null;
    expect(canStartPullToRefresh(target as unknown as EventTarget, 0)).toBe(true);
    expect(canStartPullToRefresh(target as unknown as EventTarget, 100)).toBe(false);
  } finally { Object.assign(globalThis, previous); }
});