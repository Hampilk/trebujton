// Simple MSW server mock for testing
export const server = {
  listen: vi.fn(),
  resetHandlers: vi.fn(),
  close: vi.fn(),
};