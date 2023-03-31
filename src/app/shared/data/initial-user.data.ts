import {RoutineModel} from '../../models/routine.model'
import {ClubModel} from '../../models/club.model'
import {ClubCombinationModel} from '../../models/club-combination.model'

export const initialClubs: Partial<ClubModel>[] = [

  {
    name: '3 Wood',
    description: 'Longest fairway wood',
    type: 'FairwayWood',
    loft: 15,
    shaft: 'Graphite',
    brand: 'Titleist',
    model: 'TSi1',
    minDistance: 180,
    maxDistance: 250,
    image: '',
    current: true,
  },
  {
    name: '6 Hybrid',
    description: 'Versatile club',
    type: 'Hybrid',
    loft: 26,
    shaft: 'Graphite',
    brand: 'Titleist',
    model: 'TSi1',
    minDistance: 140,
    maxDistance: 200,
    image: '',
    current: true,
  },
  {
    name: '8 Iron',
    description: 'Mid iron',
    type: 'Iron',

    loft: 35,
    shaft: 'Graphite',
    brand: 'Titleist',
    model: 'TSi1',
    minDistance: 100,
    maxDistance: 150,
    image: '',
    current: true,
  },
  {
    name: '54 Degree Wedge',
    description: 'wedge',
    type: 'Wedge',
    loft: 54,
    shaft: 'Graphite',
    brand: 'Titleist',
    model: 'TSi1',
    minDistance: 10,
    maxDistance: 90,
    image: '',
    current: true,
  },
  {
    name: 'Putter',
    description: 'Putter',
    type: 'Putter',
    loft: 0,
    shaft: 'Steel',
    brand: 'Cleveland',
    model: 'Teebird',
    minDistance: 0,
    maxDistance: 40,
    image: '',
    current: true,
  }
];

export const initialClubCombinations: Partial<ClubCombinationModel>[] = [
  {name: 'All Clubs', description: 'All of my clubs', picture: '', clubs: [], current: true}
]

export const initialRoutines: Partial<RoutineModel>[] = [
  {
    name: 'Pre-Shot Routine',
    description: `
      - Stand behind the ball:

      \t- determine swing shape, height, effort, and landing spot
      \t
      \t- a couple of slow practice swings with the swing shape you and effort
      \t
      \t- relax and remember your most excellent shot with this club
      \t
      \t- pick out a target to get set up on

      - Set up to your target

      - Remember the swing shape and effort and waggle accordingly

      - Relax and start the swing`,
    type: 'PreShot',
    current: true,
  },
  {
    name: 'Post-Shot Routine',
    description: `

      - No judgement!

      - Was there an issue with the swing?

      - Was there something really good with the swing?

      - Document
    `,
    type: 'PostShot',
    current: true,
  },
  {
    name: 'Pre-Hole Routine',
    description: `

      - What is par on this hole? Why?

      - Lay out your plan for getting par… where are your shots going to go?

      - Stretch while you look around and appreciate:

      - you are playing golf

      - you are with good people

      - even cow pastures are beautiful!

      - Ask a question to one of your partners… get them talking about themselves… document when you get a chance… :)

      - Where do you tee from?

      - Plan your first shot…
    `,
    type: 'PreHole',
    current: true,
  },
  {
    id: '4',
    name: 'Post-Hole Routine',
    description: `

    - No judgement!

    - What went well with the strategy?

    - What can you learn from the hole

    - Score and it’s relation to your par

    - Anything to work on for next time on this hole?

    - Did you help someone else or be a good parter?

    - Did you appreciate and be grateful?
    `,
    type: 'PostHole',
    current: true,
  },
]
