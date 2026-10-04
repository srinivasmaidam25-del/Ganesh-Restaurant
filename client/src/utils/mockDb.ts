// Local In-Memory Mock Database Fallback (for offline standalone demo running)

export interface MockRestaurant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  banner: string;
  address: string;
  gstNumber: string;
  contactDetails: { phone: string; email: string };
  openingHours: string;
  taxPercentage: number;
  serviceCharge: number;
  currency: string;
  theme: { primaryColor: string; isDarkDefault: boolean };
}

export interface MockCategory {
  id: string;
  name: string;
  order_index: number;
}

export interface MockFood {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  image: string;
  isVeg: boolean;
  isNonVeg: boolean;
  spicyLevel: string;
  isAvailable: boolean;
  isBestseller: boolean;
  rating: number;
  prepTime: number;
}

export interface MockTable {
  id: string;
  number: string;
  status: 'active' | 'disabled';
}

export interface MockCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrderAmount: number;
  expiryDate: string;
}

export interface MockReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MockOrder {
  id: string;
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  items: Array<{ foodId: string; name: string; price: number; quantity: number; notes: string }>;
  subTotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  notes: string;
  loyaltyPointsEarned: number;
  createdAt: string;
}

export interface MockInventory {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  minThreshold: number;
}

// ==========================================
// SEEDED STATIC MOCK STATE
// ==========================================

const defaultRestaurant: MockRestaurant = {
  id: 'rest-la-piazza-111',
  name: 'Rasoi - Indian Fine Dine',
  slug: 'la-piazza',
  logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200',
  banner: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
  address: '123 Curry Road, Connaught Place, New Delhi 110001',
  gstNumber: '27AAAAA1111A1Z1',
  contactDetails: { phone: '+91 98765 43210', email: 'info@rasoi.com' },
  openingHours: '11:00 AM - 11:00 PM',
  taxPercentage: 5.0,
  serviceCharge: 2.0,
  currency: '₹',
  theme: { primaryColor: '#EA580C', isDarkDefault: true }
};

const defaultCategories: MockCategory[] = [
  { id: 'cat-1', name: 'Starters', order_index: 1 },
  { id: 'cat-2', name: 'Curry Mains', order_index: 2 },
  { id: 'cat-3', name: 'Breads & Rice', order_index: 3 },
  { id: 'cat-4', name: 'Desserts & Drinks', order_index: 4 },
  { id: 'cat-5', name: 'Biryani', order_index: 5 }
];

