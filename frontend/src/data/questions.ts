export interface GeographyLevel {
  label: string;
  name: string;
  image: string;
  placeholder: string;
  aliases?: string[];
}

export interface RoundData {
  id: number;
  country: GeographyLevel;
  state: GeographyLevel;
  district: GeographyLevel;
  city: GeographyLevel;
}

export type StageKey = 'COUNTRY' | 'STATE' | 'DISTRICT' | 'CITY';

export const ROUNDS_DATA: RoundData[] = [
  {
    id: 1,
    country: {
      label: 'Country',
      name: 'Mozambique',
      image: '/images/geoguesser/1-country.jpg',
      placeholder: 'Enter country name',
      aliases: ['Republic of Mozambique', 'Moçambique']
    },
    state: {
      label: 'State / Region',
      name: 'Niassa',
      image: '/images/geoguesser/1-state.jpg',
      placeholder: 'Enter state or region',
      aliases: ['Niassa Province']
    },
    district: {
      label: 'District',
      name: 'Lago District',
      image: '/images/geoguesser/1-district.jpg',
      placeholder: 'Enter district',
      aliases: ['Lago', 'Distrito de Lago']
    },
    city: {
      label: 'City',
      name: 'Metangula',
      image: '/images/geoguesser/1-city.jpg',
      placeholder: 'Enter city',
      aliases: ['Vila de Metangula']
    }
  },
  {
    id: 2,
    country: {
      label: 'Country',
      name: 'Georgia',
      image: '/images/geoguesser/2-country.jpg',
      placeholder: 'Enter country name',
      aliases: ['Sakartvelo']
    },
    state: {
      label: 'State / Region',
      name: 'Racha-Lechkhumi',
      image: '/images/geoguesser/2-state.jpg',
      placeholder: 'Enter state or region',
      aliases: ['Racha-Lechkhumi and Kvemo Svaneti', 'Racha Lechkhumi', 'Racha']
    },
    district: {
      label: 'District',
      name: 'Ambrolauri Municipality',
      image: '/images/geoguesser/2-district.jpg',
      placeholder: 'Enter district',
      aliases: ['Ambrolauri', 'Ambrolauri District']
    },
    city: {
      label: 'City',
      name: 'Nikortsminda',
      image: '/images/geoguesser/2-city.jpg',
      placeholder: 'Enter city',
      aliases: ['Nikortsminda Village']
    }
  },
  {
    id: 3,
    country: {
      label: 'Country',
      name: 'Ethiopia',
      image: '/images/geoguesser/3-country.jpg',
      placeholder: 'Enter country name',
      aliases: ['Federal Democratic Republic of Ethiopia']
    },
    state: {
      label: 'State / Region',
      name: 'Afar Region',
      image: '/images/geoguesser/3-state.jpg',
      placeholder: 'Enter state or region',
      aliases: ['Afar', 'Afar State']
    },
    district: {
      label: 'District',
      name: 'Zone 2 (Kilbati Rasu)',
      image: '/images/geoguesser/3-district.jpg',
      placeholder: 'Enter district',
      aliases: ['Zone 2', 'Kilbati Rasu', 'Kilbati Rasu Zone', 'Zone 2 Kilbati Rasu']
    },
    city: {
      label: 'City',
      name: 'Dallol',
      image: '/images/geoguesser/3-city.jpg',
      placeholder: 'Enter city',
      aliases: ['Danakil Dallol']
    }
  },
  {
    id: 4,
    country: {
      label: 'Country',
      name: 'Bhutan',
      image: '/images/geoguesser/4-country.jpg',
      placeholder: 'Enter country name',
      aliases: ['Kingdom of Bhutan', 'Druk Yul']
    },
    state: {
      label: 'State / Region',
      name: 'Lhuntse',
      image: '/images/geoguesser/4-state.jpg',
      placeholder: 'Enter state or region',
      aliases: ['Lhuntse District', 'Lhuentse', 'Lhuntse Dzongkhag', 'Lhuentse Dzongkhag']
    },
    district: {
      label: 'District',
      name: 'Jarey Gewog',
      image: '/images/geoguesser/4-district.jpg',
      placeholder: 'Enter district',
      aliases: ['Jarey', 'Jarey Block']
    },
    city: {
      label: 'City',
      name: 'Lhuntse Dzong',
      image: '/images/geoguesser/4-city.jpg',
      placeholder: 'Enter city',
      aliases: ['Lhuntse', 'Lhuentse Dzong']
    }
  },
  {
    id: 5,
    country: {
      label: 'Country',
      name: 'Colombia',
      image: '/images/geoguesser/5-country.jpg',
      placeholder: 'Enter country name',
      aliases: ['Republic of Colombia']
    },
    state: {
      label: 'State / Region',
      name: 'Boyacá',
      image: '/images/geoguesser/5-state.jpg',
      placeholder: 'Enter state or region',
      aliases: ['Boyaca', 'Departamento de Boyaca']
    },
    district: {
      label: 'District',
      name: 'Provincia del Norte',
      image: '/images/geoguesser/5-district.jpg',
      placeholder: 'Enter district',
      aliases: ['Norte Province', 'Northern Province', 'Norte', 'Provincia de Norte']
    },
    city: {
      label: 'City',
      name: 'Soatá',
      image: '/images/geoguesser/5-city.jpg',
      placeholder: 'Enter city',
      aliases: ['Soata']
    }
  }
];

export const PLAYFUL_WRONG_MESSAGES = [
  "Not quite. Try again.",
  "Close, but not there yet.",
  "Keep exploring. Try again.",
  "Not quite right. Give it another shot.",
  "Almost, keep searching!",
  "Not this location. Try again."
];

