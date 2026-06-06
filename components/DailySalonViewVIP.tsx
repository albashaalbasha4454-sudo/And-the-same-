import React, { useMemo, useState } from 'react';
import { BarChart3, BookOpen, Calendar, Edit2, FileDown, Moon, Package, PenTool, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import type { Product, User } from '../types';

interface DailySalonViewVIPProps {
  products: Product[];
  currentUser: User;
}

type VipTab = 'overview' | 'diwan' | 'sleep' | 'planner' | 'market' | 'files';

const tabs: { id: VipTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: