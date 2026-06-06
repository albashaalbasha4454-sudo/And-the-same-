import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  Archive,
  BarChart3,
  BookMarked,
  BookOpen,
  Calendar,
  CheckCircle,
  Circle,
  Clock3,
  Edit2,
  FileDown,
  FileText,
  Layers3,
  Moon,
  Package,
  PenTool,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { DailyTask, Poem, Product, ReadingProgress, User } from '../types';
import { dailySalonService } from '../services/dailySalonService';

interface DailySalonViewVIPProps {
  products: Product[];
  currentUser: User