import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { JSDOM } from 'jsdom'

describe('BETRIX Platform - HTML Tests', () => {
  let dom
  let document

  beforeAll(() => {
    const html = readFileSync('./index.html', 'utf-8')
    dom = new JSDOM(html)
    document = dom.window.document
  })

  it('should have the correct page title', () => {
    const title = document.querySelector('title')
    expect(title.textContent).toContain('BETRIX')
  })

  it('should have affiliate links with correct codes', () => {
    const links = document.querySelectorAll('a')
    const affiliateLinks = Array.from(links).filter(link => 
      link.href.includes('stake.com') && link.href.includes('tCSNtQ4x')
    )
    expect(affiliateLinks.length).toBeGreaterThan(0)
  })

  it('should have revenue sections', () => {
    const revenueElements = document.querySelectorAll('.revenue-box, .cta-button')
    expect(revenueElements.length).toBeGreaterThan(0)
  })

  it('should have proper meta tags', () => {
    const metaDescription = document.querySelector('meta[name="description"]')
    expect(metaDescription).toBeTruthy()
  })
})
