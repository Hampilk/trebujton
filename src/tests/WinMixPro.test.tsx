import { render,screen } from '@testing-library/react';
import { describe,it,expect } from 'vitest';

import * as WINMIXPRO from '../../winmixpro';

describe('WinMixPro UI Kit exports availability', () => {
  it('should export required component primitives', () => {
    expect(WINMIXPRO).toHaveProperty('AdminLayout');
    expect(WINMIXPRO).toHaveProperty('Header');
    expect(WINMIXPRO).toHaveProperty('Sidebar');
    expect(WINMIXPRO).toHaveProperty('MobileMenu');
    expect(WINMIXPRO).toHaveProperty('LayoutGrid');
    expect(WINMIXPRO).toHaveProperty('GridCell');
    expect(WINMIXPRO).toHaveProperty('GlassCard');
    expect(WINMIXPRO).toHaveProperty('MetricPill');
    expect(WINMIXPRO).toHaveProperty('SectionTitle');
    expect(WINMIXPRO).toHaveProperty('StatCard');
  });
});
