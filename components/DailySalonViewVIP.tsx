import React, { useMemo, useState } from 'react';
import {
  Archive,
  BookOpen,
  Calendar,
  CheckCircle2,
  Edit2,
  Eye,
  FileDown,
  Moon,
  Package,
  PenTool,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { Product, User } from '../types';

interface DailySalonViewVIPProps {
  products: Product[];
  currentUser: User;
}

type Tab = 'overview' | 'diwan' | 'sleep' | 'planner' | 'market' | 'files';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  {