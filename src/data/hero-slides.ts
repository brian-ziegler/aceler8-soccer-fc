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
  /** Optional CTA buttons */
  buttons?: {
    label: string;
    href: string;
  }[];
}

const media = 'https://aceler8-cms-media.s3.us-east-1.amazonaws.com/hero-slides';

export const heroSlides: HeroSlide[] = [
  {
    src: `${media}/1781480861520-3323.jpg`,
    width: 1620, height: 1080,
  },
  {
    src: `${media}/1781480862719-3343-web.jpg`,
    width: 1620, height: 1080,
    title: 'The Family',
  },
  {
    src: `${media}/1781480863744-3335-web.jpg`,
    width: 1620, height: 1080,
  },
  {
    src: `${media}/1781480864406-3339-landscape.jpg`,
    width: 1620, height: 1080,
    heading: 'Player Spotlight',
    title: 'Lauren Hoenk, Midfielder 16',
    buttons: [{ label: 'Player Info', href: '/players/lauren-hoenk/' }],
  },
  {
    src: `${media}/1781480865351-3329-web.jpg`,
    width: 1620, height: 1080,
  },
  {
    src: `${media}/1781480865995-3337-landscape.jpg`,
    width: 1620, height: 1080,
    heading: 'Player Spotlight',
    title: 'Payton Ziegler, Goal Keeper 19',
    buttons: [{ label: 'Player Info', href: '/players/payton-ziegler/' }],
  },
  {
    src: `${media}/1781480867639-3325-landscape.jpg`,
    width: 1620, height: 1080,
    heading: 'Player Spotlight',
    title: 'Natalie Jones, Defender 8 & Sophia Edozien, Mid-fielder 10',
    description: 'Planning their next move',
    buttons: [
      { label: 'Natalie Jones', href: '/players/natalie-jones/' },
      { label: 'Sophia Edozien', href: '/players/sophia-edozien/' },
    ],
  },
  {
    src: `${media}/1781480869116-3347-web.jpg`,
    width: 1620, height: 1080,
    title: 'Celebrating',
  },
  {
    src: `${media}/1781480870048-3341-web.jpg`,
    width: 1620, height: 1080,
    heading: 'Player Spotlight',
    title: 'Olivia Norselli, Forward 23',
    buttons: [{ label: 'Player Info', href: '/players/olivia-norselli/' }],
  },
  {
    src: `${media}/1781480870920-3346-web.jpg`,
    width: 1620, height: 1080,
  },
  {
    src: `${media}/1781480871468-3340-landscape-web.jpg`,
    width: 1620, height: 1080,
    heading: 'Player Spotlight',
    title: 'Ellie Seaman, Forward / Mid-fielder 18',
    buttons: [{ label: 'Player Info', href: '/players/ellie-seaman/' }],
  },
  {
    src: `${media}/1781480872246-3336-web.jpg`,
    width: 1620, height: 1080,
  },
  {
    src: `${media}/1781480872958-adrianna.jpg`,
    width: 1620, height: 1080,
    heading: 'Player Spotlight',
    title: 'Adrianna Hauck, Forward / Mid-fielder 20',
    buttons: [{ label: 'Player Info', href: '/players/adrianna-hauck/' }],
  },
  {
    src: `${media}/1781480874408-bryn.jpg`,
    width: 1620, height: 1080,
    heading: 'Player Spotlight',
    title: 'Bryn Ingraham, Forward 1',
    buttons: [{ label: 'Player Info', href: '/players/bryn-ingraham/' }],
  },
];
