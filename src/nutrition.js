/* Ingredients for the meal builder. g = per 100 g cooked; pc = per piece/portion. Approximate values. */
const INGREDIENTS = [
  ['Chicken breast (cooked)', 'g', 165, 31], ['Chicken thigh, skinless (cooked)', 'g', 180, 26], ['Tamry roast chicken, skinless', 'g', 190, 27],
  ['Shrimp (cooked)', 'g', 99, 24], ['Bolti / tilapia (grilled)', 'g', 128, 26], ['Bouri / mullet (grilled)', 'g', 150, 25], ['Mackerel (cooked)', 'g', 205, 19],
  ['Tuna, canned in water (1 can drained)', 'pc', 140, 30], ['Sardines, canned (1 can drained)', 'pc', 210, 25],
  ['Egg', 'pc', 72, 6.3], ['Greek yogurt (1 cup, 170 g)', 'pc', 145, 17], ['Cottage cheese', 'g', 98, 11], ['Mozzarella', 'g', 280, 22],
  ['Milk', 'g', 61, 3.2], ['Butter (1 tsp, 5 g)', 'pc', 36, 0], ['Olive oil (1 tbsp)', 'pc', 120, 0], ['Cooking cream (1 tbsp)', 'pc', 50, 0.4],
  ['Basmati rice (cooked)', 'g', 130, 2.7], ['Quinoa (cooked)', 'g', 120, 4.4], ['Ribbon pasta (cooked)', 'g', 158, 5.8], ['Egg or rice noodles (cooked)', 'g', 138, 4.5],
  ['Potato (boiled)', 'g', 87, 1.9], ['Mashed potato with butter', 'g', 113, 2], ['Sweet potato (baked)', 'g', 90, 2],
  ['Tannour bread (half loaf)', 'pc', 170, 6], ['Foul (cooked)', 'g', 110, 7.6], ['Chickpeas (canned)', 'g', 139, 7], ['Red beans (canned)', 'g', 127, 8.7],
  ['White beans (canned)', 'g', 139, 9.7], ['Sweet corn (canned)', 'g', 81, 2.6], ['Peas', 'g', 81, 5.4], ['Green beans', 'g', 31, 1.8],
  ['Lettuce', 'g', 15, 1.4], ['Cucumber', 'g', 15, 0.7], ['Tomato', 'g', 18, 0.9], ['Carrot', 'g', 41, 0.9], ['Zucchini', 'g', 17, 1.2],
  ['Mushrooms', 'g', 22, 3.1], ['Broccoli', 'g', 35, 2.4], ['Spinach', 'g', 23, 2.9], ['Colored peppers', 'g', 26, 1],
  ['Mahshi warak enab (1 piece)', 'pc', 45, 1], ['Tahini (1 tbsp)', 'pc', 89, 2.6], ['Honey (1 tsp)', 'pc', 21, 0], ['Soy sauce (1 tbsp)', 'pc', 9, 1.3],
  ['Banana', 'pc', 105, 1.3], ['Apple', 'pc', 95, 0.5], ['Guava', 'pc', 70, 1], ['Orange', 'pc', 70, 1.3], ['Mandarin', 'pc', 50, 0.8], ['Pear', 'pc', 100, 0.6],
  ['Persimmon', 'pc', 120, 1], ['Pomegranate (half)', 'pc', 115, 2], ['Mango (half)', 'pc', 100, 1.4], ['Fresh dates (3)', 'pc', 70, 0.6], ['Eshta', 'pc', 100, 2],
];
/* The forbidden corner: treats kept out of meal swaps. sugar: counts against the no-sugar habit. */
const FORBIDDEN = [
  {name:'Crème caramel', e:'\u{1F36E}', kcal:150, protein:4, sugar:true},
  {name:'Chocolate Danette', e:'\u{1F36B}', kcal:160, protein:4, sugar:true},
  {name:'Gateau (1 slice)', e:'\u{1F370}', kcal:350, protein:4, sugar:true},
  {name:'Fried chicken (2 pieces)', e:'\u{1F357}', kcal:500, protein:35, sugar:false},
];
