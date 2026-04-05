export type Coach = {
  slug: string;
  name: string;
  role: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
  /** Short card blurb */
  summary: string;
  bio: string[];
  credentials?: string[];
};

export const coaches: Coach[] = [
  {
    slug: 'connally-edozien',
    name: 'Connally Edozien',
    role: 'Head of Academy',
    title: 'Founder · Professional playing background',
    imageSrc: '/coaches/connally.jpg',
    imageAlt: 'Connally Edozien — Head of Academy, Aceler8 Soccer FC',
    summary:
      'Former professional player bringing MLS and European experience to player development.',
    bio: [
      'Connally Edozien is a former professional soccer player and founder of Aceler8 Soccer. Born in Lagos, Nigeria, and raised in London, he moved to the United States to attend Embry–Riddle Aeronautical University, where he became an All-American, a two-time Florida Sun Conference Player of the Year, and the school’s all-time leading scorer.',
      'Connally’s professional career took him to Germany, France, and Major League Soccer with the New England Revolution, giving him first-hand experience at the highest levels of the game.',
      'Today, he brings that expertise to developing the next generation of players, focusing on technical skill, tactical awareness, and mental resilience. Connally is dedicated to helping athletes maximize their potential on and off the field.',
    ],
    credentials: [
      'Former MLS — New England Revolution',
      'Professional experience — Germany, France',
      'NCAA All-American, Embry–Riddle Aeronautical University',
    ],
  },
  {
    slug: 'betsy-jones',
    name: 'Betsy Jones',
    role: 'Assistant Coach',
    title: 'Youth development · Fundamentals & character',
    imageSrc: '/coaches/betsy.jpg',
    imageAlt: 'Betsy Jones — Assistant Coach, Aceler8 Soccer FC',
    summary:
      'Known for deep knowledge of the game and an ability to help every player grow with confidence.',
    bio: [
      'Coach Betsy is a dedicated and inspiring youth soccer coach who has made an incredible impact on every player she works with. Known for her deep knowledge of the game and years of experience, she has a unique ability to bring out the best in each child, helping them grow not just as athletes but as confident individuals.',
      'Her coaching style blends expert skill development with genuine care, creating a supportive environment where children feel encouraged and motivated to succeed. Betsy’s focus on the fundamentals, teamwork, and personal growth ensures that her players gain the tools they need to excel in soccer now and in the future.',
      'Her passion and commitment continually shape young athletes into driven, respectful, and skilled players ready to thrive on and off the field.',
    ],
    credentials: ['Youth soccer — multi-year coaching experience'],
  },
  {
    slug: 'carmen-stagnitta',
    name: 'Carmen Stagnitta',
    role: 'Assistant Coach',
    title: 'Educator · U.S. Soccer licensed',
    imageSrc: '/coaches/carmen.jpg',
    imageAlt: 'Carmen Stagnitta — Assistant Coach, Aceler8 Soccer FC',
    summary:
      'Educator and licensed coach emphasizing long-term development and player-centered training.',
    bio: [
      'Carmen Stagnitta is an educator and youth soccer coach with over 14 years of classroom experience and 5 years in coaching. He integrates his background in education to create structured, engaging, and inclusive training environments where players can learn, grow, and enjoy the game.',
      'Carmen holds his U.S. Soccer Grassroots 9v9 and 11v11 Licenses, as well as his U.S. Soccer D License, reflecting his commitment to high-quality player development.',
      'He emphasizes a player-centered approach, encouraging decision-making, creativity, and ownership through play-practice-play sessions with clear objectives and opportunities for growth. Carmen prioritizes long-term development over short-term results, helping players learn from mistakes while building confidence, accountability, and teamwork.',
      'Passionate about developing the next generation of players, he designs purposeful training sessions that balance fun with challenge, supporting each athlete’s growth both on and off the field.',
    ],
    credentials: [
      'U.S. Soccer D License',
      'U.S. Soccer Grassroots 9v9 & 11v11',
    ],
  },
];

export function getCoachBySlug(slug: string): Coach | undefined {
  return coaches.find((c) => c.slug === slug);
}
