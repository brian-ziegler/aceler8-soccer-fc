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
  { src: '/hero/3323.jpg',    width: 1620, height: 1080 },
  { src: '/hero/3324.jpg',    width: 1620, height: 1080 },
  { src: '/hero/3325.jpg',    width: 6000, height: 4000 },
  { src: '/hero/3326.jpg',    width: 6000, height: 4000 },
  { src: '/hero/3327.jpg',    width: 6000, height: 4000 },
  { src: '/hero/3328.jpg',    width: 6000, height: 4000 },
  { src: '/hero/3329.jpg',    width: 6000, height: 4000 },
  { src: '/hero/3330.jpg',    width: 6000, height: 4000 },
  { src: '/hero/3331.jpg',    width: 6000, height: 4000 },
  { src: '/hero/3332.jpg',    width: 6000, height: 4000 },
  { src: '/hero/3333.jpg',    width: 6000, height: 4000 },
  { src: '/hero/action-2.png', width: 1023, height: 1537 },
  { src: '/hero/action-6.png', width: 1023, height: 1537 },
];
