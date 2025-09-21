"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { supabase } from "../../../lib/supabaseClient";
import { Pencil, Trash2, Download, PlusCircle } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from "react-places-autocomplete";

/* ===============================
   Confirm Modal
=================================*/
function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-96 rounded bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold">{title}</h2>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Working..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersListPage() {
  const router = useRouter();

  /* ===============================
     STATE
  ================================*/
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // UI
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Search / Sort / Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalAction, setModalAction] = useState<() => void>(() => {});
  const [modalLoading, setModalLoading] = useState(false);

  /* ===============================
     Helpers
  ================================*/
  const openConfirmModal = (message: string, action: () => void) => {
    setModalMessage(message);
    setModalAction(() => action);
    setShowModal(true);
  };

  /* ===============================
     FETCH
  ================================*/
  const fetchCustomers = async () => {
    try {
      setError(null);
      setLoading(true);

      const res = await fetch("http://localhost:5000/customers");
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("❌ Failed to load customers. Please try again.");
      toast.error("❌ Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     CRUD
  ================================*/
  const saveCustomer = async () => {
    if (!name || !email || !phone || !serviceLocation) {
      toast.error("Name, Email, Phone, and Location are required");
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        const res = await fetch(`http://localhost:5000/customers/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, serviceLocation }),
        });
        if (!res.ok) throw new Error("Failed to update customer");
        toast.success("✅ Customer updated");
      } else {
        const res = await fetch("http://localhost:5000/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, serviceLocation }),
        });
        if (!res.ok) throw new Error("Failed to add customer");
        toast.success("✅ Customer added");
      }

      setName("");
      setEmail("");
      setPhone("");
      setServiceLocation("");
      setEditingId(null);
      fetchCustomers();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("❌ Failed to save customer");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (customer: any) => {
    setName(customer.name);
    setEmail(customer.email);
    setPhone(customer.phone || "");
    setServiceLocation(customer.serviceLocation || "");
    setEditingId(customer.id);
  };

  const handleDelete = (id: number) => {
    openConfirmModal("Are you sure you want to delete this customer?", async () => {
      try {
        setModalLoading(true);
        const res = await fetch(`http://localhost:5000/customers/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete customer");
        toast.success("🗑️ Customer deleted");
        fetchCustomers();
      } catch (err) {
        console.error("Delete error:", err);
        toast.error("❌ Failed to delete customer");
      } finally {
        setModalLoading(false);
        setShowModal(false);
      }
    });
  };

  /* ===============================
     BULK ACTIONS
  ================================*/
  const handleBulkAction = (action: "paid" | "unpaid" | "delete") => {
    if (selectedCustomers.length === 0) {
      toast.error("❌ No customers selected");
      return;
    }

    const message =
      action === "delete"
        ? "Are you sure you want to delete selected customers?"
        : `Mark selected customers as ${action.toUpperCase()}?`;

    openConfirmModal(message, async () => {
      setModalLoading(true);
      setIsBulkLoading(true);
      try {
        for (const id of selectedCustomers) {
          if (action === "delete") {
            await fetch(`http://localhost:5000/customers/${id}`, { method: "DELETE" });
          } else {
            await fetch(`http://localhost:5000/customers/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paid: action === "paid" }),
            });
          }
        }
        toast.success(`✅ Bulk action applied: ${action}`);
        setSelectedCustomers([]);
        fetchCustomers();
      } catch (err) {
        console.error("Bulk action error:", err);
        toast.error("❌ Failed bulk action");
      } finally {
        setModalLoading(false);
        setIsBulkLoading(false);
        setShowModal(false);
      }
    });
  };

  /* ===============================
     FILTER / SORT / SEARCH
  ================================*/
  useEffect(() => {
    let data = [...customers];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (c) => c.name?.toLowerCase().includes(lower) || c.email?.toLowerCase().includes(lower)
      );
    }

    if (filterStatus === "paid") {
      data = data.filter((c) => c.paid);
    } else if (filterStatus === "unpaid") {
      data = data.filter((c) => !c.paid);
    }

    data.sort((a, b) => {
      let valA = a[sortField] ?? "";
      let valB = b[sortField] ?? "";

      if (sortField === "paid") {
        valA = a.paid ? "1" : "0";
        valB = b.paid ? "1" : "0";
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredCustomers(data);
  }, [searchTerm, sortField, sortOrder, filterStatus, customers]);

  /* ===============================
     AUTH + LOAD
  ================================*/
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
        return;
      }
      fetchCustomers();
    };
    checkSession();
  }, [router]);

  /* ===============================
     EXPORT (with Phone + Location)
  ================================*/
  const exportData = (format: "csv" | "xlsx" | "pdf", type: "visible" | "all" | "selected") => {
    let dataToExport: any[] = [];

    if (type === "visible") dataToExport = filteredCustomers;
    else if (type === "all") dataToExport = customers;
    else if (type === "selected") dataToExport = customers.filter((c) =>
      selectedCustomers.includes(c.id)
    );

    if (dataToExport.length === 0) {
      toast.error("❌ No customers to export");
      return;
    }

    const filename =
      type === "visible"
        ? "customers_visible"
        : type === "all"
        ? "customers_all"
        : "customers_selected";

    if (format === "csv" || format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(
        dataToExport.map((c) => ({
          ID: c.id,
          Name: c.name,
          Email: c.email,
          Phone: c.phone || "",
          "Service Location": c.serviceLocation || "",
          Paid: c.paid ? "Paid" : "Unpaid",
          Notes: c.notes || "-",
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");
      XLSX.writeFile(wb, `${filename}.${format}`);
      toast.success(`✅ Exported ${type} customers as ${format.toUpperCase()}`);
    } else if (format === "pdf") {
      const doc = new jsPDF();
      (doc as any).autoTable({
        head: [["ID", "Name", "Email", "Phone", "Service Location", "Paid", "Notes"]],
        body: dataToExport.map((c) => [
          c.id,
          c.name,
          c.email,
          c.phone || "",
          c.serviceLocation || "",
          c.paid ? "Paid" : "Unpaid",
          c.notes || "-",
        ]),
      });
      doc.save(`${filename}.pdf`);
      toast.success(`✅ Exported ${type} customers as PDF`);
    }

    setShowExportMenu(false);
  };

  /* ===============================
     ANALYTICS
  ================================*/
  const total = customers.length;
  const paid = customers.filter((c) => c.paid).length;
  const unpaid = total - paid;

  /* ===============================
     RENDER
  ================================*/
  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <main className="p-6 max-w-6xl mx-auto">
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showModal}
        title="Please Confirm"
        message={modalMessage}
        onConfirm={modalAction}
        onCancel={() => setShowModal(false)}
        loading={modalLoading}
      />

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {/* ... (keeping your form code unchanged) ... */}

      {/* Analytics */}
      {/* ... (keeping your analytics code unchanged) ... */}

      {/* Controls */}
      {/* ... (keeping your controls code unchanged) ... */}

      {/* Bulk Actions */}
      {selectedCustomers.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-gray-100 p-3 rounded shadow">
          <span className="font-semibold">{selectedCustomers.length} selected</span>
          <button onClick={() => handleBulkAction("paid")} className="bg-green-500 text-white px-3 py-1 rounded">
            Mark Paid
          </button>
          <button onClick={() => handleBulkAction("unpaid")} className="bg-yellow-500 text-white px-3 py-1 rounded">
            Mark Unpaid
          </button>
          <button onClick={() => handleBulkAction("delete")} className="bg-red-500 text-white px-3 py-1 rounded">
            Delete Selected
          </button>
        </div>
      )}

      {/* Customer Table */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="mb-2 text-lg font-semibold">No customers found</p>
          <p className="mb-4 text-gray-600">Get started by adding a new one.</p>
          <button
            onClick={() => toast("🚀 Add Customer flow coming soon")}
            className="flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <PlusCircle size={18} className="mr-2" /> Add Customer
          </button>
        </div>
      ) : (
        <table className="w-full table-auto border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">
                <input
                  type="checkbox"
                  checked={selectedCustomers.length === filteredCustomers.length}
                  onChange={() =>
                    setSelectedCustomers(
                      selectedCustomers.length === filteredCustomers.length
                        ? []
                        : filteredCustomers.map((c) => c.id)
                    )
                  }
                />
              </th>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Phone</th>
              <th className="border px-4 py-2">Service Location</th>
              <th className="border px-4 py-2">Paid</th>
              <th className="border px-4 py-2">Notes</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="text-center">
                <td className="border px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(c.id)}
                    onChange={() =>
                      setSelectedCustomers((prev) =>
                        prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                      )
                    }
                  />
                </td>
                <td className="border px-4 py-2">{c.id}</td>

                {/* ✅ Safe Link for Name */}
                <td className="border px-4 py-2 text-blue-600 hover:underline">
                  {c.id ? <Link href={`/customers/${c.id}`}>{c.name}</Link> : c.name}
                </td>

                {/* ✅ Safe Link for Email */}
                <td className="border px-4 py-2 text-blue-600 hover:underline">
                  {c.id ? <Link href={`/customers/${c.id}`}>{c.email}</Link> : c.email}
                </td>

                <td className="border px-4 py-2">{c.phone || "-"}</td>
                <td className="border px-4 py-2">{c.serviceLocation || "-"}</td>
                <td className="border px-4 py-2">{c.paid ? "✅ Paid" : "❌ Unpaid"}</td>
                <td className="border px-4 py-2 text-left">{c.notes || "-"}</td>
                <td className="flex justify-center gap-3 border px-4 py-2">
                  <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-800">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
