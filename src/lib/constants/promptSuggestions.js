/**
 * Prompt Suggestions Constants
 * Quick suggestions for AI chat prompts
 */

export const PROMPT_CHIPS = [
  {
    id: 'find-tea',
    text: 'Find my tea',
    icon: 'Leaf',
    prompt: 'Help me find the perfect tea for my taste preferences',
    category: 'discovery',
  },
  {
    id: 'origin',
    text: 'Learn the story',
    icon: 'MapPin',
    prompt: 'Tell me about Nandi Hills and where Chakancha tea comes from',
    category: 'origin',
  },
  {
    id: 'impact',
    text: 'Living wage',
    icon: 'Heart',
    prompt: 'How does Chakancha ensure living wages for tea pickers?',
    category: 'impact',
  },
  {
    id: 'brewing',
    text: 'Brewing tips',
    icon: 'Sparkles',
    prompt: 'What are the best practices for brewing premium tea?',
    category: 'brewing',
  },
];

export const PROMPT_CATEGORIES = {
  discovery: {
    name: 'Tea Discovery',
    prompts: [
      'Help me find the perfect tea for my taste preferences',
      'What tea would you recommend for a morning boost?',
      'I like fruity flavors, what tea should I try?',
      'What\'s the difference between your black and green teas?',
      'Recommend a tea for relaxation and stress relief',
    ],
  },
  
  origin: {
    name: 'Origin & Story',
    prompts: [
      'Tell me about Nandi Hills and where Chakancha tea comes from',
      'What makes Nandi Hills tea special?',
      'How is your tea grown and harvested?',
      'Can I trace my tea back to the field?',
      'What is the terroir of Nandi Hills?',
    ],
  },
  
  impact: {
    name: 'Impact & Values',
    prompts: [
      'How does Chakancha ensure living wages for tea pickers?',
      'What does transparent value chain mean?',
      'How much of the price goes to tea pickers?',
      'What is the Chakan Tree?',
      'How can I support the tea farming community?',
    ],
  },
  
  brewing: {
    name: 'Brewing & Preparation',
    prompts: [
      'What are the best practices for brewing premium tea?',
      'How do I brew the perfect cup of black tea?',
      'What water temperature should I use?',
      'How long should I steep my tea?',
      'Can I resteep my tea leaves?',
    ],
  },
  
  products: {
    name: 'Products & Orders',
    prompts: [
      'What teas do you currently have available?',
      'Do you offer tea subscriptions?',
      'What are your shipping options?',
      'How should I store my tea?',
      'What is your return policy?',
    ],
  },
  
  chakanTree: {
    name: 'Chakan Tree',
    prompts: [
      'What is the Chakan Tree and how does it work?',
      'How do I join the Chakan Tree?',
      'What rewards do participants get?',
      'How does the referral system work?',
      'What is the impact of Chakan Tree?',
    ],
  },
};

/**
 * Get random prompts from a category
 * @param {string} category - Category name
 * @param {number} count - Number of prompts to return
 * @returns {string[]}
 */
export function getRandomPrompts(category, count = 3) {
  const prompts = PROMPT_CATEGORIES[category]?.prompts || [];
  const shuffled = [...prompts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Get all prompts as flat array
 * @returns {string[]}
 */
export function getAllPrompts() {
  return Object.values(PROMPT_CATEGORIES)
    .flatMap(category => category.prompts);
}

/**
 * Search prompts by keyword
 * @param {string} keyword - Search keyword
 * @returns {string[]}
 */
export function searchPrompts(keyword) {
  const allPrompts = getAllPrompts();
  const lowerKeyword = keyword.toLowerCase();
  
  return allPrompts.filter(prompt => 
    prompt.toLowerCase().includes(lowerKeyword)
  );
}

export default {
  PROMPT_CHIPS,
  PROMPT_CATEGORIES,
  getRandomPrompts,
  getAllPrompts,
  searchPrompts,
};