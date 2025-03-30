"use client";

import { useState } from "react";
import Papa from "papaparse";
import { useCustomerStore } from "../store/customersStore";

type Customer = {
  name: string;
  email: string;
  phone: number;
  address: string;
};

export default function CustomersPage() {
  const { customers, setCustomers } = useCustomerStore();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement> | { target: { files: File[] } }) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError("No file was selected. Please upload a valid CSV file.");
      return;
    }
    if (file.type !== "text/csv") {
      setError("Only CSV files are supported.");
      return;
    }
    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError("CSV Parsing failed. Check the file format.");
          return;
        }
        const parsedData = results.data as Customer[];
        setCustomers(parsedData);
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddCustomer = () => {
    if (!form.name || !form.email || !form.phone || !form.address) {
      setError("Please fill in all fields.");
      return;
    }
    const newCustomer: Customer = { ...form, phone: Number(form.phone) };
    setCustomers([...customers, newCustomer]);
    setForm({ name: "", email: "", phone: "", address: "" });
    setError(null);
  };

  

  return (
    <div className="ml-[20%] min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-6">
        <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-6">Customer Management</h1>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <label className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer text-center w-full md:w-auto">
            Upload CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
          <h2 className="text-lg font-semibold mb-3 text-black">Add a Customer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black">
            <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} className="p-3 border rounded-lg w-full" />
            <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="p-3 border rounded-lg w-full" />
            <input type="text" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="p-3 border rounded-lg w-full" />
            <input type="text" name="address" placeholder="Address" value={form.address} onChange={handleChange} className="p-3 border rounded-lg w-full" />
          </div>
          <button onClick={handleAddCustomer} className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold">Add Customer</button>
        </div>
      </div>

      {customers.length > 0 && (
        <div className="max-w-4xl mx-auto mt-8 bg-white shadow-xl rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Customer List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead>
                <tr className="bg-blue-500 text-white uppercase text-sm">
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6">Phone</th>
                  <th className="py-3 px-6">Address</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {customers.map((customer, index) => (
                  <tr key={index} className="border-b hover:bg-gray-100">
                    <td className="py-3 px-6">{customer.name}</td>
                    <td className="py-3 px-6">{customer.email}</td>
                    <td className="py-3 px-6">{customer.phone}</td>
                    <td className="py-3 px-6">{customer.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
