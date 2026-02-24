import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import type { FC } from 'react';

/**
 * Maps icon name strings (stored in DB) to actual icon components.
 * If the string contains non-ASCII (emoji), renders as Text.
 */

const MCI_ICONS = new Set([
  'flask', 'scroll', 'leaf', 'rocket', 'palette', 'fire',
  'brain', 'atom', 'dna', 'microscope', 'telescope',
  'earth', 'map-marker', 'compass', 'flower', 'tree',
  'music', 'movie', 'food', 'heart', 'star',
  'lightning-bolt', 'shield', 'crown', 'diamond',
]);

const FEATHER_ICONS = new Set([
  'globe', 'book', 'cpu', 'code', 'terminal', 'monitor',
  'camera', 'headphones', 'mic', 'film', 'tv',
  'briefcase', 'shopping-cart', 'gift', 'award',
  'compass', 'map', 'navigation', 'zap',
]);

type IconFromNameProps = {
  name: string;
  size?: number;
  color?: string;
};

export const IconFromName: FC<IconFromNameProps> = ({
  name,
  size = 32,
  color,
}) => {
  // If it's an emoji (contains non-ASCII chars), render as text
  const isEmoji = /[^\x00-\x7F]/.test(name);
  if (isEmoji) {
    return <Text style={{ fontSize: size * 0.8 }}>{name}</Text>;
  }

  // Try MaterialCommunityIcons first (larger icon set)
  if (MCI_ICONS.has(name)) {
    return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
  }

  // Try Feather
  if (FEATHER_ICONS.has(name)) {
    return <Feather name={name as any} size={size} color={color} />;
  }

  // Fallback: try MaterialCommunityIcons (it has more icons)
  return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
};
