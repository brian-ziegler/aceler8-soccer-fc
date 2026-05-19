export interface HeroSlide {
  /** Path to the image inside /public */
  src: string;
  width: number;
  height: number;
  /** Small tag above the title, e.g. "Player Spotlight" */
  heading?: string;
  /** Large headline, e.g. "#19 Payton Ziegler" */
  title?: string;
  /** One-line description below the title, e.g. "See more about Payton" */
  description?: string;
  /** Optional CTA button */
  button?: {
    label: string;
    href: string;
  };
}

export const heroSlides: HeroSlide[] = [
  {
    src: '/images/3323.jpg',
    width: 1620,
    height: 1080,
    heading: 'Player Spotlight',
    title: '#19 Payton Ziegler',
    description: 'See more about Payton',
    button: { label: 'View Profile', href: '/players/payton-ziegler/' },
  },
  {
    src: '/images/action-2.png',
    width: 1023,
    height: 1537,
  },
  {
    src: '/images/action-3.png',
    width: 1023,
    height: 1537,
    heading: 'Fall 2026',
    title: 'Elite Program',
    button: { label: 'Learn More', href: '/programs/#elite' },
  },
  {
    src: '/images/action-4.png',
    width: 1023,
    height: 1537,
  },
  {
    src: '/images/action-5.png',
    width: 1023,
    height: 1537,
    heading: 'Development',
    title: 'Pathway Program',
    button: { label: 'Get Started', href: '/programs/#pathway' },
  },
  {
    src: '/images/action-6.png',
    width: 1023,
    height: 1537,
  },
  {
    src: '/images/action-7.jpg',
    width: 4000,
    height: 6000,
  },
  {
    src: '/images/action-8.jpg',
    width: 1080,
    height: 1620,
  },
];
