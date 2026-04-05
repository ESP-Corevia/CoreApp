import { describe, expect, it, vi } from 'vitest';

const childMock = vi.fn();
const loggerMock = {
  child: childMock,
};

vi.mock('../lib/logger', () => ({
  logger: loggerMock,
}));

describe('aiLogger', () => {
  it('creates a child logger scoped to the ai module', async () => {
    const childLogger = { info: vi.fn(), error: vi.fn() };
    childMock.mockReturnValueOnce(childLogger);

    const { aiLogger } = await import('./logger');

    expect(childMock).toHaveBeenCalledWith({ module: 'ai' });
    expect(aiLogger).toBe(childLogger);
  });
});
