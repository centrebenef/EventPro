export type SupportedLocale = 'fr' | 'en' | 'ar';

export const TRANSLATIONS: Record<
  SupportedLocale,
  {
    brand: string;
    slogan: string;
    nav: {
      home: string;
      services: string;
      venues: string;
      photographers: string;
      catering: string;
      dj: string;
      decor: string;
      organisation: string;
      realizations: string;
      contact: string;
      login: string;
      register: string;
      buildEvent: string;
    };
    currency: string;
    city: string;
  }
> = {
  fr: {
    brand: 'EVENT PRO',
    slogan: "Chaque événement mérite d'être exceptionnel",
    nav: {
      home: 'Accueil',
      services: 'Nos prestations',
      venues: 'Salles de réception',
      photographers: 'Photographes',
      catering: 'Traiteurs',
      dj: 'DJ & Animation',
      decor: 'Décoration',
      organisation: 'Organisation',
      realizations: 'Nos réalisations',
      contact: 'Contact',
      login: 'Connexion',
      register: 'Inscription',
      buildEvent: 'Organiser mon événement',
    },
    currency: 'DH',
    city: 'Casablanca',
  },
  en: {
    brand: 'EVENT PRO',
    slogan: 'Every event deserves to be exceptional',
    nav: {
      home: 'Home',
      services: 'Services',
      venues: 'Venues',
      photographers: 'Photographers',
      catering: 'Catering',
      dj: 'DJ & Entertainment',
      decor: 'Decoration',
      organisation: 'Planning',
      realizations: 'Portfolio',
      contact: 'Contact',
      login: 'Sign in',
      register: 'Sign up',
      buildEvent: 'Plan my event',
    },
    currency: 'MAD',
    city: 'Casablanca',
  },
  ar: {
    brand: 'EVENT PRO',
    slogan: 'كل مناسبة تستحق أن تكون استثنائية',
    nav: {
      home: 'الرئيسية',
      services: 'خدماتنا',
      venues: 'قاعات الحفلات',
      photographers: 'المصورون',
      catering: 'تموين الحفلات',
      dj: 'الدي جي والتنشيط',
      decor: 'الديكور',
      organisation: 'تنظيم كامل',
      realizations: 'إنجازاتنا',
      contact: 'اتصل بنا',
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      buildEvent: 'نظم مناسبتي',
    },
    currency: 'درهم',
    city: 'الدار البيضاء',
  },
};
