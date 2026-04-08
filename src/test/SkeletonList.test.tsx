import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonList } from '../components/SkeletonList';

describe('SkeletonList', () => {
  it('renders 10 skeleton items', () => {
    const { container } = render(<SkeletonList />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(10);
  });
});
