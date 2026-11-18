export type ToolCategory = 'qr' | 'file' | 'security' | 'developer';

export interface ToolCategoryInfo {
  id: ToolCategory;
  name: string;
  description: string;
  icon: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  href: string;
  icon: string;
  badge?: 'Mới' | 'Phổ biến' | 'PRO' | 'Free';
  tags: string[];
}
