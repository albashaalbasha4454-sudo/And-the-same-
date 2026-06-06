import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, BookMarked, BookOpen, Calendar, Edit2, FileDown, Moon, Package, PenTool, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import type { Product, User } from '../types';

interface DailySalonViewVIPProps {
  products: Product[];
  currentUser: User;
}

t