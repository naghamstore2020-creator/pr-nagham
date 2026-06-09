// بيانات تجريبية لوضع Demo
export const DEMO_STORE_PRODUCTS = [
  { rowIndex: 1, type: 'product', name: 'iPhone 15 Pro Max 256GB', category: 'هواتف', quantity: 12, sellPrice: 5499, sku: 'IP15PM-256', costPrice: 4200, option1: '', option2: '', option3: '' },
  { rowIndex: 2, type: 'variant', name: 'iPhone 15 Pro Max 256GB - أسود', category: 'هواتف', quantity: 10, sellPrice: 5499, sku: 'IP15PM-256-BLK', costPrice: 4200, option1: 'أسود', option2: '', option3: '' },
  { rowIndex: 3, type: 'variant', name: 'iPhone 15 Pro Max 256GB - ذهبي', category: 'هواتف', quantity: 6, sellPrice: 5599, sku: 'IP15PM-256-GLD', costPrice: 4300, option1: 'ذهبي', option2: '', option3: '' },
  { rowIndex: 4, type: 'product', name: 'AirPods Pro Gen 2', category: 'سماعات', quantity: 20, sellPrice: 999, sku: 'AP-PRO2', costPrice: 750, option1: '', option2: '', option3: '' },
  { rowIndex: 5, type: 'product', name: 'Samsung Galaxy S24 Ultra', category: 'هواتف', quantity: 8, sellPrice: 4999, sku: 'SG-S24U', costPrice: 3800, option1: '', option2: '', option3: '' },
  { rowIndex: 6, type: 'variant', name: 'Samsung Galaxy S24 Ultra - 256GB', category: 'هواتف', quantity: 5, sellPrice: 4999, sku: 'SG-S24U-256', costPrice: 3800, option1: '256GB', option2: '', option3: '' },
  { rowIndex: 7, type: 'variant', name: 'Samsung Galaxy S24 Ultra - 512GB', category: 'هواتف', quantity: 4, sellPrice: 5499, sku: 'SG-S24U-512', costPrice: 4200, option1: '512GB', option2: '', option3: '' },
  { rowIndex: 8, type: 'product', name: 'MacBook Air M3', category: 'أجهزة', quantity: 15, sellPrice: 4299, sku: 'MBA-M3', costPrice: 3500, option1: '', option2: '', option3: '' },
  { rowIndex: 9, type: 'product', name: 'iPad Pro 12.9', category: 'أجهزة', quantity: 8, sellPrice: 4499, sku: 'IPAD-PRO-12', costPrice: 3600, option1: '', option2: '', option3: '' },
  { rowIndex: 10, type: 'product', name: 'Apple Watch Ultra 2', category: 'ساعات', quantity: 18, sellPrice: 3199, sku: 'AW-ULTRA2', costPrice: 2500, option1: '', option2: '', option3: '' },
];

export const DEMO_SYSTEM_PRODUCTS = [
  { sku: 'IP15PM-256', name: 'Apple iPhone 15 PM 256GB Titanium', quantity: 15, costPrice: 4200 },
  { sku: 'IP15PM-256-BLK', name: 'Apple iPhone 15 PM 256GB Black', quantity: 8, costPrice: 4200 },
  { sku: 'IP15PM-256-GLD', name: 'Apple iPhone 15 PM 256GB Gold', quantity: 5, costPrice: 4300 },
  { sku: 'AP-PRO2', name: 'Apple AirPods Pro 2nd Gen', quantity: 25, costPrice: 750 },
  { sku: 'SG-S24U', name: 'Samsung S24 Ultra 5G', quantity: 10, costPrice: 3900 },
  { sku: 'SG-S24U-256', name: 'Samsung S24 Ultra 256GB', quantity: 6, costPrice: 3900 },
  { sku: 'SG-S24U-512', name: 'Samsung S24 Ultra 512GB', quantity: 3, costPrice: 4300 },
  { sku: 'MBA-M3', name: 'MacBook Air M3 2024', quantity: 12, costPrice: 3600 },
  { sku: 'IPAD-PRO-12', name: 'iPad Pro 12.9 M2', quantity: 7, costPrice: 3700 },
  { sku: 'AW-ULTRA2', name: 'Apple Watch Ultra 2 GPS+Cell', quantity: 20, costPrice: 2600 },
];

export const DEMO_RECENT_OPERATIONS = [
  { id: '1', type: 'جرد يومي', status: 'completed', date: '2024-01-15 10:30', user: 'admin', productsCount: 150, duration: '45 ثانية' },
  { id: '2', type: 'تحديث أسعار البيع', status: 'completed', date: '2024-01-14 14:20', user: 'admin', productsCount: 200, duration: '1 دقيقة' },
  { id: '3', type: 'مطابقة الأسماء', status: 'completed', date: '2024-01-13 09:15', user: 'admin', productsCount: 50, duration: '2 دقيقة' },
  { id: '4', type: 'جرد كامل', status: 'failed', date: '2024-01-12 16:45', user: 'admin', productsCount: 0, duration: '-' },
  { id: '5', type: 'تحديث أسعار التكلفة', status: 'completed', date: '2024-01-11 11:00', user: 'admin', productsCount: 180, duration: '30 ثانية' },
];

export const DEMO_STATS = {
  totalOperations: 45,
  totalProducts: 1250,
  totalFiles: 23,
  successRate: 95.6,
  apiUsage: 45,
  lastOperation: '2024-01-15 10:30',
};
