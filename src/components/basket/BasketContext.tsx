'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

export interface BasketItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface BasketState {
  items: BasketItem[];
  type: 'retail' | 'wholesale';
}

type BasketAction =
  | { type: 'ADD_ITEM'; item: BasketItem }
  | { type: 'REMOVE_ITEM'; id: number }
  | { type: 'UPDATE_QTY'; id: number; quantity: number }
  | { type: 'SET_TYPE'; basketType: 'retail' | 'wholesale' }
  | { type: 'CLEAR' };

function reducer(state: BasketState, action: BasketAction): BasketState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + action.item.quantity } : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.item] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i
        ),
      };
    case 'SET_TYPE':
      return { ...state, type: action.basketType };
    case 'CLEAR':
      return { ...state, items: [] };
    default:
      return state;
  }
}

interface BasketContextValue {
  state: BasketState;
  addItem: (item: BasketItem) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, quantity: number) => void;
  clearBasket: () => void;
  setType: (type: 'retail' | 'wholesale') => void;
  total: number;
  count: number;
}

const BasketContext = createContext<BasketContextValue | null>(null);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], type: 'retail' });

  useEffect(() => {
    const saved = localStorage.getItem('birjandi_basket');
    if (saved) {
      const parsed: BasketState = JSON.parse(saved);
      parsed.items.forEach((item) => dispatch({ type: 'ADD_ITEM', item }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('birjandi_basket', JSON.stringify(state));
  }, [state]);

  const total = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <BasketContext.Provider
      value={{
        state,
        addItem: (item) => dispatch({ type: 'ADD_ITEM', item }),
        removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', id }),
        updateQty: (id, quantity) => dispatch({ type: 'UPDATE_QTY', id, quantity }),
        clearBasket: () => dispatch({ type: 'CLEAR' }),
        setType: (basketType) => dispatch({ type: 'SET_TYPE', basketType }),
        total,
        count,
      }}
    >
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error('useBasket must be used inside BasketProvider');
  return ctx;
}
