import { create } from "zustand";

type Customer = {
  name: string;
  email: string;
  phone: number;
  address: string;
  campaignId?: string;
  campaignName?: string;
};

type CustomerStore = {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
};

export const useCustomerStore = create<CustomerStore>((set) => ({
  customers: [],
  setCustomers: (customers) => set({ customers }),
}));