const defaultFoods: MockFood[] = [
  {
    id: 'food-1',
    categoryId: 'cat-1',
    name: 'Samosa Chaat',
    description: 'Crispy vegetable samosas crushed and topped with warm spiced chickpeas, yogurt, sweet and tangy tamarind-mint chutneys.',
    ingredients: ['Samosa', 'Chickpeas', 'Yogurt', 'Chutney', 'Spices'],
    price: 120.00,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isNonVeg: false,
    spicyLevel: 'medium',
    isAvailable: true,
    isBestseller: true,
    rating: 4.8,
    prepTime: 8
  },
  {
    id: 'food-2',
    categoryId: 'cat-1',
    name: 'Tandoori Paneer Tikka',
    description: 'Fresh cottage cheese cubes marinated in yogurt and hot Indian spices, skewered and grilled to perfection in clay oven.',
    ingredients: ['Paneer', 'Yogurt', 'Bell Peppers', 'Onion', 'Garam Masala'],
    price: 240.00,
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isNonVeg: false,
    spicyLevel: 'medium',
    isAvailable: true,
    isBestseller: false,
    rating: 4.6,
    prepTime: 12
  },
  {
    id: 'food-3',
    categoryId: 'cat-2',
    name: 'Shahi Paneer Butter Masala',
    description: 'Soft paneer cubes simmered in a mildly spiced, sweet and creamy tomato-cashew nut gravy finished with fresh cream.',
    ingredients: ['Paneer', 'Tomato', 'Cashews', 'Cream', 'Butter'],
    price: 320.00,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isNonVeg: false,
    spicyLevel: 'low',
    isAvailable: true,
    isBestseller: true,
    rating: 4.9,
    prepTime: 15
  },
  {
    id: 'food-4',
    categoryId: 'cat-2',
    name: 'Butter Chicken Murgh Makhani',
    description: 'Tender pulled chicken cooked in a rich, buttery, velvety tomato gravy with mild spices and crushed fenugreek leaves.',
    ingredients: ['Chicken', 'Butter', 'Tomato', 'Cream', 'Kasturi Methi'],
    price: 380.00,
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=600',
    isVeg: false,
    isNonVeg: true,
    spicyLevel: 'medium',
    isAvailable: true,
    isBestseller: true,
    rating: 4.9,
    prepTime: 18
  },
  {
    id: 'food-5',
    categoryId: 'cat-3',
    name: 'Garlic Butter Naan',
    description: 'Fresh leavened wheat bread baked in tandoor, brushed with warm butter and loaded with minced garlic and herbs.',
    ingredients: ['Flour', 'Butter', 'Garlic', 'Coriander'],
    price: 80.00,
    image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isNonVeg: false,
    spicyLevel: 'none',
    isAvailable: true,
    isBestseller: true,
    rating: 4.9,
    prepTime: 5
  },
  {
    id: 'food-6',
    categoryId: 'cat-3',
    name: 'Jeera Basmati Rice',
    description: 'Aromatic long grain basmati rice steamed and tempered with roasted cumin seeds and fresh ghee.',
    ingredients: ['Basmati Rice', 'Cumin Seeds', 'Ghee'],
    price: 150.00,
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isNonVeg: false,
    spicyLevel: 'none',
    isAvailable: true,
    isBestseller: false,
    rating: 4.5,
    prepTime: 8
  },
  {
    id: 'food-7',
    categoryId: 'cat-4',
    name: 'Sweet Mango Lassi',
    description: 'Traditional Punjabi sweet yogurt drink blended with fresh Alphonso mango pulp and cardamom.',
    ingredients: ['Yogurt', 'Mango', 'Sugar', 'Cardamom'],
    price: 120.00,
    image: 'https://images.unsplash.com/photo-1571006682864-7407852ee318?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isNonVeg: false,
    spicyLevel: 'none',
    isAvailable: true,
    isBestseller: true,
    rating: 4.8,
    prepTime: 4
  },
  {
    id: 'food-8',
    categoryId: 'cat-4',
    name: 'Hot Gulab Jamun',
    description: 'Golden fried soft milk-solid dumplings soaked in warm fragrant green cardamom sugar syrup.',
    ingredients: ['Milk Solids', 'Flour', 'Sugar Syrup', 'Cardamom'],
    price: 90.00,
    image: 'https://images.unsplash.com/photo-1605698802041-b7654f15d2a2?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isNonVeg: false,
    spicyLevel: 'none',
    isAvailable: true,
    isBestseller: true,
    rating: 4.9,
    prepTime: 5
  },
  // BIRYANI CATEGORY (From Menu)
  {
    id: 'food-biryani-1',
    categoryId: 'cat-5',
    name: 'Veg Dum Biryani',
    description: 'Fragrant basmati rice layered with spiced garden vegetables, saffron, and aromatic herbs cooked in traditional dum style. Served with Raita & Salan.',
    ingredients: ['Basmati Rice', 'Carrots', 'Beans', 'Green Peas', 'Saffron', 'Dum Spices', 'Raita', 'Salan'],
    price: 180.00,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isNonVeg: false,
    spicyLevel: 'medium',
    isAvailable: true,
    isBestseller: false,
    rating: 4.8,
    prepTime: 15
  },
  {
    id: 'food-biryani-2',
    categoryId: 'cat-5',
    name: 'Paneer Biryani',
    description: 'Succulent cubes of marinated cottage cheese layered with spiced basmati rice and slow-cooked in dum sealed pot. Served with Raita & Salan.',
    ingredients: ['Paneer', 'Basmati Rice', 'Fried Onion', 'Mint', 'Ghee', 'Biryani Spices', 'Raita', 'Salan'],
    price: 220.00,
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isNonVeg: false,
    spicyLevel: 'medium',
    isAvailable: true,
    isBestseller: false,
    rating: 4.7,
    prepTime: 15
  },
  {
    id: 'food-biryani-3',
    categoryId: 'cat-5',
    name: 'Mushroom Biryani',
    description: 'Juicy button mushrooms sauteed in rich Hyderabadi masala, infused with aged fragrant basmati rice and fresh herbs. Served with Raita & Salan.',
    ingredients: ['Button Mushrooms', 'Basmati Rice', 'Brown Onion', 'Coriander', 'Shahi Masala', 'Raita', 'Salan'],
    price: 210.00,
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isNonVeg: false,
    spicyLevel: 'medium',
    isAvailable: true,
    isBestseller: false,
    rating: 4.6,
    prepTime: 15
  },
  {
    id: 'food-biryani-4',
    categoryId: 'cat-5',
    name: 'Chicken Dum Biryani',
    description: 'Our signature Hyderabadi dum biryani featuring tender chicken marinated in spiced yogurt and slow-cooked with long grain saffron basmati rice. Served with Raita & Salan.',
    ingredients: ['Tender Chicken', 'Basmati Rice', 'Saffron', 'Brown Onion', 'Mint', 'Desi Ghee', 'Raita', 'Salan'],
    price: 240.00,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600',
    isVeg: false,
    isNonVeg: true,
    spicyLevel: 'spicy',
    isAvailable: true,
    isBestseller: true,
    rating: 4.9,
    prepTime: 18
  },
  {
    id: 'food-biryani-5',
    categoryId: 'cat-5',
    name: 'Chicken Fry Piece Biryani',
    description: 'Crispy, spicy pan-roasted chicken fry pieces served generously over fragrant, hot spiced biryani rice. Served with Raita & Salan.',
    ingredients: ['Spiced Fried Chicken', 'Biryani Rice', 'Curry Leaves', 'Green Chillies', 'Cashews', 'Raita', 'Salan'],
    price: 280.00,
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=600',
    isVeg: false,
    isNonVeg: true,
    spicyLevel: 'spicy',
    isAvailable: true,
    isBestseller: false,
    rating: 4.8,
    prepTime: 16
  },
  {
    id: 'food-biryani-6',
    categoryId: 'cat-5',
    name: 'Chicken 65 Biryani',
    description: 'Delectable combination of fiery boneless Chicken 65 tossed with curry leaves and layered atop aromatic dum biryani rice. Served with Raita & Salan.',
    ingredients: ['Chicken 65 Boneless', 'Aromatic Rice', 'Red Chillies', 'Curry Leaves', 'Garlic', 'Raita', 'Salan'],
    price: 300.00,
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=600',
    isVeg: false,
    isNonVeg: true,
    spicyLevel: 'spicy',
    isAvailable: true,
    isBestseller: false,
    rating: 4.9,
    prepTime: 16
  },
  {
    id: 'food-biryani-7',
    categoryId: 'cat-5',
    name: 'Egg Biryani',
    description: 'Golden shallow-fried boiled eggs infused with rich biryani masala and layered with fluffy basmati rice. Served with Raita & Salan.',
    ingredients: ['Boiled Eggs', 'Basmati Rice', 'Caramelized Onion', 'Mint', 'Biryani Masala', 'Raita', 'Salan'],
    price: 190.00,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600',
    isVeg: false,
    isNonVeg: true,
    spicyLevel: 'medium',
    isAvailable: true,
    isBestseller: false,
    rating: 4.6,
    prepTime: 12
  },
  {
    id: 'food-biryani-8',
    categoryId: 'cat-5',
    name: 'Hyderabadi Mutton Biryani',
    description: 'Royal traditional recipe with melt-in-the-mouth tender mutton chunks slow-cooked with aromatic basmati rice, saffron, and royal spices. Served with Raita & Salan.',
    ingredients: ['Tender Mutton', 'Aged Basmati Rice', 'Kewra Water', 'Saffron', 'Cardamom', 'Shahi Jeera', 'Raita', 'Salan'],
    price: 320.00,
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=600',
    isVeg: false,
    isNonVeg: true,
    spicyLevel: 'spicy',
    isAvailable: true,
    isBestseller: false,
    rating: 4.9,
    prepTime: 20
  },
  {
    id: 'food-biryani-9',
    categoryId: 'cat-5',
    name: 'Prawns Biryani',
    description: 'Fresh coastal prawns cooked in a rich, tangy spiced masala and gently folded with fragrant saffron dum rice. Served with Raita & Salan.',
    ingredients: ['Fresh Prawns', 'Basmati Rice', 'Coconut & Spices', 'Mint', 'Lemon Juice', 'Raita', 'Salan'],
    price: 330.00,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600',
    isVeg: false,
    isNonVeg: true,
    spicyLevel: 'medium',
    isAvailable: true,
    isBestseller: false,
    rating: 4.8,
    prepTime: 15
  }
];

