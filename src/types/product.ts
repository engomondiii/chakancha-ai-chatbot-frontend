/**
 * Product types for Chakancha Global
 */

export type CaffeineLevel = 'low' | 'medium' | 'high';
export type TeaCategory   = 'black' | 'green' | 'white' | 'purple' | 'oolong' | 'blend';

export interface Product {
  id:            string;
  name:          string;
  slug:          string;
  category:      TeaCategory;
  price:         number;
  currency:      string;
  image:         string;
  images:        string[];
  description:   string;
  flavorProfile: string;
  tastingNotes:  string[];
  caffeineLevel: CaffeineLevel;
  origin:        string;
  estate:        string;
  harvest:       string;
  brewingTemp:   string;
  brewingTime:   string;
  teaAmount:     string;
  resteeps:      number;
  inStock:       boolean;
  featured:      boolean;
  tags:          string[];
  weight:        string;
  certification: string;
}

export interface ProductCategory {
  id:    string;
  name:  string;
  slug:  string;
  count: number;
  color?: string;
  icon?:  string;
}

export interface ProductFilter {
  category?:  string;
  limit?:     number;
  sortBy?:    keyof Product;
  sortOrder?: 'asc' | 'desc';
  search?:    string;
  featured?:  boolean;
}