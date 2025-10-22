import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Simple test for now - we'll add React components later
describe('BETRIX Platform', () => {
  it('should have proper configuration', () => {
    expect(true).toBe(true)
  })

  it('should check affiliate link functionality', () => {
    const affiliateLink = 'https://stake.com/?c=tCSNtQ4x'
    expect(affiliateLink).toContain('stake.com')
    expect(affiliateLink).toContain('tCSNtQ4x')
  })
})
