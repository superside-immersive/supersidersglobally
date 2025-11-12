/**
 * Category Definitions
 * Regional categories with questions and country lists
 */
import { countryData } from './countries.js';

/**
 * Category Colors
 * Each category has a unique color for visualization
 */
export const categoryColors = {
    'lone_wolf': '#5CFF85',        // Screamin' Green
    'latin_america': '#D8FF85',     // Honeysuckle
    'europe': '#0F2133',            // Firefly
    'africa': '#FAFAFA'             // Alabaster
};

export const categories = {
    'lone_wolf': {
        question: 'Are there lone wolf countries at Superside?',
        countries: countryData.filter(country => country.count === 1).map(country => country.name),
        color: categoryColors.lone_wolf
    },
    'latin_america': {
        question: 'How strong is Superside\'s presence in Latin America?',
        countries: ['Argentina', 'Brazil', 'Colombia', 'Costa Rica', 'Dominican Republic', 'Ecuador', 'El Salvador', 'Guatemala', 'Honduras', 'Mexico', 'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Uruguay', 'Venezuela'],
        color: categoryColors.latin_america
    },
    'europe': {
        question: 'Which European countries have Supersiders?',
        countries: ['Armenia', 'Belarus', 'Bosnia & Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'France', 'Georgia', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russian Federation', 'Serbia', 'Slovenia', 'Spain', 'Sweden', 'Turkey', 'Ukraine', 'United Kingdom'],
        color: categoryColors.europe
    },
    'africa': {
        question: 'Is Superside expanding across Africa?',
        countries: ['Egypt', 'Ghana', 'Kenya', 'Libya', 'Mauritius', 'Nigeria', 'South Africa', 'Tunisia'],
        color: categoryColors.africa
    }
};
