/**
 * Food catalogue that ships with the app, weighted towards Pakistani home
 * cooking rather than a Western database that has never heard of nihari.
 *
 * Calories and protein are per the stated serving and are good estimates, not
 * lab values - home portions vary by cook and by oil. Being consistently within
 * ~15% is what makes the weekly trend trustworthy; chasing exactness is wasted
 * effort.
 *
 * `aliases` exist so typing "anda", "chawal" or "doodh" finds the right row.
 */

export type CatalogFood = {
  name: string;
  kcal: number;
  proteinG: number;
  serving: string;
  category: string;
  aliases?: string;
};

export const FOOD_CATALOG: CatalogFood[] = [
  // Breads and grains
  { name: 'Roti / Chapati', kcal: 120, proteinG: 3.5, serving: '1 medium', category: 'Bread', aliases: 'roti chapati phulka' },
  { name: 'Paratha (plain)', kcal: 260, proteinG: 5, serving: '1 piece', category: 'Bread', aliases: 'paratha parantha' },
  { name: 'Aloo Paratha', kcal: 300, proteinG: 6, serving: '1 piece', category: 'Bread', aliases: 'aloo alu potato paratha' },
  { name: 'Naan', kcal: 260, proteinG: 8, serving: '1 piece', category: 'Bread', aliases: 'naan nan' },
  { name: 'Bread slice', kcal: 75, proteinG: 2.5, serving: '1 slice', category: 'Bread', aliases: 'double roti bread' },
  { name: 'Rusk / Cake Rusk', kcal: 110, proteinG: 2, serving: '1 piece', category: 'Bread', aliases: 'rusk toast' },
  { name: 'Rice (boiled)', kcal: 200, proteinG: 4, serving: '1 cup', category: 'Grains', aliases: 'chawal rice bhat' },
  { name: 'Pulao', kcal: 280, proteinG: 6, serving: '1 cup', category: 'Grains', aliases: 'pulao pilaf yakhni' },
  { name: 'Chicken Biryani', kcal: 600, proteinG: 30, serving: '1 plate', category: 'Grains', aliases: 'biryani biriyani murgh' },
  { name: 'Beef Biryani', kcal: 650, proteinG: 32, serving: '1 plate', category: 'Grains', aliases: 'biryani beef gosht' },

  // Eggs and meat
  { name: 'Egg (boiled)', kcal: 78, proteinG: 6.3, serving: '1 egg', category: 'Protein', aliases: 'anda egg ubla' },
  { name: 'Egg (fried)', kcal: 90, proteinG: 6.5, serving: '1 egg', category: 'Protein', aliases: 'anda fry egg' },
  { name: 'Omelette (2 eggs)', kcal: 220, proteinG: 13, serving: '1 omelette', category: 'Protein', aliases: 'anda omelette' },
  { name: 'Chicken Karahi', kcal: 400, proteinG: 35, serving: '1 serving', category: 'Protein', aliases: 'karahi kadai murgh chicken' },
  { name: 'Chicken Curry (salan)', kcal: 300, proteinG: 25, serving: '1 cup', category: 'Protein', aliases: 'salan curry murgh chicken' },
  { name: 'Chicken Tikka', kcal: 260, proteinG: 28, serving: '1 piece', category: 'Protein', aliases: 'tikka chicken bbq' },
  { name: 'Chicken Roast (leg)', kcal: 280, proteinG: 30, serving: '1 leg', category: 'Protein', aliases: 'roast chicken leg' },
  { name: 'Beef Nihari', kcal: 450, proteinG: 32, serving: '1 bowl', category: 'Protein', aliases: 'nihari beef gosht' },
  { name: 'Haleem', kcal: 350, proteinG: 18, serving: '1 bowl', category: 'Protein', aliases: 'haleem daleem' },
  { name: 'Qeema (mince)', kcal: 380, proteinG: 28, serving: '1 cup', category: 'Protein', aliases: 'qeema keema mince' },
  { name: 'Aloo Gosht', kcal: 350, proteinG: 22, serving: '1 cup', category: 'Protein', aliases: 'aloo gosht meat potato' },
  { name: 'Seekh Kebab', kcal: 150, proteinG: 12, serving: '1 kebab', category: 'Protein', aliases: 'kebab kabab seekh' },
  { name: 'Chapli Kebab', kcal: 300, proteinG: 18, serving: '1 kebab', category: 'Protein', aliases: 'chapli kebab kabab' },
  { name: 'Fish (fried)', kcal: 250, proteinG: 22, serving: '1 piece', category: 'Protein', aliases: 'fish machli fried' },

  // Lentils and vegetables
  { name: 'Daal Chana', kcal: 220, proteinG: 12, serving: '1 cup', category: 'Lentils', aliases: 'daal dal chana lentil' },
  { name: 'Daal Masoor', kcal: 180, proteinG: 11, serving: '1 cup', category: 'Lentils', aliases: 'daal dal masoor lentil' },
  { name: 'Daal Mash', kcal: 200, proteinG: 12, serving: '1 cup', category: 'Lentils', aliases: 'daal dal mash urad' },
  { name: 'Chana Chaat', kcal: 250, proteinG: 11, serving: '1 cup', category: 'Lentils', aliases: 'chana chole chaat' },
  { name: 'Chole', kcal: 270, proteinG: 12, serving: '1 cup', category: 'Lentils', aliases: 'chole chickpea chana' },
  { name: 'Mixed Sabzi', kcal: 150, proteinG: 4, serving: '1 cup', category: 'Vegetables', aliases: 'sabzi vegetable curry' },
  { name: 'Palak Paneer', kcal: 270, proteinG: 14, serving: '1 cup', category: 'Vegetables', aliases: 'palak paneer spinach' },
  { name: 'Bhindi', kcal: 160, proteinG: 3, serving: '1 cup', category: 'Vegetables', aliases: 'bhindi okra' },
  { name: 'Salad', kcal: 50, proteinG: 2, serving: '1 bowl', category: 'Vegetables', aliases: 'salad kachumar' },

  // Dairy
  { name: 'Milk (full fat)', kcal: 150, proteinG: 8, serving: '1 glass (250ml)', category: 'Dairy', aliases: 'doodh milk' },
  { name: 'Yogurt / Dahi', kcal: 150, proteinG: 8, serving: '1 cup', category: 'Dairy', aliases: 'dahi yogurt curd' },
  { name: 'Raita', kcal: 100, proteinG: 5, serving: '1 cup', category: 'Dairy', aliases: 'raita dahi' },
  { name: 'Lassi (sweet)', kcal: 200, proteinG: 6, serving: '1 glass', category: 'Dairy', aliases: 'lassi sweet doodh' },
  { name: 'Paneer', kcal: 265, proteinG: 18, serving: '100 g', category: 'Dairy', aliases: 'paneer cheese' },
  { name: 'Cheese slice', kcal: 70, proteinG: 4, serving: '1 slice', category: 'Dairy', aliases: 'cheese slice' },
  { name: 'Butter', kcal: 100, proteinG: 0.1, serving: '1 tbsp', category: 'Fats', aliases: 'butter makhan' },
  { name: 'Desi Ghee', kcal: 120, proteinG: 0, serving: '1 tbsp', category: 'Fats', aliases: 'ghee desi' },

  // Snacks
  { name: 'Samosa', kcal: 260, proteinG: 5, serving: '1 piece', category: 'Snacks', aliases: 'samosa samosay' },
  { name: 'Pakora', kcal: 300, proteinG: 7, serving: '100 g', category: 'Snacks', aliases: 'pakora pakoray fritter' },
  { name: 'Spring Roll', kcal: 150, proteinG: 4, serving: '1 piece', category: 'Snacks', aliases: 'roll spring' },
  { name: 'French Fries', kcal: 340, proteinG: 4, serving: '1 medium', category: 'Snacks', aliases: 'fries chips' },
  { name: 'Potato Chips', kcal: 150, proteinG: 2, serving: '1 small packet', category: 'Snacks', aliases: 'chips crisps lays' },
  { name: 'Biscuit', kcal: 50, proteinG: 0.7, serving: '1 biscuit', category: 'Snacks', aliases: 'biscuit cookie' },
  { name: 'Shawarma', kcal: 450, proteinG: 25, serving: '1 roll', category: 'Fast food', aliases: 'shawarma shwarma roll' },
  { name: 'Chicken Burger', kcal: 450, proteinG: 25, serving: '1 burger', category: 'Fast food', aliases: 'burger chicken' },
  { name: 'Beef Burger', kcal: 500, proteinG: 28, serving: '1 burger', category: 'Fast food', aliases: 'burger beef' },
  { name: 'Pizza slice', kcal: 285, proteinG: 12, serving: '1 slice', category: 'Fast food', aliases: 'pizza slice' },
  { name: 'Chicken Sandwich', kcal: 350, proteinG: 20, serving: '1 sandwich', category: 'Fast food', aliases: 'sandwich chicken' },

  // Sweets
  { name: 'Gulab Jamun', kcal: 150, proteinG: 2, serving: '1 piece', category: 'Sweets', aliases: 'gulab jamun mithai' },
  { name: 'Jalebi', kcal: 400, proteinG: 3, serving: '100 g', category: 'Sweets', aliases: 'jalebi mithai' },
  { name: 'Kheer', kcal: 250, proteinG: 7, serving: '1 cup', category: 'Sweets', aliases: 'kheer rice pudding' },
  { name: 'Sooji Halwa', kcal: 350, proteinG: 4, serving: '1 cup', category: 'Sweets', aliases: 'halwa halva sooji' },
  { name: 'Ice Cream', kcal: 140, proteinG: 2.5, serving: '1 scoop', category: 'Sweets', aliases: 'ice cream kulfi' },

  // Fruit
  { name: 'Banana', kcal: 105, proteinG: 1.3, serving: '1 medium', category: 'Fruit', aliases: 'banana kela' },
  { name: 'Apple', kcal: 95, proteinG: 0.5, serving: '1 medium', category: 'Fruit', aliases: 'apple saib' },
  { name: 'Mango', kcal: 200, proteinG: 2.8, serving: '1 medium', category: 'Fruit', aliases: 'mango aam' },
  { name: 'Orange', kcal: 62, proteinG: 1.2, serving: '1 medium', category: 'Fruit', aliases: 'orange kinnow malta' },
  { name: 'Dates', kcal: 60, proteinG: 0.5, serving: '3 dates', category: 'Fruit', aliases: 'dates khajoor' },
  { name: 'Grapes', kcal: 104, proteinG: 1.1, serving: '1 cup', category: 'Fruit', aliases: 'grapes angoor' },

  // Nuts and fats
  { name: 'Peanut Butter', kcal: 95, proteinG: 4, serving: '1 tbsp', category: 'Fats', aliases: 'peanut butter' },
  { name: 'Almonds', kcal: 70, proteinG: 2.5, serving: '10 almonds', category: 'Fats', aliases: 'almond badam' },
  { name: 'Walnuts', kcal: 65, proteinG: 1.5, serving: '5 halves', category: 'Fats', aliases: 'walnut akhrot' },
  { name: 'Peanuts', kcal: 170, proteinG: 7.7, serving: '30 g', category: 'Fats', aliases: 'peanut moongphali' },
  { name: 'Cooking Oil', kcal: 120, proteinG: 0, serving: '1 tbsp', category: 'Fats', aliases: 'oil tel' },

  // Drinks
  { name: 'Orange Juice', kcal: 110, proteinG: 1.7, serving: '1 glass', category: 'Drinks', aliases: 'juice orange' },
  { name: 'Mango Shake', kcal: 300, proteinG: 8, serving: '1 glass', category: 'Drinks', aliases: 'shake mango aam' },
  { name: 'Banana Shake', kcal: 350, proteinG: 10, serving: '1 glass', category: 'Drinks', aliases: 'shake banana kela' },
  { name: 'Tea (with milk & sugar)', kcal: 100, proteinG: 3, serving: '1 cup', category: 'Drinks', aliases: 'chai tea doodh patti' },
  { name: 'Coffee (with milk)', kcal: 80, proteinG: 3, serving: '1 cup', category: 'Drinks', aliases: 'coffee' },
  { name: 'Coke / Pepsi', kcal: 139, proteinG: 0, serving: '1 can (330ml)', category: 'Drinks', aliases: 'coke pepsi cola soft drink' },
  { name: 'Water', kcal: 0, proteinG: 0, serving: '1 glass', category: 'Drinks', aliases: 'water pani' },

  // Supplements - relevant to a gain plan
  { name: 'Whey Protein', kcal: 120, proteinG: 24, serving: '1 scoop', category: 'Supplements', aliases: 'whey protein scoop' },
  { name: 'Mass Gainer', kcal: 380, proteinG: 15, serving: '1 scoop', category: 'Supplements', aliases: 'mass gainer weight' },
  { name: 'Protein Shake (whey + milk)', kcal: 280, proteinG: 30, serving: '1 glass', category: 'Supplements', aliases: 'protein shake whey doodh' },
];
