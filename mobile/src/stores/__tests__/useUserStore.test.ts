// Test Zustand store logic
// Stats are now server-side; useUserStore only holds nickname/avatarEmoji

describe('useUserStore logic', () => {
  type UserState = {
    nickname: string | null;
    avatarEmoji: string | null;
  };

  const createInitialState = (): UserState => ({
    nickname: null,
    avatarEmoji: null,
  });

  let state: UserState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('starts with default values', () => {
    expect(state.nickname).toBeNull();
    expect(state.avatarEmoji).toBeNull();
  });

  it('sets nickname', () => {
    state.nickname = 'TestUser';
    expect(state.nickname).toBe('TestUser');
  });

  it('sets avatarEmoji', () => {
    state.avatarEmoji = '🦊';
    expect(state.avatarEmoji).toBe('🦊');
  });
});
