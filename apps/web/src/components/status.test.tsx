import { describe, it, expect } from 'vitest';

import { render } from '@/test/render';
import StatusServer from './status';

describe('StatusServer', () => {
  it('renders the status label and indicator', () => {
    const { getByText } = render(<StatusServer label="ONLINE" status="online" />);

    const label = getByText('ONLINE');
    expect(label).toBeInTheDocument();

    const badge = label.closest('.online');
    expect(badge).not.toBeNull();

    const indicator = badge?.querySelector('span > span');
    expect(indicator).toBeTruthy();
  });
});
