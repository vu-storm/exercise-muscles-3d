// Danh sách động tác hiển thị trong bảng điều khiển, theo nhóm.
//
// kind: 'work'    = cơ đang co (tô đỏ)
//       'stretch' = cơ đang được kéo giãn (tô xanh)
import squat from './squat.js';
import gobletSquat from './gobletSquat.js';
import lunge from './lunge.js';
import rdl from './rdl.js';
import stepUp from './stepUp.js';
import bridge from './bridge.js';
import singleLegBridge from './singleLegBridge.js';
import { calfRaiseStraight, calfRaiseBent } from './calfRaise.js';
import plank from './plank.js';
import sidePlank from './sidePlank.js';
import deadBug from './deadBug.js';
import birdDog from './birdDog.js';
import { aSkip, bSkip, highKnees, buttKicks } from './drills.js';
import { hipFlexorStretch, hamstringStretch, calfStretch } from './stretches.js';

export const CATEGORIES = [
  { id: 'strength', label: 'Sức mạnh thân dưới', kind: 'work' },
  { id: 'core', label: 'Core – ổn định thân', kind: 'work' },
  { id: 'drill', label: 'Khởi động – kỹ thuật chạy', kind: 'work' },
  { id: 'stretch', label: 'Giãn cơ', kind: 'stretch' },
];

export const EXERCISES = [
  squat,
  gobletSquat,
  lunge,
  rdl,
  stepUp,
  bridge,
  singleLegBridge,
  calfRaiseStraight,
  calfRaiseBent,
  plank,
  sidePlank,
  deadBug,
  birdDog,
  aSkip,
  bSkip,
  highKnees,
  buttKicks,
  hipFlexorStretch,
  hamstringStretch,
  calfStretch,
];
