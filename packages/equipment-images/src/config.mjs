// Fixed rules of the imagens-equipamentos contract. Changing a value here
// changes what the skill guarantees, so it is a decision, not a tweak.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const WIDTH = 800;
export const HEIGHT = 600;
export const JPEG_QUALITY = 85;

export const BUCKET = 'equipamentos';

export const EQUIPMENT_FILE = path.join(PACKAGE_DIR, 'equipamentos.json');
// Committed: where each photo came from, who published it and the license.
export const CREDITS_FILE = path.join(PACKAGE_DIR, 'creditos.json');
// Committed: photos rejected in human review, with the reason.
export const REJECTIONS_FILE = path.join(PACKAGE_DIR, 'rejeicoes.json');
// Not committed: prepared 800x600 files and the review sheet.
export const OUT_DIR = path.join(PACKAGE_DIR, 'out');
// Not committed: Pixabay responses, kept 24h as the API terms require.
export const CACHE_DIR = path.join(PACKAGE_DIR, '.cache');
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const PIXABAY_API = 'https://pixabay.com/api/';
export const PIXABAY_LICENSE = {
  nome: 'Pixabay Content License',
  url: 'https://pixabay.com/service/license-summary/',
};
// largeImageURL is scaled to at most this on its longest side (API docs).
export const PIXABAY_LARGE_MAX = 1280;

// Tags that disqualify a photo (image rights: people, brands/logos, text or
// screen content). Matched against Pixabay tags as whole words.
export const BLOCKED_TAGS = [
  // people
  'person', 'people', 'man', 'men', 'woman', 'women', 'girl', 'boy', 'child',
  'children', 'kid', 'kids', 'baby', 'human', 'hand', 'hands', 'finger',
  'fingers', 'face', 'portrait', 'model', 'businessman', 'businesswoman',
  'worker', 'student', 'team', 'lady', 'guy', 'selfie', 'user',
  // brands and logos
  'logo', 'brand', 'apple', 'macbook', 'imac', 'iphone', 'ipad', 'mac',
  'samsung', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'microsoft', 'windows',
  'sony', 'canon', 'nikon', 'fujifilm', 'logitech', 'google', 'facebook',
  'twitter', 'instagram', 'youtube', 'android',
  // text and screen content
  'text', 'typography', 'letter', 'letters', 'word', 'words', 'code',
  'coding', 'programming', 'programmer', 'website', 'webpage', 'web design',
  'app', 'application', 'email', 'chart', 'graph', 'statistics', 'dashboard',
  'social media', 'browser', 'video call', 'meeting', 'news', 'sign',
];

// A candidate must carry at least one tag of its category, to keep
// off-topic photos out (a "hdmi cable" search can return a TV).
export const CATEGORY_TAGS = {
  notebook: ['laptop', 'notebook', 'computer'],
  monitor: ['monitor', 'screen', 'display', 'computer'],
  cabo: ['cable', 'cables', 'hdmi', 'usb', 'ethernet', 'wire', 'cord', 'plug', 'connector'],
  camera: ['camera', 'webcam', 'lens'],
};
