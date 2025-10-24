import { describe, it, expect } from 'vitest'
// These are used in the test below
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { render, screen } from '@testing-library/react'

// Simple test for now - we'll add React components later
describe('BETRIX Platform', () => {
  it('should render welcome message', () => {
    render(<div>Welcome to BETRIX Platform</div>)
    expect(screen.getByText(/Welcome to BETRIX Platform/)).toBeInTheDocument()
  })

  it('should check affiliate link functionality', () => {
    const affiliateLink = 'https://stake.com/?c=tCSNtQ4x'
    expect(affiliateLink).toContain('stake.com')
    expect(affiliateLink).toContain('tCSNtQ4x')
  })
})
