export const RECIPE_PHOTOS: Record<string, {
  name: string;
  attributionUrl?: string;
  position?: string;
  smallWidth: number;
  small: string;
  large: string;
  width: number;
  height: number;
  author: string;
  source: string;
  license: string;
  licenseUrl: string;
}> = {
  'rau-muong-xao': {
    name: 'Rau muống xào tỏi',
    smallWidth: 480,
    small: new URL('./assets/recipes/rau-muong-xao-480.webp', import.meta.url).href,
    large: new URL('./assets/recipes/rau-muong-xao-960.webp', import.meta.url).href,
    width: 960,
    height: 720,
    author: 'Andy Wright',
    source: 'https://commons.wikimedia.org/wiki/File:Rau_mu%E1%BB%91ng_x%C3%A0o_t%E1%BB%8Fi.jpg',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/'
  },
  'thit-kho-trung': {
    name: 'Thịt kho trứng',
    position: '50% 78%',
    smallWidth: 480,
    small: new URL('./assets/recipes/thit-kho-trung-480.webp', import.meta.url).href,
    large: new URL('./assets/recipes/thit-kho-trung-678.webp', import.meta.url).href,
    width: 678,
    height: 1023,
    author: 'HungryHuy',
    source: 'https://www.flickr.com/photos/142284085@N06/40779385193/',
    attributionUrl: 'https://www.hungryhuy.com/how-to-make-thit-heo-kho-voi-trung-vietnamese-braised-pork-with-hard-boiled-eggs/',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/'
  },
  'dau-hu-nhoi-thit-sot-ca': {
    name: 'Đậu hũ dồn thịt sốt cà chua',
    position: '50% 78%',
    smallWidth: 480,
    small: new URL('./assets/recipes/dau-hu-nhoi-thit-480.webp', import.meta.url).href,
    large: new URL('./assets/recipes/dau-hu-nhoi-thit-533.webp', import.meta.url).href,
    width: 533,
    height: 800,
    author: 'HungryHuy',
    source: 'https://www.flickr.com/photos/142284085@N06/46956611564/',
    attributionUrl: 'https://www.hungryhuy.com/pork-stuffed-tofu-in-tomato-sauce/',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/'
  }
};
