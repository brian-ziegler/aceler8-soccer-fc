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
    src: '/hero/raw/3323.jpg', 
    width: 1620, height: 1080, 
    // heading: 'Player Spotlight', 
    // title: 'Team Celebration',
    // description: 'Aceler8 celebrates a goal against CSC in the Irondequoit Challenge; May 8th, 2026',
    // button: { label: 'Player Info', href: '' },
  },
  // { 
  //   src: '/hero/raw/3342.jpg', 
  //   width: 1620, height: 1080, 
  //   heading: 'Player Spotlight', 
  //   title: '#10 Sophia Edozien',
  //   button: { label: 'Player Info', href: '/players/sophia-edozien/' },
  // },
  { 
    src: '/hero/raw/3343.jpg', 
    width: 1620, height: 1080, 
    // heading: 'Player Spotlight', 
    title: 'The Family',
    // title: 'Sophia & Natalie',
    // description: 'Planning their next move',
    // button: { label: 'Player Info', href: '/players/olivia-norselli/' },
  },
  { 
    src: '/hero/raw/3335.jpg', 
    width: 1620, height: 1080, 
    // heading: 'Player Spotlight', 
    // title: 'Sophia & Natalie',
    // description: 'Planning their next move',
    // button: { label: 'Player Info', href: '/players/olivia-norselli/' },
  },
  { 
    src: '/hero/raw/3339-landscape.jpg', 
    width: 1620, height: 1080, 
    heading: 'Player Spotlight', 
    title: 'Lauren Hoenk, Midfielder 16',
    button: { label: 'Player Info', href: '/players/lauren-hoenk/' },
  },
  { 
    src: '/hero/raw/3329.jpg', 
    width: 1620, height: 1080, 
    // heading: 'Player Spotlight', 
    // title: 'Sophia & Natalie',
    // description: 'Planning their next move',
    // button: { label: 'Player Info', href: '/players/olivia-norselli/' },
  },
  { 
    src: '/hero/raw/3337-landscape.jpg', 
    width: 1620, height: 1080, 
    heading: 'Player Spotlight', 
    title: 'Payton Ziegler, Goal Keeper 19',
    button: { label: 'Player Info', href: '/players/payton-ziegler/' },
  },
  { 
    src: '/hero/raw/3325-landscape.jpg', 
    width: 1620, height: 1080, 
    heading: 'Player Spotlight', 
    title: 'Natalie Jones, Defender 8 & Sophia Edozien, Mid-fielder 10',
    description: 'Planning their next move',
    // button: { label: 'Player Info', href: '/players/olivia-norselli/' },
  },
  { 
    src: '/hero/raw/3341.jpg', 
    width: 1620, height: 1080, 
    heading: 'Player Spotlight', 
    title: 'Olivia Narselli, Forward 23',
    button: { label: 'Player Info', href: '/players/olivia-norselli/' },
  },
  { 
    src: '/hero/raw/3340-landscape.jpg', 
    width: 1620, height: 1080, 
    heading: 'Player Spotlight', 
    title: 'Ellie Seaman, Forward / Mid-fielder 18',
    button: { label: 'Player Info', href: '/players/ellie-seaman/' },
  },
  // { 
  //   src: '/hero/raw/3332.jpg', 
  //   width: 1620, height: 1080, 
  //   // heading: 'Player Spotlight', 
  //   // title: 'Sophia & Natalie',
  //   // description: 'Planning their next move',
  //   // button: { label: 'Player Info', href: '/players/olivia-norselli/' },
  // },
  { 
    src: '/hero/raw/3336.jpg', 
    width: 1620, height: 1080, 
    // heading: 'Player Spotlight', 
    // title: 'Sophia & Natalie',
    // description: 'Planning their next move',
    // button: { label: 'Player Info', href: '/players/olivia-norselli/' },
  },
  
  // { src: '/hero/3324.jpg',    width: 1620, height: 1080 },
  // { src: '/hero/3325.jpg',    width: 6000, height: 4000 },
  // { src: '/hero/3326.jpg',    width: 6000, height: 4000 },
  // { src: '/hero/3327.jpg',    width: 6000, height: 4000 },
  // { src: '/hero/3328.jpg',    width: 6000, height: 4000 },
  // { src: '/hero/3329.jpg',    width: 6000, height: 4000 },
  // { src: '/hero/3330.jpg',    width: 6000, height: 4000 },
  // { src: '/hero/3331.jpg',    width: 6000, height: 4000 },
  // { src: '/hero/3332.jpg',    width: 6000, height: 4000 },
  // { src: '/hero/3333.jpg',    width: 6000, height: 4000 },
  // { src: '/hero/action-2.png', width: 1023, height: 1537 },
  // { src: '/hero/action-6.png', width: 1023, height: 1537 },
];
