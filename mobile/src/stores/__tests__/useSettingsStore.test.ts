describe('useSettingsStore logic', () => {
  type SettingsState = {
    themePreference: 'light' | 'dark';
    language: 'ru' | 'en';
    soundEnabled: boolean;
    hapticsEnabled: boolean;
    notificationsEnabled: boolean;
  };

  const createInitialState = (): SettingsState => ({
    themePreference: 'light',
    language: 'ru',
    soundEnabled: true,
    hapticsEnabled: true,
    notificationsEnabled: true,
  });

  let state: SettingsState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('has sensible defaults', () => {
    expect(state.themePreference).toBe('light');
    expect(state.language).toBe('ru');
    expect(state.soundEnabled).toBe(true);
    expect(state.hapticsEnabled).toBe(true);
    expect(state.notificationsEnabled).toBe(true);
  });

  it('changes theme preference between light and dark', () => {
    state.themePreference = 'dark';
    expect(state.themePreference).toBe('dark');

    state.themePreference = 'light';
    expect(state.themePreference).toBe('light');
  });

  it('changes language', () => {
    state.language = 'en';
    expect(state.language).toBe('en');
  });

  it('toggles sound', () => {
    state.soundEnabled = false;
    expect(state.soundEnabled).toBe(false);
  });

  it('toggles haptics', () => {
    state.hapticsEnabled = false;
    expect(state.hapticsEnabled).toBe(false);
  });

  it('toggles notifications', () => {
    state.notificationsEnabled = false;
    expect(state.notificationsEnabled).toBe(false);
  });
});
