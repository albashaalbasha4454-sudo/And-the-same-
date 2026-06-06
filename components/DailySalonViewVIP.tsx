import React, { useMemo, useState } from 'react';
import { BookOpen, Calendar, FileDown, Moon, Package, PenTool, Plus, Search, Sparkles, Trash2, Edit2, Archive, Eye, CheckCircle2 } from 'lucide-react';
import type { Product, User } from '../types';

interface DailySalonViewVIPProps {
  products: Product[];
  currentUser: User;
}

type Tab = 'overview' | 'diwan' | 'sleep' | 'planner' | 'market' | 'files';

t