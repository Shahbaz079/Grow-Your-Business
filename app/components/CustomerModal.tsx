import { useState } from 'react';
import { useCustomerStore } from '../store/customersStore';
import Papa from 'papaparse';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Customer = {
  name: string;
  email: string;
  phone: number;
  address: string;
};

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerModal({ isOpen, onClose }: CustomerModalProps) {
  const { customers, setCustomers } = useCustomerStore();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error("No file was selected. Please upload a valid CSV file.");
      return;
    }
    if (file.type !== "text/csv") {
      toast.error("Only CSV files are supported.");
      return;
    }
    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error("CSV Parsing failed. Check the file format.");
          return;
        }
        const parsedData = results.data as Customer[];
        setCustomers(parsedData);
       
        toast.success(`${parsedData.length} customers imported successfully!`);
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddCustomer = () => {
    if (!form.name || !form.email || !form.phone || !form.address) {
      toast.error("Please fill in all fields.");
      return;
    }
    const newCustomer: Customer = { ...form, phone: Number(form.phone) };
    const updatedCustomers = [...customers, newCustomer];
    setCustomers(updatedCustomers);
   
    setForm({ name: "", email: "", phone: "", address: "" });
    toast.success("Customer added successfully!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <ToastContainer />
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add Customers</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="w-full">
            <label className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer text-center w-full md:w-auto inline-block">
              Upload CSV
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <p className="text-sm text-gray-600 mt-2">Upload a CSV file to import multiple customers at once. The CSV should have columns: name, email, phone, address</p>
            <p className="text-sm text-red-500 mt-1">⚠️ Make sure to provide valid email addresses as campaign links will be sent to these emails</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Add a Customer Manually</h3>
          <p className="text-sm text-gray-600 mb-4">Fill in the details below to add a single customer to your campaign.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} className="p-3 border rounded-lg w-full" />
            <div className="relative">
              <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="p-3 border rounded-lg w-full" />
              <p className="text-xs text-red-500 mt-1">⚠️ Campaign links will be sent to these email addresses</p>
            </div>
            <input type="text" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="p-3 border rounded-lg w-full" />
            <input type="text" name="address" placeholder="Address" value={form.address} onChange={handleChange} className="p-3 border rounded-lg w-full" />
          </div>
          <button onClick={handleAddCustomer} className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold">
            Add Customer
          </button>
        </div>

        {customers.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Selected Customers</h3>
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
    </div>
  );
} 