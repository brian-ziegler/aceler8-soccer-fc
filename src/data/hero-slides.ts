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

export const heroSlides: HeroSlide[] = [
  { 
    src: '/hero/raw/3323.jpg', 
    width: 1620, height: 1080, 
  },
  { 
    src: '/hero/raw/3343-web.jpg',
    width: 1620, height: 1080, 
    title: 'The Family',
  },
  { 
    src: '/hero/raw/3335-web.jpg',
    width: 1620, height: 1080, 
  },
  { 
    src: '/hero/raw/3339-landscape.jpg', 
    width: 1620, height: 1080, 
    heading: 'Player Spotlight',
    title: 'Lauren Hoenk, Midfielder 16',
    buttons: [{ label: 'Player Info', href: '/players/lauren-hoenk/' }],
  },
  { 
    src: '/hero/raw/3329-web.jpg',
    width: 1620, height: 1080, 
  },
  { 
    src: '/hero/raw/3337-landscape.jpg', 
    width: 1620, height: 1080, 
    heading: 'Player Spotlight',
    title: 'Payton Ziegler, Goal Keeper 19',
    buttons: [{ label: 'Player Info', href: '/players/payton-ziegler/' }],
  },
  { 
    src: '/hero/raw/3325-landscape.jpg', 
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
    src: '/hero/raw/3347-web.jpg',
    width: 1620, height: 1080, 
    title: 'Celebrating',
  },
  { 
    src: '/hero/raw/3341-web.jpg',
    width: 1620, height: 1080, 
    heading: 'Player Spotlight', 
    title: 'Olivia Norselli, Forward 23',
    buttons: [{ label: 'Player Info', href: '/players/olivia-norselli/' }],
  },
  { 
    src: '/hero/raw/3346-web.jpg',
    width: 1620, height: 1080, 
  },
  { 
    src: '/hero/raw/3340-landscape-web.jpg',
    width: 1620, height: 1080, 
    heading: 'Player Spotlight', 
    title: 'Ellie Seaman, Forward / Mid-fielder 18',
    buttons: [{ label: 'Player Info', href: '/players/ellie-seaman/' }],
  },
  { 
    src: '/hero/raw/3336-web.jpg',
    width: 1620, height: 1080, 
  },
  { 
    src: '/hero/raw/adrianna.jpg', 
    width: 1620, height: 1080, 
    heading: 'Player Spotlight', 
    title: 'Adrianna Hauck, Forward / Mid-fielder 20',
    buttons: [{ label: 'Player Info', href: '/players/adrianna-hauck/' }],
  },
  // { 
  //   src: '/hero/raw/3348.jpg', 
  //   width: 1620, height: 1080, 
  // },
  { 
    src: '/hero/raw/bryn.jpg', 
    width: 1620, height: 1080, 
    heading: 'Player Spotlight', 
    title: 'Bryn Ingraham, Forward 1',
    buttons: [{ label: 'Player Info', href: '/players/bryn-ingraham/' }],
  },
];