const defaultTables: MockTable[] = [
  { id: 'tab-1', number: '1', status: 'active' },
  { id: 'tab-2', number: '2', status: 'active' },
  { id: 'tab-3', number: '3', status: 'active' },
  { id: 'tab-4', number: '4', status: 'active' },
  { id: 'tab-5', number: '5', status: 'active' },
  { id: 'tab-6', number: '6', status: 'active' }
];

const defaultCoupons: MockCoupon[] = [
  { id: 'coup-1', code: 'WELCOME10', type: 'percentage', value: 10, minOrderAmount: 200, expiryDate: '2026-12-31' },
  { id: 'coup-2', code: 'CURRY100', type: 'flat', value: 100.00, minOrderAmount: 500, expiryDate: '2026-12-31' }
];

const defaultReviews: MockReview[] = [
  { id: 'rev-1', customerName: 'Amit Sharma', rating: 5, comment: 'The Butter Chicken is absolute perfection! Sauce is creamy and rich.', createdAt: new Date().toISOString() },
  { id: 'rev-2', customerName: 'Ananya Iyer', rating: 4, comment: 'Scanning and ordering from table was seamless. Samosa Chaat is highly recommended.', createdAt: new Date().toISOString() }
];

const defaultInventory: MockInventory[] = [
  { id: 'inv-1', itemName: 'Paneer Cottage Cheese', quantity: 25.5, unit: 'kg', minThreshold: 10 },
  { id: 'inv-2', itemName: 'Chicken Breast halves', quantity: 15.0, unit: 'kg', minThreshold: 5 },
  { id: 'inv-3', itemName: 'Basmati Rice grains', quantity: 4.5, unit: 'kg', minThreshold: 8 },
  { id: 'inv-4', itemName: 'Garam Masala Spices', quantity: 12.0, unit: 'kg', minThreshold: 5 }
];

