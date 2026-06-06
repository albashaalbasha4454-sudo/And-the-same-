import React, { useMemo, useState } from 'react';
import { BookOpen, Calendar, FileDown, Moon, Package, PenTool, Plus, Search, Sparkles, Trash2, Edit2 } from 'lucide-react';
import type { Product, User } from '../types';

interface DailySalonViewVIPProps {
  products: Product[];
  currentUser: User;
}

type Tab = 'overview' | 'diwan' | 'sleep' | 'planner' | 'market' | 'files';

export const DailySalonViewVIP: React.FC<DailySalonViewVIPProps> = ({ products, currentUser }) => {
  const [tab, setTab] = use