import { render } from '@/test/render';

import HealthAssistantPage from './HealthAssistantPage';

describe('HealthAssistantPage', () => {
  const session = { isAuthenticated: true, userId: 'user-1' };

  it('renders heading and description when authenticated', () => {
    const { getByText } = render(<HealthAssistantPage session={session} />);

    expect(getByText(/Multi-experts Corevia/i)).toBeInTheDocument();
    expect(getByText(/Profil actif/i)).toBeInTheDocument();
  });

  it('renders nothing when not authenticated', () => {
    const { queryByText } = render(<HealthAssistantPage session={null} />);
    expect(queryByText(/Multi-experts Corevia/i)).not.toBeInTheDocument();
  });
});