// Mutatable Local States backed by localStorage for cross-tab persistence in Demo Mode
class LocalMockDatabase {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(`mock_db_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`mock_db_${key}`, JSON.stringify(value));
    } catch {}
  }

  private broadcastChange(detail?: any) {
    if (typeof window !== 'undefined') {
      // 1. Dispatch custom event for current window
      const event = new CustomEvent('mock_db_order_update', { detail });
      window.dispatchEvent(event);
      
      // 2. Broadcast via BroadcastChannel to other tabs
      try {
        const channel = new BroadcastChannel('rasoi-order-sync');
        channel.postMessage({ type: 'order_updated', detail });
        channel.close();
      } catch {}
    }
  }

  get restaurant(): MockRestaurant {
    return this.getStorageItem('restaurant', defaultRestaurant);
  }
  set restaurant(val: MockRestaurant) {
    this.setStorageItem('restaurant', val);
  }

  get categories(): MockCategory[] {
    return this.getStorageItem('categories', defaultCategories);
  }
  set categories(val: MockCategory[]) {
    this.setStorageItem('categories', val);
  }

  get foods(): MockFood[] {
    return this.getStorageItem('foods', defaultFoods);
  }
  set foods(val: MockFood[]) {
    this.setStorageItem('foods', val);
  }

  get tables(): MockTable[] {
    return this.getStorageItem('tables', defaultTables);
  }
  set tables(val: MockTable[]) {
    this.setStorageItem('tables', val);
  }

  get coupons(): MockCoupon[] {
    return this.getStorageItem('coupons', defaultCoupons);
  }
  set coupons(val: MockCoupon[]) {
    this.setStorageItem('coupons', val);
  }

  get reviews(): MockReview[] {
    return this.getStorageItem('reviews', defaultReviews);
  }
  set reviews(val: MockReview[]) {
    this.setStorageItem('reviews', val);
  }

  get orders(): MockOrder[] {
    return this.getStorageItem('orders', []);
  }
  set orders(val: MockOrder[]) {
    this.setStorageItem('orders', val);
  }

  get inventory(): MockInventory[] {
    return this.getStorageItem('inventory', defaultInventory);
  }
  set inventory(val: MockInventory[]) {
    this.setStorageItem('inventory', val);
  }

  // Table operations
  getTables() { return this.tables; }
  createTable(number: string) {
    const list = this.tables;
    const newTab: MockTable = { id: `tab-${Date.now()}`, number, status: 'active' };
    list.push(newTab);
    this.tables = list;
    this.broadcastChange();
    return newTab;
  }
  updateTable(id: string, updates: Partial<MockTable>) {
    this.tables = this.tables.map(t => t.id === id ? { ...t, ...updates } : t);
    this.broadcastChange();
    return this.tables.find(t => t.id === id);
  }
  deleteTable(id: string) {
    this.tables = this.tables.filter(t => t.id !== id);
    this.broadcastChange();
  }

  // Food operations
  getFoods() { return this.foods; }
  createFood(food: Omit<MockFood, 'id' | 'rating'>) {
    const list = this.foods;
    const newFood: MockFood = { ...food, id: `food-${Date.now()}`, rating: 5.0 };
    list.push(newFood);
    this.foods = list;
    this.broadcastChange();
    return newFood;
  }
  updateFood(id: string, updates: Partial<MockFood>) {
    this.foods = this.foods.map(f => f.id === id ? { ...f, ...updates } : f);
    this.broadcastChange();
    return this.foods.find(f => f.id === id);
  }
  deleteFood(id: string) {
    this.foods = this.foods.filter(f => f.id !== id);
    this.broadcastChange();
  }

  // Category operations
  getCategories() { return this.categories; }
  createCategory(name: string, order_index = 0) {
    const list = this.categories;
    const newCat = { id: `cat-${Date.now()}`, name, order_index };
    list.push(newCat);
    this.categories = list;
    this.broadcastChange();
    return newCat;
  }
  deleteCategory(id: string) {
    this.categories = this.categories.filter(c => c.id !== id);
    this.foods = this.foods.filter(f => f.categoryId !== id);
    this.broadcastChange();
  }

  // Coupon operations
  getCoupons() { return this.coupons; }
  createCoupon(coupon: Omit<MockCoupon, 'id'>) {
    const list = this.coupons;
    const newCoup = { ...coupon, id: `coup-${Date.now()}` };
    list.push(newCoup);
    this.coupons = list;
    this.broadcastChange();
    return newCoup;
  }
  deleteCoupon(id: string) {
    this.coupons = this.coupons.filter(c => c.id !== id);
    this.broadcastChange();
  }

  // Review operations
  getReviews() { return this.reviews; }
  createReview(customerName: string, rating: number, comment: string) {
    const list = this.reviews;
    const newRev = { id: `rev-${Date.now()}`, customerName, rating, comment, createdAt: new Date().toISOString() };
    list.push(newRev);
    this.reviews = list;
    this.broadcastChange();
    return newRev;
  }

  // Order operations
  getOrders() { return this.orders; }
  getOrderById(id: string) { return this.orders.find(o => o.id === id); }
  createOrder(order: Omit<MockOrder, 'id' | 'createdAt' | 'status' | 'paymentStatus'>) {
    const list = this.orders;
    const newOrder: MockOrder = {
      ...order,
      id: `ord-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'received',
      paymentStatus: 'pending'
    };
    list.push(newOrder);
    this.orders = list;
    this.broadcastChange(newOrder);
    return newOrder;
  }
  updateOrder(id: string, updates: Partial<MockOrder>) {
    const list = this.orders.map(o => o.id === id ? { ...o, ...updates } : o);
    this.orders = list;
    const updated = list.find(o => o.id === id);
    this.broadcastChange(updated);
    return updated;
  }

  // Inventory operations
  getInventory() { return this.inventory; }
  createInventory(itemName: string, quantity: number, unit: string, minThreshold: number) {
    const list = this.inventory;
    const newItem = { id: `inv-${Date.now()}`, itemName, quantity, unit, minThreshold };
    list.push(newItem);
    this.inventory = list;
    this.broadcastChange();
    return newItem;
  }
  adjustInventory(id: string, quantity: number) {
    this.inventory = this.inventory.map(item => item.id === id ? { ...item, quantity } : item);
    this.broadcastChange();
    return this.inventory.find(i => i.id === id);
  }
  deleteInventory(id: string) {
    this.inventory = this.inventory.filter(i => i.id !== id);
    this.broadcastChange();
  }
}

export const mockDb = new LocalMockDatabase();
