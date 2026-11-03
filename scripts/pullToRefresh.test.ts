import { expect, test } from 'bun:test';
import { canStartPullToRefresh } from '../src/lib/pullToRefresh';

function withScrollTarget(check: (target: Node, list: Node) => void) {
  const previous = { Element: globalThis.Element, document: globalThis.document, getComputedStyle: globalThis.getComputedStyle };
  class Node {
    parentElement: Node | null = null;
    scrollHeight = 500;
    clientHeight = 500;
    scrollTop = 0;
    blocked = false;
    closest() { return this.blocked ? this : null; }
  }
  Object.assign(globalThis, { Element: Node, document: { body: new Node() }, getComputedStyle: () => ({ overflowY: 'auto' }) });
  try {
    const target = new Node();
    const list = new Node();
    list.scrollHeight = 1500;
    target.parentElement = list;
    check(target, list);
  } finally { Object.assign(globalThis, previous); }
}

type Node = { parentElement: Node | null; scrollTop: number; blocked: boolean };

test('long inbox lists permit pull-to-refresh at the top', () => {
  withScrollTarget((target) => {
    expect(canStartPullToRefresh(target as unknown as EventTarget, 0)).toBe(true);
  });
});

test('scrolling an inbox list prevents pull-to-refresh', () => {
  withScrollTarget((target, list) => {
    list.scrollTop = 1;
    expect(canStartPullToRefresh(target as unknown as EventTarget, 0)).toBe(false);
    list.scrollTop = 0;
    expect(canStartPullToRefresh(target as unknown as EventTarget, 100)).toBe(false);
  });
});

test('message details stay blocked even at the top of a long thread', () => {
  withScrollTarget((target) => {
    target.blocked = true;
    expect(canStartPullToRefresh(target as unknown as EventTarget, 0)).toBe(false);
  });
});