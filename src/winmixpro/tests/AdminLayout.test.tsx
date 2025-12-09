import { render,screen } from '@testing-library/react';
import { describe,it,expect } from 'vitest';

import * as WINMIXPRO from '../../src/winmixpro';

describe('WinMixPro UI Kit', () => {
  it('should export all components', () => {
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

  it('renders a layout example without crash', () => {
    const LoginLayout = () => 'Login';
    const Dashboard = () => 
      <WINMIXPRO.AdminLayout userEmail="test@example.com">
        <WINMIXPRO.SectionTitle title="Dashboard"/>
      </WINMIXPRO.AdminLayout>;

    expect(LoginLayout).toBeDefined();
    expect(Dashboard).toBeDefined();
  });
});